// SPDX-License-Identifier: AGPL-3.0-only
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CMSSigningService } from './CMSSigningService'

const cli = process.env.PQC_A131_OPENSSL_BIN || 'openssl'
let directory: string
let signed: Uint8Array
let one: Uint8Array
let pqPem: string
let clPem: string
const commands: Record<string, unknown>[] = []
let service: CMSSigningService
let holdVerify = false
let finishVerify: (() => void) | undefined
// Controlled Worker transport, real native OpenSSL CMS bytes. Not the browser WASM worker.
class SampleWorker {
  listeners = new Set<(e: { data: unknown }) => void>()
  constructor() {
    queueMicrotask(() => this.emit({ type: 'READY' }))
  }
  addEventListener(_type: string, fn: (e: { data: unknown }) => void) {
    this.listeners.add(fn)
  }
  removeEventListener(_type: string, fn: (e: { data: unknown }) => void) {
    this.listeners.delete(fn)
  }
  terminate() {}
  emit(data: unknown) {
    for (const fn of this.listeners) fn({ data })
  }
  postMessage(message: Record<string, unknown>) {
    commands.push(message)
    const base = { requestId: message.requestId }
    queueMicrotask(() => {
      switch (message.type) {
        case 'CMS_GENKEY':
          this.emit({ ...base, type: 'CMS_GENKEY_RESULT', keyPem: 'controlled key', pubPem: '' })
          break
        case 'CMS_MKCERT':
          this.emit({
            ...base,
            type: 'CMS_MKCERT_RESULT',
            certPem: message.keyId === 'alice-pq' ? pqPem : clPem,
          })
          break
        case 'READ_VFS_FILE':
          this.emit({
            ...base,
            type: 'READ_VFS_FILE_RESULT',
            data: new TextEncoder().encode(
              String(message.path).includes('alice-pq') ? pqPem : clPem
            ),
          })
          break
        case 'CMS_DUAL_SIGN':
          this.emit({ ...base, type: 'CMS_DUAL_SIGN_RESULT', signedP7m: signed })
          break
        case 'CMS_DUAL_VERIFY': {
          const verify = () => {
            writeFileSync(join(directory, 'verify.der'), message.signedP7m as Uint8Array)
            try {
              execFileSync(
                cli,
                [
                  'cms',
                  '-verify',
                  '-noverify',
                  '-binary',
                  '-inform',
                  'DER',
                  '-in',
                  'verify.der',
                  '-out',
                  'out.bin',
                ],
                { cwd: directory, stdio: 'pipe' }
              )
              // Baseline worker reports the same fabricated count even for one signer.
              this.emit({
                ...base,
                type: 'CMS_DUAL_VERIFY_RESULT',
                ok: true,
                signerCount: 2,
                payload: new Uint8Array(readFileSync(join(directory, 'out.bin'))),
                stderr: 'CMS Verification successful',
              })
            } catch {
              this.emit({
                ...base,
                type: 'CMS_DUAL_VERIFY_RESULT',
                ok: false,
                signerCount: 0,
                stderr: 'CMS signature check failed',
              })
            }
          }
          if (holdVerify) finishVerify = verify
          else verify()
        }
      }
    })
  }
}
beforeAll(() => {
  const version = execFileSync(cli, ['version'], { encoding: 'utf8' })
  if (!/^OpenSSL 3\./.test(version))
    throw new Error('Set PQC_A131_OPENSSL_BIN to OpenSSL 3.x for the native CMS fixture')
  directory = mkdtempSync(join(tmpdir(), 'pqctoday-a131-service-'))
  const run = (args: string[]) => execFileSync(cli, args, { cwd: directory, stdio: 'pipe' })
  run(['genpkey', '-algorithm', 'ML-DSA-65', '-out', 'pq.key'])
  run(['genpkey', '-algorithm', 'EC', '-pkeyopt', 'ec_paramgen_curve:P-256', '-out', 'cl.key'])
  for (const id of ['pq', 'cl'])
    run([
      'req',
      '-new',
      '-x509',
      '-key',
      id + '.key',
      '-subj',
      '/CN=Fictional ' + id,
      '-out',
      id + '.crt',
      '-days',
      '1',
    ])
  writeFileSync(join(directory, 'payload'), 'Fictional A131 test')
  const base = ['cms', '-sign', '-signer', 'pq.crt', '-inkey', 'pq.key']
  const end = [
    '-in',
    'payload',
    '-binary',
    '-nodetach',
    '-outform',
    'DER',
    '-md',
    'sha256',
    '-out',
    'signed.der',
  ]
  run([...base, ...end])
  one = new Uint8Array(readFileSync(join(directory, 'signed.der')))
  run([...base, '-signer', 'cl.crt', '-inkey', 'cl.key', ...end])
  signed = new Uint8Array(readFileSync(join(directory, 'signed.der')))
  pqPem = readFileSync(join(directory, 'pq.crt'), 'utf8')
  clPem = readFileSync(join(directory, 'cl.crt'), 'utf8')
})
afterAll(() => {
  if (directory) rmSync(directory, { recursive: true, force: true })
  vi.unstubAllGlobals()
})
beforeEach(async () => {
  commands.length = 0
  holdVerify = false
  finishVerify = undefined
  vi.stubGlobal('Worker', SampleWorker)
  service = new CMSSigningService()
  await service.genKey('ML-DSA-65', 'alice-pq')
  await service.genKey('EC', 'alice-cl')
  await service.mkCert({ keyId: 'alice-pq', certId: 'alice-pq', subject: '/CN=Fictional pq' })
  await service.mkCert({ keyId: 'alice-cl', certId: 'alice-cl', subject: '/CN=Fictional cl' })
})
const options = () => ({ signedP7m: signed, pqCertId: 'alice-pq', classicalCertId: 'alice-cl' })
describe('fixed workshop CMS pair at the service boundary', () => {
  it('jointly verifies the actual pair and reports parsed count and payload', async () => {
    const result = await service.dualVerify(options())
    expect(result).toMatchObject({ ok: true, signerCount: 2 })
    expect(new TextDecoder().decode(result.payload)).toBe('Fictional A131 test')
    expect(commands.filter((m) => m.type === 'CMS_DUAL_VERIFY')).toHaveLength(1)
    service.dispose()
  })
  it('rejects a valid one-signer container before the worker can fabricate two', async () => {
    const result = await service.dualVerify({ ...options(), signedP7m: one })
    expect(result.ok).toBe(false)
    expect(result.payload).toBeUndefined()
    expect(result.stderr).toMatch(/two SignerInfos/)
    expect(commands.filter((m) => m.type === 'CMS_DUAL_VERIFY')).toHaveLength(0)
    service.dispose()
  })
  it('rejects a different certificate assignment rather than trusting embedded signers', async () => {
    const result = await service.dualVerify({ ...options(), classicalCertId: 'not-generated' })
    expect(result.ok).toBe(false)
    expect(commands.filter((m) => m.type === 'CMS_DUAL_VERIFY')).toHaveLength(0)
    service.dispose()
  })
  it('inspects produced CMS before returning it as a dual-signed artifact', async () => {
    const result = await service.dualSign({
      payload: new TextEncoder().encode('Fictional A131 test'),
      pqKeyId: 'alice-pq',
      pqCertId: 'alice-pq',
      classicalKeyId: 'alice-cl',
      classicalCertId: 'alice-cl',
    })
    expect(Array.from(result.signedP7m)).toEqual(Array.from(signed))
    await expect(
      service.dualSign({
        payload: new Uint8Array(),
        pqKeyId: 'wrong-key',
        pqCertId: 'alice-pq',
        classicalKeyId: 'alice-cl',
        classicalCertId: 'alice-cl',
      })
    ).rejects.toThrow(/Unexpected workshop signer keys/)
    service.dispose()
  })
  it('keeps altered signature mathematics rejected after pair inspection', async () => {
    const changed = signed.slice()
    changed[changed.length - 1] ^= 1
    const result = await service.dualVerify({ ...options(), signedP7m: changed })
    expect(result).toMatchObject({ ok: false, signerCount: 2 })
    expect(result.payload).toBeUndefined()
    expect(commands.filter((m) => m.type === 'CMS_DUAL_VERIFY')).toHaveLength(1)
    service.dispose()
  })
  it('does not attribute a late successful joint result to regenerated signer context', async () => {
    holdVerify = true
    const pending = service.dualVerify(options())
    // Reach the actual pending worker command; no wall-clock delay or timeout.
    for (let i = 0; i < 6 && !finishVerify; i++) await Promise.resolve()
    expect(finishVerify).toBeTypeOf('function')
    await service.genKey('EC', 'alice-cl')
    await service.mkCert({ keyId: 'alice-cl', certId: 'alice-cl', subject: '/CN=Fictional cl' })
    finishVerify!()
    const result = await pending
    expect(result.ok).toBe(false)
    expect(result.payload).toBeUndefined()
    expect(result.stderr).toMatch(/context changed/)
    service.dispose()
  })
  it('does not reuse a certificate after regenerating its key or changing key mode', async () => {
    await service.genKey('EC', 'alice-cl', true)
    expect((await service.dualVerify(options())).ok).toBe(false)
    expect(commands.filter((m) => m.type === 'CMS_DUAL_VERIFY')).toHaveLength(0)
    service.dispose()
  })
})
