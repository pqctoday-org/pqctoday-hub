// SPDX-License-Identifier: AGPL-3.0-only
//
// The NIST ACVP-Server LMS sigVer samples shown in the Stateful Signatures
// workshop panel, replayed against the REAL engines (Rust wasm-bindgen engine as
// the browser uses it, and the C++ Emscripten engine loaded in Node). Each case
// must come back exactly as NIST's expectedResults.json says. Nothing is mocked.
//
// Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { runLmsSigVerSample, loadLmsSigVerSample } from './lmsAcvpSigVer'

const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

describe.each([
  ['rust', () => S.getSoftHSMRustModule()],
  ['cpp', () => loadCppEngineInNode()],
])('NIST ACVP LMS sigVer sample (%s engine)', (_name, getModule) => {
  let M: SoftHSMModule
  let hSession = 0

  beforeAll(async () => {
    M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'AcvpLmsSigVer')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  it('returns NIST’s expected answer for every case', async () => {
    const sample = await loadLmsSigVerSample()
    const results = await runLmsSigVerSample(M, hSession)

    expect(results).toHaveLength(sample.testGroups.reduce((n, g) => n + g.tests.length, 0))
    for (const r of results) {
      expect(r.status, `${r.revision} tg${r.tgId}/tc${r.tcId} (${r.reason}): ${r.details}`).toBe(
        'pass'
      )
      expect(r.accepted, `${r.revision} tg${r.tgId}/tc${r.tcId}`).toBe(r.testPassed)
      expect(r.returned).toBe(r.testPassed ? 'CKR_OK' : 'CKR_SIGNATURE_INVALID')
    }
    // The sample must contain both polarities, or the pass would prove little.
    expect(results.some((r) => r.testPassed)).toBe(true)
    expect(results.some((r) => !r.testPassed)).toBe(true)
  }, 120_000)

  it('turns exactly the sabotaged cases red when NIST’s expectation is flipped (copy of the sample)', async () => {
    const real = await loadLmsSigVerSample()
    const flipped = structuredClone(real)
    const validTest = flipped.testGroups[0].tests.find((t) => t.testPassed)!
    const invalidTest = flipped.testGroups[1].tests.find((t) => !t.testPassed)!
    validTest.testPassed = false
    invalidTest.testPassed = true
    vi.resetModules()
    vi.doMock('../data/lmsAcvpSigVerSample.json', () => ({ default: flipped }))
    try {
      const { runLmsSigVerSample: runFlipped } = await import('./lmsAcvpSigVer')
      const results = await runFlipped(M, hSession)
      const red = results
        .filter((r) => r.status !== 'pass')
        .map((r) => `${r.revision}/${r.tgId}/${r.tcId}`)
      expect(red.sort()).toEqual(
        [
          `${flipped.testGroups[0].revision}/${flipped.testGroups[0].tgId}/${validTest.tcId}`,
          `${flipped.testGroups[1].revision}/${flipped.testGroups[1].tgId}/${invalidTest.tcId}`,
        ].sort()
      )
      expect(results.filter((r) => r.status === 'fail')).toHaveLength(2)
    } finally {
      vi.doUnmock('../data/lmsAcvpSigVerSample.json')
      vi.resetModules()
    }
  }, 120_000)

  it('rejects a signature whose bytes are really altered, not only one NIST labelled (byte flipped in a copy of a valid case)', async () => {
    const real = await loadLmsSigVerSample()
    const valid = structuredClone(real)
    // keep one group, one valid case, and flip a byte in the middle of its signature
    const g = valid.testGroups[0]
    const t = g.tests.find((x) => x.testPassed)!
    const mid = Math.floor(t.signature.length / 4) * 2
    t.signature =
      t.signature.slice(0, mid) +
      (t.signature.slice(mid, mid + 2) === 'AA' ? 'BB' : 'AA') +
      t.signature.slice(mid + 2)
    t.testPassed = false
    g.tests = [t]
    valid.testGroups = [g]
    vi.resetModules()
    vi.doMock('../data/lmsAcvpSigVerSample.json', () => ({ default: valid }))
    try {
      const { runLmsSigVerSample: runAltered } = await import('./lmsAcvpSigVer')
      const results = await runAltered(M, hSession)
      expect(results).toHaveLength(1)
      expect(results[0].returned).toBe('CKR_SIGNATURE_INVALID')
      expect(results[0].status).toBe('pass')
    } finally {
      vi.doUnmock('../data/lmsAcvpSigVerSample.json')
      vi.resetModules()
    }
  }, 120_000)
})
