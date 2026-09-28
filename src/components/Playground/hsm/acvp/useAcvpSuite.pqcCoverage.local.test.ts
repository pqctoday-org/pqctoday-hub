// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the gap-closure P5 PQC coverage sections — sections/mldsaNegBoundary.ts
// (5f), sections/mlkemKeyCheckDepth.ts (7c) and sections/slhdsaCoverage.ts (9d) —
// driven through the REAL useAcvpSuite hook in dual-engine mode (C++ Emscripten
// engine in Node + Rust wasm-bindgen).
//
// What it proves:
//  - every NIST ML-DSA sigVer depth case (context 0/255, HashML-DSA) gets the
//    upstream disposition on both engines;
//  - deterministic ML-DSA / SLH-DSA signing binds message and context (a one-bit
//    mutation never reproduces the NIST signature nor verifies for the original);
//  - hedged signing at context 0 and 255 verifies on the engine AND on an
//    independent implementation (@noble/post-quantum), and fails for a mutated
//    message / context;
//  - NIST SLH-DSA keyGen from seed and empty-context deterministic sigGen
//    byte-match on both engines;
//  - C++ rejects every invalid NIST ML-KEM encapsulation key; the Rust engine
//    accepts all of them (open gap rust-mlkem-no-key-input-checks);
//  - sabotage on a COPY of the vectors (vi.doMock) turns exactly those rows red.
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { CategoryId, TestResult } from './useAcvpSuite'
import { SLH_F_SETS } from './sections/slhdsaCoverage'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence.static'

/** Manifest evidence classes of a row (generated per-case records; [] = no record). */
const classesOf = (rowId: string) =>
  [...new Set(evidenceForRowId(rowId).map((e) => e.evidenceClass))].sort()

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'):
  // that file: package resolves through node_modules, and in a worktree whose
  // node_modules is itself symlinked to a SIBLING worktree (a real, supported
  // setup), a relative symlink one level inside that shared node_modules
  // resolves relative to where IT lives, silently landing on the sibling
  // worktree's src/vendor/softhsm-wasm instead of this one's -- probing the
  // wrong C++ binary with no error (found 2026-09-25, P3 combined rebuild).
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

const DATA = path.resolve(__dirname, '../../../../data/acvp')
const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))

const cppRef: { current: SoftHSMModule | null } = { current: null }
const rustRef: { current: SoftHSMModule | null } = { current: null }

vi.mock('../HsmContext', async () => {
  const actual = await vi.importActual<typeof import('../HsmContext')>('../HsmContext')
  return {
    ...actual,
    useHsmContext: () => ({
      moduleRef: cppRef,
      rawModuleRef: cppRef,
      crossCheckModuleRef: rustRef,
      hSessionRef: { current: 0 },
      slotRef: { current: 0 },
      engineMode: 'dual' as const,
      setEngineMode: vi.fn(),
      phase: 'session_open' as const,
      setPhase: vi.fn(),
      tokenCreated: true,
      setTokenCreated: vi.fn(),
      isReady: true,
      hsmKeys: [],
      hsmKeysRef: { current: [] },
      addHsmKey: vi.fn((k) => k),
      registerKey: vi.fn((_M, _s, partial) => ({
        ...partial,
        uniqueId: 'test',
        slotId: 0,
        generatedAt: '',
      })),
      removeHsmKey: vi.fn(),
      clearHsmKeys: vi.fn(),
      addHsmLog: vi.fn(),
      addHsmStepLog: vi.fn(),
      autoInit: vi.fn().mockResolvedValue(true),
    }),
  }
})

const run = async (cats: CategoryId[]): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(cats))
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

const ENGINES = ['C++', 'Rust'] as const
const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')
const NEW =
  /^(mldsa-sigver-depth|mldsa-negbound|mlkem-ekcheck-depth|slhdsa-keygen-seed|slhdsa-siggen-ctx0|slhdsa-cov)-/

