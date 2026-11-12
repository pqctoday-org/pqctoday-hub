// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createPublicKey, sign, verify, webcrypto, X509Certificate } from 'node:crypto'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { OpenSSLCryptoProvider } from './openssl-crypto-provider'
import { DualCryptoProvider } from './dual-crypto-provider'
import { signAndVerifySampleBinding, verifyIssuedSampleJwt } from './sampleProof'
import { generateX509Certificate } from './x509-utils'

vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn(), deleteFile: vi.fn() },
}))

const profiles = [
  { alg: 'ES256', curve: 'P-256', bytes: 64, hash: 'sha256' },
  { alg: 'ES384', curve: 'P-384', bytes: 96, hash: 'sha384' },
] as const
const openssl = process.env.PQC_A117_OPENSSL_BIN ?? 'openssl'
const message = 'Fictional Digital ID signing input — €'
let directory: string
let signatureOverride: Uint8Array | undefined

beforeAll(() => {
  let version: string
  try {
    version = execFileSync(openssl, ['version'], { encoding: 'utf8' }).trim()
  } catch (cause) {
    throw new Error(
      'A117 requires an OpenSSL 3.x CLI fixture. Set PQC_A117_OPENSSL_BIN to its executable.',
      { cause }
    )
  }
  if (!/^OpenSSL 3\./.test(version)) {
    throw new Error(
      `A117 requires an OpenSSL 3.x CLI fixture; selected ${openssl} reports ${version}. ` +
        'Set PQC_A117_OPENSSL_BIN to the OpenSSL 3.x executable; LibreSSL is not this fixture.'
    )
  }
})

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'pqctoday-a117-'))
  signatureOverride = undefined
  vi.clearAllMocks()
  // The existing service's command/files interface runs actual OpenSSL here.
  // This controlled CLI transport is not the browser WASM worker.
  vi.mocked(openSSLService.execute).mockImplementation(async (command, files = []) => {
    for (const file of files) {
      if (basename(file.name) !== file.name) throw new Error('Unexpected fixture path')
      writeFileSync(join(directory, file.name), file.data)
    }
    const argv = command.split(' ')
    if (argv.shift() !== 'openssl') throw new Error('Unexpected fixture command')
    let stdout = ''
    let error: string | undefined
    try {
      stdout = execFileSync(openssl, argv, { cwd: directory, encoding: 'utf8', stdio: 'pipe' })
      if (signatureOverride && argv.includes('-sign')) {
        const name = argv[argv.indexOf('-out') + 1]
        writeFileSync(join(directory, name), signatureOverride)
      }
    } catch (cause) {
      const failure = cause as { stderr?: Buffer; message?: string }
      error = failure.stderr?.toString() || failure.message || 'OpenSSL command failed'
    }
    return {
      stdout,
      stderr: error ?? '',
      error,
      files: readdirSync(directory).map((name) => ({
        name,
        data: new Uint8Array(readFileSync(join(directory, name))),
      })),
    }
  })
  vi.mocked(openSSLService.deleteFile).mockImplementation(async (name) => {
    if (basename(name) !== name) throw new Error('Unexpected fixture path')
    try {
      unlinkSync(join(directory, name))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  })
})

afterEach(() => {
  // Remove only the directory returned by this test's mkdtemp call.
  rmSync(directory, { recursive: true })
})

