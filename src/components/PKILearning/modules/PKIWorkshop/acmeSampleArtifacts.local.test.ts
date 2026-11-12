// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Pkcs10CertificateRequest, PemConverter } from '@peculiar/x509'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { base64urlnopad } from '@scure/base'
import {
  generateAcmeSampleArtifacts,
  inspectAcmeSampleArtifacts,
  type AcmeSampleArtifacts,
} from './acmeSampleArtifacts'
import { parseOpensslArgs } from '@/components/OpenSSLStudio/worker/commandParser'
import {
  newModule,
  runOpenssl,
  writeFile,
  listNewOutputFiles,
  readFileBin,
} from '@/test/kat/openssl-driver'
import type { OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'

const calls = vi.hoisted(() => ({ execute: vi.fn(), deleteFile: vi.fn() }))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: calls }))
type FileInput = { name: string; data: Uint8Array }
async function realExecute(
  command: string,
  files: FileInput[] = []
): Promise<OpenSSLCommandResult> {
  const module = await newModule({ quiet: true })
  for (const file of files) writeFile(module, `/${file.name}`, file.data)
  const result = runOpenssl(module, parseOpensslArgs(command))
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    files: listNewOutputFiles(module, new Set(files.map((file) => file.name))).map((name) => ({
      name,
      data: readFileBin(module, `/${name}`),
    })),
    ...(result.rc ? { error: `Sample OpenSSL command failed (${result.rc})` } : {}),
  }
}
class RequestBytes extends Pkcs10CertificateRequest {
  get publicBytes() {
    return new Uint8Array(this.asn.certificationRequestInfo.subjectPKInfo.subjectPublicKey)
  }
  get signedBytes() {
    return new Uint8Array(
      this.asn.certificationRequestInfoRaw ??
        AsnConvert.serialize(this.asn.certificationRequestInfo)
    )
  }
  tamperSignature() {
    const signature = new Uint8Array(this.asn.signature).slice()
    signature[signature.length - 1] ^= 1
    this.asn.signature = signature.buffer
    return PemConverter.encode(AsnConvert.serialize(this.asn), 'CERTIFICATE REQUEST')
  }
}
let first: AcmeSampleArtifacts
let second: AcmeSampleArtifacts
beforeAll(async () => {
  calls.execute.mockImplementation(realExecute)
  calls.deleteFile.mockResolvedValue(undefined)
  first = await generateAcmeSampleArtifacts(() => true)
  second = await generateAcmeSampleArtifacts(() => true)
}, 60_000)
function fixtureExecute(command: string): Promise<OpenSSLCommandResult> {
  const args = parseOpensslArgs(command)
  const filename = args.at(args.indexOf('-out') + 1)!
  const value =
    args[0] === 'genpkey'
      ? 'controlled private-key handoff'
      : args[0] === 'pkey'
        ? first.publicKeyPem
        : first.csrPem
  return Promise.resolve({
    stdout: '',
    stderr: args.includes('-verify') ? 'Certificate request self-signature verify OK' : '',
    files: args.includes('-verify')
      ? []
      : [{ name: filename, data: new TextEncoder().encode(value) }],
  })
}
beforeEach(() => {
  calls.execute.mockReset().mockImplementation(fixtureExecute)
  calls.deleteFile.mockReset().mockResolvedValue(undefined)
})

