// SPDX-License-Identifier: AGPL-3.0-only
//
// The NIST ACVP-Server SLH-DSA sigVer sample shown in the SLH-DSA workshop
// panel, replayed against the REAL engines (Rust wasm-bindgen engine as the
// browser uses it, and the C++ Emscripten engine loaded in Node). Each case
// must come back exactly as NIST's expectedResults.json says: the valid
// signatures accepted, every modified or wrong-length signature or message
// rejected. Nothing is mocked.
//
// Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { runSigVerSample, loadSigVerSample } from './slhdsaAcvpSigVer'

const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'): in a
  // worktree whose node_modules is symlinked to a sibling worktree, the package
  // path would resolve to the sibling's binary (see keyLabelRoundTrip.local.test.ts).
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

describe.each([
  ['rust', () => S.getSoftHSMRustModule()],
  ['cpp', () => loadCppEngineInNode()],
])('NIST ACVP SLH-DSA sigVer sample (%s engine)', (_name, getModule) => {
  let M: SoftHSMModule
  let hSession = 0

  beforeAll(async () => {
    M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'AcvpSigVer')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  it('returns NIST’s expected answer for every case', async () => {
    const sample = await loadSigVerSample()
    const results = await runSigVerSample(M, hSession)

    expect(results).toHaveLength(sample.testGroups.reduce((n, g) => n + g.tests.length, 0))
    for (const r of results) {
      expect(r.status, `tg${r.tgId}/tc${r.tcId} (${r.reason}): ${r.details}`).toBe('pass')
      expect(r.accepted, `tg${r.tgId}/tc${r.tcId}`).toBe(r.testPassed)
    }
    // The sample must contain both polarities, or the pass would prove little.
    expect(results.some((r) => r.testPassed)).toBe(true)
    expect(results.some((r) => !r.testPassed)).toBe(true)
  }, 120_000)

  it('turns exactly the sabotaged cases red when NIST’s expectation is flipped (copy of the sample)', async () => {
    const real = await loadSigVerSample()
    const flipped = structuredClone(real)
    const [validTest] = flipped.testGroups[0].tests.filter((t) => t.testPassed)
    const [invalidTest] = flipped.testGroups[1].tests.filter((t) => !t.testPassed)
    validTest.testPassed = false
    invalidTest.testPassed = true
    vi.resetModules()
    vi.doMock('../data/slhdsaAcvpSigVerSample.json', () => ({ default: flipped }))
    try {
      const { runSigVerSample: runFlipped } = await import('./slhdsaAcvpSigVer')
      const results = await runFlipped(M, hSession)
      const red = results.filter((r) => r.status !== 'pass').map((r) => `${r.tgId}/${r.tcId}`)
      expect(red.sort()).toEqual(
        [
          `${flipped.testGroups[0].tgId}/${validTest.tcId}`,
          `${flipped.testGroups[1].tgId}/${invalidTest.tcId}`,
        ].sort()
      )
      expect(results.filter((r) => r.status === 'fail')).toHaveLength(2)
    } finally {
      vi.doUnmock('../data/slhdsaAcvpSigVerSample.json')
      vi.resetModules()
    }
  }, 120_000)
})