describe('P5 PQC coverage sections — both engines, real vectors', () => {
  let results: TestResult[] = []

  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    results = await run(['ml_dsa', 'ml_kem', 'slh_stateful'])
    // 1_200_000, not 600_000 (raised 2026-09-26). MEASURED on this worktree
    // (M-series, Node 22.23.1): engine loading is NOT the cost — the C++ load
    // is 0.0s and the Rust load 0.2s. The `run([...])` above is 599.1s, i.e.
    // it was finishing 0.9s inside the old 600_000 budget, so this hook was
    // passing or timing out essentially at random. The growth is real work,
    // not a hang: the `slh_stateful` category now carries the §9e HashSLH-DSA
    // pre-hash sections, taking the SLH-DSA registry case count from 176 to
    // 980. 2x headroom over the measurement, so a slower machine or a further
    // SLH-DSA addition does not reintroduce a coin-flip failure.
  }, 1_200_000)

  const rows = () => results.filter((r) => NEW.test(r.id))
  const row = (id: string) => results.find((r) => r.id === id)

  it('runs every new section on both engines with identical case sets', () => {
    const cpp = rows().filter((r) => engineOf(r) === 'C++')
    const rust = rows().filter((r) => engineOf(r) === 'Rust')
    // 43 NIST sigVer + 3 × (2 det negatives + 2 × 3 hedged rows) ML-DSA;
    // 12 ML-KEM ek checks; 24 keyGen + 10 ctx-0 sigGen + 6 × (2 + 6) SLH-DSA + 1 skip.
    expect(cpp).toHaveLength(43 + 3 * 8 + 12 + 24 + 10 + 6 * 8 + 1)
    expect(rust.map(caseKey)).toEqual(cpp.map(caseKey))
  })

  it('gives every NIST ML-DSA sigVer depth case its upstream disposition', () => {
    const v = readVectors('mldsa_sigver_depth_test.json')
    let n = 0
    for (const engine of ENGINES)
      for (const g of v.testGroups)
        for (const t of g.tests) {
          const r = row(`mldsa-sigver-depth-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${engine}`)
          expect(r?.status, `${engine} tc${t.tcId}: ${r?.details}`).toBe('pass')
          expect(r!.caseMeta?.observed).toBe(
            `C_Verify → ${t.testPassed ? 'CKR_OK' : 'CKR_SIGNATURE_INVALID'}`
          )
          expect(classesOf(r!.id)).toEqual(['nist-acvp-reference-sample'])
          n++
        }
    expect(n).toBe(2 * 43)
    // Each pure group reaches both context-length extremes.
    for (const g of v.testGroups.filter((x: { preHash: string }) => x.preHash === 'pure'))
      expect(g.tests.map((t: { context?: string }) => (t.context ?? '').length / 2).sort()).toEqual(
        [0, 255]
      )
  })

  it('deterministic signing binds message and context (ML-DSA, SLH-DSA "f" sets)', () => {
    const keys = [
      ...['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'].flatMap((ps) =>
        ['msgflip', 'ctxchange'].map((k) => `mldsa-negbound-det-${k}-${ps}`)
      ),
      ...SLH_F_SETS.flatMap((ps) => ['msgflip', 'ctxflip'].map((k) => `slhdsa-cov-det-${k}-${ps}`)),
    ]
    for (const k of keys)
      for (const engine of ENGINES) {
        const r = row(`${k}-${engine}`)
        expect(r?.status, `${k}-${engine}: ${r?.details}`).toBe('pass')
        expect(r!.caseMeta?.observed).toMatch(
          /^signature differs from the NIST expected one; C_Verify\(original message, (empty|NIST) context\) → CKR_SIGNATURE_INVALID$/
        )
        expect(r!.caseMeta?.origin).toBe('product-authored-mutation')
        expect(classesOf(r!.id)).toEqual(['product-mechanism-probe'])
      }
  })

  it('hedged signatures at context 0 and 255 verify on the engine and on the independent oracle, and fail when mutated', () => {
    const sets = [
      ...['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'].map((ps) => ['mldsa-negbound', ps]),
      ...SLH_F_SETS.map((ps) => ['slhdsa-cov', ps]),
    ]
    for (const [prefix, ps] of sets)
      for (const ext of ['ctx0', 'ctx255'])
        for (const engine of ENGINES) {
          const rt = row(`${prefix}-hedged-${ext}-rt-${ps}-${engine}`)
          const or = row(`${prefix}-hedged-${ext}-oracle-${ps}-${engine}`)
          const neg = row(`${prefix}-hedged-${ext}-neg-${ps}-${engine}`)
          expect(rt?.status, rt?.details).toBe('pass')
          expect(rt!.caseMeta?.observed).toMatch(/^C_Verify → CKR_OK; sha256:[0-9a-f]{16}$/)
          expect(classesOf(rt!.id)).toEqual(['functional-round-trip'])
          expect(or?.status, or?.details).toBe('pass')
          expect(or!.caseMeta?.observed).toMatch(/@noble\/post-quantum 0\.7\.1 .* → valid$/)
          expect(classesOf(or!.id)).toEqual(['independent-oracle'])
          expect(neg?.status, neg?.details).toBe('pass')
          expect(neg!.caseMeta?.observed).toMatch(/→ CKR_SIGNATURE_INVALID$/)
          expect(rt!.caseMeta?.contextBytes).toBe(ext === 'ctx0' ? 0 : 255)
        }
  })

  it('byte-matches NIST SLH-DSA keyGen (CKA_SEED) and empty-context deterministic sigGen on both engines', () => {
    const kg = readVectors('slhdsa_keygen_test.json')
    const c0 = readVectors('slhdsa_siggen_ctx0_test.json')
    for (const engine of ENGINES) {
      for (const g of kg.testGroups)
        for (const t of g.tests) {
          const r = row(`slhdsa-keygen-seed-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${engine}`)
          expect(r?.status, `${engine} tc${t.tcId}: ${r?.details}`).toBe('pass')
          expect(r!.caseMeta?.observed).toBe('byte-equal')
          expect(classesOf(r!.id)).toEqual(['nist-acvp-reference-sample'])
        }
      for (const g of c0.testGroups)
        for (const t of g.tests) {
          const r = row(`slhdsa-siggen-ctx0-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${engine}`)
          expect(r?.status, `${engine} tc${t.tcId}: ${r?.details}`).toBe('pass')
          expect(r!.caseMeta).toMatchObject({ observed: 'byte-equal', contextBytes: 0 })
          expect(classesOf(r!.id)).toEqual(['nist-acvp-reference-sample'])
        }
    }
    expect(kg.testGroups).toHaveLength(12)
  })

  it('C++ rejects every invalid NIST ML-KEM encapsulation key of the depth file', () => {
    const cpp = rows().filter(
      (r) => r.id.startsWith('mlkem-ekcheck-depth-') && engineOf(r) === 'C++'
    )
    expect(cpp).toHaveLength(12)
    for (const r of cpp) {
      expect(r.status, r.details).toBe('pass')
      expect(r.caseMeta?.expected).toBe('rejected')
    }
  })

  it('the Rust engine now rejects every invalid NIST ML-KEM encapsulation key too (E2 fixed, 2026-09-25, hsm a22e6ca0)', () => {
    // Was 'FINDING: the Rust engine accepts every invalid NIST ML-KEM
    // encapsulation key (rust-mlkem-no-key-input-checks)' — confirmed against
    // the rebuilt engine, not guessed.
    const rust = rows().filter(
      (r) => r.id.startsWith('mlkem-ekcheck-depth-') && engineOf(r) === 'Rust'
    )
    expect(rust).toHaveLength(12)
    for (const r of rust) {
      expect(r.status, r.details).toBe('pass')
      expect(r.caseMeta?.expected).toBe('rejected')
    }
  })

  it('reports the SLH-DSA "s" sets as a skip — never pass, never tiered', () => {
    const skips = rows().filter((r) => r.status === 'skip')
    expect(skips.map(caseKey)).toEqual(['slhdsa-cov-skip-s-sets', 'slhdsa-cov-skip-s-sets'])
    for (const r of skips) expect(classesOf(r.id)).toEqual([])
  })

  it('fails nothing else in the new sections', () => {
    const failed = rows().filter((r) => r.status === 'fail')
    expect(
      failed.every((r) => r.id.startsWith('mlkem-ekcheck-depth-') && engineOf(r) === 'Rust')
    ).toBe(true)
  })
})