describe('current-run ACME public sample artifacts', () => {
  it('uses real OpenSSL outputs whose CSR signature independently verifies and whose exported keys match', () => {
    expect(first.publicKeyPem).not.toBe(second.publicKeyPem)
    for (const artifacts of [first, second]) {
      const request = new RequestBytes(artifacts.csrPem)
      expect(
        ml_dsa65.verify(new Uint8Array(request.signature), request.signedBytes, request.publicBytes)
      ).toBe(true)
      expect(inspectAcmeSampleArtifacts(artifacts.csrPem, artifacts.publicKeyPem)).toEqual(
        artifacts
      )
      expect(base64urlnopad.decode(artifacts.csrDerBase64Url)).toEqual(
        new Uint8Array(request.rawData)
      )
      expect(JSON.stringify(artifacts)).not.toContain('PRIVATE KEY')
    }
  })
  it.each([
    ['wrong subject', 'CN = other.example', 'DNS:example.com', /subject must identify/],
    ['wrong DNS name', 'CN = example.com', 'DNS:other.example', /DNS names do not match/],
    [
      'extra DNS name',
      'CN = example.com',
      'DNS:example.com,DNS:other.example',
      /DNS names do not match/,
    ],
  ] as const)(
    'rejects a correctly self-signed sample with %s',
    async (_label, cn, dns, message) => {
      calls.execute.mockImplementation((command: string, files: FileInput[] = []) =>
        realExecute(
          command,
          files.map((file) =>
            file.name.endsWith('.cnf')
              ? {
                  ...file,
                  data: new TextEncoder().encode(
                    new TextDecoder()
                      .decode(file.data)
                      .replace('CN = example.com', cn)
                      .replace('DNS:example.com', dns)
                  ),
                }
              : file
          )
        )
      )
      await expect(generateAcmeSampleArtifacts(() => true)).rejects.toThrow(message)
      expect(calls.execute.mock.calls.some(([command]) => command.includes('req -verify'))).toBe(
        true
      )
    }
  )
  it('forwards the exact current key to both dependent operations and keeps it outside returned artifacts', async () => {
    const artifacts = await generateAcmeSampleArtifacts(() => true)
    const keyFile = calls.execute.mock.calls[1][1][0]
    expect(calls.execute.mock.calls[2][1][0]).toEqual(keyFile)
    expect(calls.execute.mock.calls[1][0]).toContain(`-in ${keyFile.name}`)
    expect(calls.execute.mock.calls[2][0]).toContain(`-key ${keyFile.name}`)
    expect(calls.execute.mock.calls[3][0]).toContain('req -verify')
    expect(calls.deleteFile).toHaveBeenCalledWith(keyFile.name)
    expect(Object.keys(artifacts).sort()).toEqual([
      'csrDerBase64Url',
      'csrPem',
      'publicKeyPem',
      'subject',
    ])
  })
  it('rejects a different genuine ML-DSA65 public key rather than matching algorithm labels alone', () => {
    expect(() => inspectAcmeSampleArtifacts(first.csrPem, second.publicKeyPem)).toThrow(
      /does not match/
    )
  })
  it('rejects a tampered signature in both the existing OpenSSL operation and independent verifier', async () => {
    const tampered = new RequestBytes(first.csrPem).tamperSignature()
    const request = new RequestBytes(tampered)
    expect(
      ml_dsa65.verify(new Uint8Array(request.signature), request.signedBytes, request.publicBytes)
    ).toBe(false)
    const result = await realExecute('openssl req -verify -in changed.csr.pem -noout', [
      { name: 'changed.csr.pem', data: new TextEncoder().encode(tampered) },
    ])
    expect(result.error || !`${result.stdout}\n${result.stderr}`.includes('verify OK')).toBeTruthy()
    calls.execute.mockImplementation(async (command: string) => {
      const result = await fixtureExecute(command)
      if (command.includes('req -new')) result.files[0].data = new TextEncoder().encode(tampered)
      if (command.includes('req -verify'))
        return realExecute(command, [
          { name: parseOpensslArgs(command)[3], data: new TextEncoder().encode(tampered) },
        ])
      return result
    })
    await expect(generateAcmeSampleArtifacts(() => true)).rejects.toThrow(/self-signature/)
  })
  it.each(['CERTIFICATE REQUEST', 'PUBLIC KEY'] as const)(
    'rejects trailing bytes after %s DER',
    (tag) => {
      const original = tag === 'PUBLIC KEY' ? first.publicKeyPem : first.csrPem
      const der = new Uint8Array(PemConverter.decode(original)[0])
      const changed = new Uint8Array(der.length + 1)
      changed.set(der)
      changed[der.length] = 0
      const pem = PemConverter.encode(changed, tag)
      expect(() =>
        inspectAcmeSampleArtifacts(
          tag === 'PUBLIC KEY' ? first.csrPem : pem,
          tag === 'PUBLIC KEY' ? pem : first.publicKeyPem
        )
      ).toThrow(/trailing/)
    }
  )
  it('rejects a complete BER indefinite-length envelope instead of normalizing it into DER', () => {
    const der = new Uint8Array(PemConverter.decode(first.csrPem)[0])
    const headerLength = der[1] < 128 ? 2 : 2 + (der[1] & 127)
    const ber = new Uint8Array(2 + der.length - headerLength + 2)
    ber.set([0x30, 0x80])
    ber.set(der.subarray(headerLength), 2)
    const changed = PemConverter.encode(ber, 'CERTIFICATE REQUEST')
    expect(() => inspectAcmeSampleArtifacts(changed, first.publicKeyPem)).toThrow(
      /complete DER-encoded request/
    )
  })
  it('rejects a mismatched algorithm/parameters in a parseable public-key structure', () => {
    const spki = AsnConvert.parse(PemConverter.decode(first.publicKeyPem)[0], SubjectPublicKeyInfo)
    spki.algorithm.parameters = new Uint8Array([5, 0]).buffer
    const changed = PemConverter.encode(AsnConvert.serialize(spki), 'PUBLIC KEY')
    expect(() => inspectAcmeSampleArtifacts(first.csrPem, changed)).toThrow(
      /absent algorithm parameters/
    )
  })
  it.each(['genpkey', 'pkey', 'req -new', 'req -verify'])(
    'rejects an operational %s failure without publishing artifacts',
    async (stage) => {
      calls.execute.mockImplementation(async (command: string) =>
        command.includes(`openssl ${stage}`)
          ? { stdout: '', stderr: '', files: [], error: 'Controlled operation failure' }
          : fixtureExecute(command)
      )
      await expect(generateAcmeSampleArtifacts(() => true)).rejects.toThrow()
      expect(calls.deleteFile).toHaveBeenCalledTimes(1)
    }
  )
  it.each(['genpkey', 'pkey', 'req -new'])('rejects missing/empty %s output', async (stage) => {
    calls.execute.mockImplementation(async (command: string) => {
      const result = await fixtureExecute(command)
      if (command.includes(`openssl ${stage}`)) result.files[0].data = new Uint8Array()
      return result
    })
    await expect(generateAcmeSampleArtifacts(() => true)).rejects.toThrow(/nonempty/)
  })
  it('rejects a quiet verification response instead of assuming success', async () => {
    calls.execute.mockImplementation(async (command: string) => {
      const result = await fixtureExecute(command)
      if (command.includes('req -verify')) result.stderr = ''
      return result
    })
    await expect(generateAcmeSampleArtifacts(() => true)).rejects.toThrow(/could not be verified/)
  })
  it('stops obsolete dependent operations after a pending key operation settles', async () => {
    let current = true
    let finish!: (value: OpenSSLCommandResult) => void
    calls.execute.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const pending = generateAcmeSampleArtifacts(() => current)
    current = false
    finish(await fixtureExecute(calls.execute.mock.calls[0][0]))
    await expect(pending).rejects.toThrow(/no longer current/)
    expect(calls.execute).toHaveBeenCalledTimes(1)
  })
})
