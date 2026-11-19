// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { newModule, runOpenssl, writeFile, readFileBin } from '@/test/kat/openssl-driver'
import { runCertificateTlsExercise, type CertificateTlsEngine } from './certificateTlsExercise'

/** Same commands and simulator entry point as the browser, on the shipped WASM. */
const engine: CertificateTlsEngine = {
  async execute(command, files = []) {
    const M = await newModule({ quiet: true })
    for (const f of files) writeFile(M, '/' + f.name.replace(/^\//, ''), f.data)
    const args = Array.from(
      command.replace(/^openssl /, '').matchAll(/[^\s"]+|"([^"]*)"/g),
      (m) => m[1] ?? m[0]
    )
    const result = runOpenssl(M, args)
    if (result.rc !== 0) throw new Error(result.stderr)
    const outputs = M.FS.readdir('/').filter((f) => /\.(pem|key|csr)$/.test(f))
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      files: outputs.map((name) => ({ name, data: readFileBin(M, '/' + name) })),
    }
  },
  async simulateTLS(client, server, files = [], commands = []) {
    const M = await newModule({ quiet: true })
    for (const f of files) writeFile(M, '/' + f.name, f.data)
    writeFile(M, '/ssl/client.cnf', client)
    writeFile(M, '/ssl/server.cnf', server)
    writeFile(M, '/ssl/commands.txt', commands.join('\n') + '\n')
    const simulator = M as typeof M & {
      cwrap: (name: string, result: string, args: string[]) => (...paths: string[]) => string
    }
    return simulator.cwrap('execute_tls_simulation', 'string', ['string', 'string', 'string'])(
      '/ssl/client.cnf',
      '/ssl/server.cnf',
      '/ssl/commands.txt'
    ) as string
  },
}

describe('certificate-to-TLS exercise with shipped OpenSSL', () => {
  it('authenticates all three RFC 10024 groups and rejects a mismatched peer and a KEM signer', async () => {
    const result = await runCertificateTlsExercise(engine)
    expect(result.runs).toHaveLength(6)
    expect(result.runs.filter((r) => !r.passed)).toEqual([])
    expect(result.checks).toHaveLength(12)
    expect(
      result.checks.filter((c) => !c.passed),
      JSON.stringify(result.checks)
    ).toEqual([])
    expect(result.runs[3]).toMatchObject({
      group: 'X25519MLKEM768',
      signature: 'rsa_pss_rsae_sha256',
      subjectKey: 'rsaEncryption',
      issuerSignature: 'ML-DSA-65',
      passed: true,
    })
    expect(
      result.runs.slice(4).map(({ group, subjectKey, observedSignature }) => ({
        group,
        subjectKey,
        signatureMatches: /rsa_pss_rsae_sha256/i.test(observedSignature),
      }))
    ).toEqual([
      { group: 'SecP256r1MLKEM768', subjectKey: 'rsaEncryption', signatureMatches: true },
      { group: 'SecP384r1MLKEM1024', subjectKey: 'rsaEncryption', signatureMatches: true },
    ])
    expect(result.kemAuthenticationRejected).toBe(true)
    expect(result.certificates).toHaveLength(4)
    expect(result.certificates.every((c) => c.pem.includes('BEGIN CERTIFICATE'))).toBe(true)
  }, 120_000)
})
