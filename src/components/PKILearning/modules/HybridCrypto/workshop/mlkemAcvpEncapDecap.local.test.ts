// SPDX-License-Identifier: AGPL-3.0-only
//
// The NIST ACVP-Server ML-KEM-768 encapDecap sample shown in the Hybrid Key
// Generation workshop panel, replayed against the REAL engines (Rust
// wasm-bindgen engine as the browser uses it, and the C++ Emscripten engine
// loaded in Node). Every case must come back exactly as NIST's
// expectedResults.json says: the encapsulation ciphertext and shared secret
// equal NIST's, valid and modified-ciphertext decapsulation return NIST's k,
// valid keys are accepted and invalid ones rejected. Nothing is mocked.
//
// Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { loadEncapDecapCases, runEncapDecapSample } from './mlkemAcvpEncapDecap'

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
])('NIST ACVP ML-KEM-768 encapDecap sample (%s engine)', (_name, getModule) => {
  let M: SoftHSMModule
  let hSession = 0

  beforeAll(async () => {
    M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'AcvpEncapDecap')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  it('returns NIST’s expected answer for every case', async () => {
    const cases = await loadEncapDecapCases()
    const results = await runEncapDecapSample(M as never, hSession)
    expect(results).toHaveLength(cases.length)
    for (const r of results) {
      expect(r.status, `tg${r.tgId}/tc${r.tcId} (${r.function}, ${r.label}): ${r.observed}`).toBe(
        'pass'
      )
    }
    // Every case type, both polarities, or the pass would prove little.
    for (const f of [
      'encapsulation',
      'decapsulation',
      'encapsulationKeyCheck',
      'decapsulationKeyCheck',
    ])
      expect(
        results.some((r) => r.function === f),
        f
      ).toBe(true)
    expect(results.some((r) => r.label === 'modified ciphertext')).toBe(true)
    expect(results.some((r) => r.testPassed === true)).toBe(true)
    expect(results.some((r) => r.testPassed === false)).toBe(true)
  }, 120_000)
})