describe('P5 PQC coverage sections — sabotaged expectations fail', () => {
  it('a flipped NIST disposition, pk byte and sigGen signature are detected on both engines', async () => {
    const flipHex = (h: string) =>
      (parseInt(h.slice(0, 2), 16) ^ 0x80).toString(16).padStart(2, '0').toUpperCase() + h.slice(2)
    const sv = readVectors('mldsa_sigver_depth_test.json')
    const svCase = sv.testGroups[0].tests[0]
    svCase.testPassed = !svCase.testPassed
    const kg = readVectors('slhdsa_keygen_test.json')
    const kgCase = kg.testGroups[0].tests[0]
    kgCase.pk = flipHex(kgCase.pk)
    const c0 = readVectors('slhdsa_siggen_ctx0_test.json')
    const c0Case = c0.testGroups[0].tests[0]
    c0Case.signature = flipHex(c0Case.signature)

    vi.resetModules()
    vi.doMock('@/data/acvp/mldsa_sigver_depth_test.json', () => ({ default: sv }))
    vi.doMock('@/data/acvp/slhdsa_keygen_test.json', () => ({ default: kg }))
    vi.doMock('@/data/acvp/slhdsa_siggen_ctx0_test.json', () => ({ default: c0 }))
    try {
      const results = (await run(['ml_dsa', 'slh_stateful'])).filter((r) => NEW.test(r.id))
      const failed = results.filter((r) => r.status === 'fail')
      expect(failed.map(caseKey).sort()).toEqual(
        [
          `mldsa-sigver-depth-${sv.testGroups[0].parameterSet}-tg${sv.testGroups[0].tgId}-tc${svCase.tcId}`,
          `slhdsa-keygen-seed-${kg.testGroups[0].parameterSet}-tg${kg.testGroups[0].tgId}-tc${kgCase.tcId}`,
          `slhdsa-siggen-ctx0-${c0.testGroups[0].parameterSet}-tg${c0.testGroups[0].tgId}-tc${c0Case.tcId}`,
        ]
          .flatMap((k) => [k, k])
          .sort()
      )
    } finally {
      vi.doUnmock('@/data/acvp/mldsa_sigver_depth_test.json')
      vi.doUnmock('@/data/acvp/slhdsa_keygen_test.json')
      vi.doUnmock('@/data/acvp/slhdsa_siggen_ctx0_test.json')
    }
    // 1_200_000 for the same measured reason as the beforeAll above: this
    // sabotage proof re-runs ml_dsa + slh_stateful, measured at ~580s of the
    // old 600_000 budget (whole-file duration 1179.9s, of which 599.1s is the
    // beforeAll). A sabotage proof that dies on its own timeout proves
    // nothing, so it gets the same 2x headroom.
  }, 1_200_000)
})