describe('OpenSSL provider existing ECDSA JOSE boundary', () => {
  it.each(profiles)(
    'emits independently verifiable $alg JOSE bytes from actual OpenSSL',
    async (p) => {
      const provider = new OpenSSLCryptoProvider()
      const key = await provider.generateKeyPair(p.alg, p.curve)
      const encoded = await provider.signData(key, message)
      const signature = Buffer.from(encoded, 'base64url')
      const pem = atob(key.publicKey)
      expect(signature).toHaveLength(p.bytes)
      expect(
        verify(p.hash, Buffer.from(message), { key: pem, dsaEncoding: 'ieee-p1363' }, signature)
      ).toBe(true)
      const jwk = createPublicKey(pem).export({ format: 'jwk' })
      const publicKey = await webcrypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: p.curve },
        false,
        ['verify']
      )
      expect(
        await webcrypto.subtle.verify(
          { name: 'ECDSA', hash: p.alg === 'ES256' ? 'SHA-256' : 'SHA-384' },
          publicKey,
          new Uint8Array(signature),
          new TextEncoder().encode(message)
        )
      ).toBe(true)
      expect(await provider.verifySignature(key, encoded, message)).toBe(true)
      expect(await provider.verifySignature(key, encoded, `${message}!`)).toBe(false)
    }
  )

  it.each(profiles)(
    'accepts independent $alg JOSE signatures and rejects wrong-width input',
    async (p) => {
      const provider = new OpenSSLCryptoProvider()
      const key = await provider.generateKeyPair(p.alg, p.curve)
      const independent = sign(p.hash, Buffer.from(message), {
        key: atob(key.privateKey!),
        dsaEncoding: 'ieee-p1363',
      })
      expect(await provider.verifySignature(key, independent.toString('base64url'), message)).toBe(
        true
      )
      vi.mocked(openSSLService.execute).mockClear()
      expect(
        await provider.verifySignature(key, independent.subarray(1).toString('base64url'), message)
      ).toBe(false)
      expect(openSSLService.execute).not.toHaveBeenCalled()
      expect(await provider.verifySignature(key, '%%%invalid', message)).toBe(false)
    }
  )

  it.each(profiles)(
    'preserves $alg raw DER and independently verifiable X509 certificates',
    async (p) => {
      const provider = new OpenSSLCryptoProvider()
      const key = await provider.generateKeyPair(p.alg, p.curve)
      const raw = await provider.signRaw(key, new TextEncoder().encode(message))
      expect(raw[0]).toBe(0x30)
      expect(verify(p.hash, Buffer.from(message), atob(key.publicKey), raw)).toBe(true)
      const pem = await generateX509Certificate(key, provider, '/CN=Fictional A117 Sample')
      expect(new X509Certificate(pem).verify(createPublicKey(atob(key.publicKey)))).toBe(true)
    }
  )

  it('rejects a mismatched existing algorithm/curve before running a command', async () => {
    const provider = new OpenSSLCryptoProvider()
    const key = await provider.generateKeyPair('ES256', 'P-256')
    vi.mocked(openSSLService.execute).mockClear()
    await expect(provider.signData({ ...key, curve: 'P-384' }, message)).rejects.toThrow()
    await expect(
      provider.verifySignature({ ...key, curve: 'P-384' }, 'AA', message)
    ).rejects.toThrow()
    expect(openSSLService.execute).not.toHaveBeenCalled()
  })

  it.each([
    new Uint8Array([0x30, 6, 2, 1, 0, 2, 1, 1]), // invalid zero scalar
    new Uint8Array([0x30, 6, 2, 1, 0x80, 2, 1, 1]), // negative INTEGER
    new Uint8Array([0x30, 7, 2, 2, 0, 1, 2, 1, 1]), // nonminimal INTEGER
    new Uint8Array([0x30, 6, 2, 1, 1, 2, 1]), // truncated
    new Uint8Array([0x30, 6, 2, 1, 1, 2, 1, 1, 0]), // trailing byte
  ])('rejects malformed native DER instead of publishing it as JOSE', async (bytes) => {
    const provider = new OpenSSLCryptoProvider()
    const key = await provider.generateKeyPair('ES256', 'P-256')
    signatureOverride = bytes
    await expect(provider.signData(key, message)).rejects.toThrow()
  })

  it.each(profiles)('keeps $alg sampleProof, QES-style and DualProvider roundtrips', async (p) => {
    const primary = new OpenSSLCryptoProvider()
    const key = await primary.generateKeyPair(p.alg, p.curve)
    await expect(signAndVerifySampleBinding(primary, key, message)).resolves.toBeUndefined()
    const documentHash = await primary.sha256Hash(message)
    const signature = await primary.signData(key, documentHash)
    expect(await primary.verifySignature(key, signature, documentHash)).toBe(true)
    const dual = new DualCryptoProvider(primary, new OpenSSLCryptoProvider())
    const header = Buffer.from(JSON.stringify({ alg: p.alg, typ: 'JWT' })).toString('base64url')
    const input = `${header}.eyJzYW1wbGUiOnRydWV9`
    const jwt = `${input}.${await dual.signData(key, input)}`
    await expect(verifyIssuedSampleJwt(dual, key, jwt)).resolves.toBeUndefined()
    await expect(
      verifyIssuedSampleJwt(dual, key, jwt.replace('eyJzYW1wbGUi', 'eCJzYW1wbGUi'))
    ).rejects.toThrow()
  })
})
