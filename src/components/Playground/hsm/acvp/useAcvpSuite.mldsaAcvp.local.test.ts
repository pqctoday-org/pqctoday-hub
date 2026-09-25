// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the ML-DSA reference-sample section (sections/mldsaAcvp.ts), driven
// through the REAL useAcvpSuite hook in dual-engine mode: the C++ engine
// (Emscripten, loaded directly in Node) and the Rust engine (wasm-bindgen) each
// execute every pinned NIST ACVP-Server case. Nothing here is mocked except the
// React context that hands the hook its two modules.
//
// What it proves:
//  - positive NIST sigVer cases return CKR_OK, negative ones return exactly
//    CKR_SIGNATURE_INVALID, on BOTH engines, with identical observed returns;
//  - deterministic SigGen output byte-matches the NIST signature, KeyGen from
//    seed byte-matches the NIST pk;
//  - product-authored negatives carry no NIST evidence tier;
//  - unsupported upstream groups surface as 'skip' rows, never as pass;
//  - sabotage: a flipped expected disposition / expected byte on a COPY of the
//    vectors (vi.doMock — the tracked JSON on disk is never touched) turns the
//    affected row red. Without this, a runner that always reported 'pass'
//    would satisfy the first block.
//
// Venue: `*.local.test.ts` — excluded from the CI vitest config and run by
// `npm run test:local` (directive 2026-07-01: new suites are local-gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { TestResult } from './useAcvpSuite'

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
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

const runMlDsa = async (): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(['ml_dsa']))
  await waitFor(() => expect(result.current.logs.at(-1)).toMatch(/Validation Suite Completed/))
  // A run that throws before its first row lands in the hook's own log, not in
  // `out` — surface it so an empty result is diagnosable.
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')

describe('ML-DSA reference samples — both engines, real vectors', () => {
  let results: TestResult[] = []

  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    results = await runMlDsa()
  }, 120_000)

  const section = () =>
    results.filter((r) =>
      /^mldsa-(sigver-nist|sigver-local|siggen-det|keygen-seed|skip)-/.test(r.id)
    )

  it('runs the section on both engines with identical case sets', () => {
    const cpp = section().filter((r) => engineOf(r) === 'C++')
    const rust = section().filter((r) => engineOf(r) === 'Rust')
    // 15 pure (1 positive + 4 NIST negative reasons × 3) + 6 External-µ
    // + 6 product-authored + 9 deterministic SigGen + 3 KeyGen + 3 skips.
    expect(cpp).toHaveLength(42)
    expect(rust.map(caseKey)).toEqual(cpp.map(caseKey))
  })

  it('accepts every positive NIST sigVer case and rejects every negative one with CKR_SIGNATURE_INVALID', () => {
    const vectors = readVectors('mldsa_sigver_test.json')
    for (const engine of ['C++', 'Rust']) {
      for (const g of vectors.testGroups) {
        for (const t of g.tests) {
          const row = results.find(
            (r) => r.id === `mldsa-sigver-nist-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${engine}`
          )
          expect(row, `${engine} tg${g.tgId}/tc${t.tcId}`).toBeDefined()
          expect(row!.status, `${engine} ${row!.testCase}: ${row!.details}`).toBe('pass')
          expect(row!.caseMeta?.observed).toBe(
            t.testPassed ? 'C_Verify → CKR_OK' : 'C_Verify → CKR_SIGNATURE_INVALID'
          )
          expect(row!.evidenceTier).toBe('nist-acvp')
          expect(row!.caseMeta).toMatchObject({
            origin: 'nist-acvp-server',
            upstreamOperation: 'sigVer',
            tgId: g.tgId,
            tcId: t.tcId,
            expected: t.testPassed ? 'valid' : 'invalid',
            source: { commit: vectors._provenance.source_commit },
          })
        }
      }
    }
  })

  it('covers every upstream negative reason for every parameter set', () => {
    for (const ps of ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']) {
      const reasons = new Set(
        section()
          .filter((r) => r.caseMeta?.parameterSet === ps && r.caseMeta?.expected === 'invalid')
          .filter((r) => r.caseMeta?.origin === 'nist-acvp-server' && r.caseMeta?.mode === 'pure')
          .map((r) => r.caseMeta!.expectedReason)
      )
      expect([...reasons].sort()).toEqual([
        'modified message',
        'modified signature - commitment',
        'modified signature - hint',
        'modified signature - z',
      ])
    }
  })

  it('rejects the product-authored pk and context mutations, without a NIST evidence tier', () => {
    const local = section().filter((r) => r.id.startsWith('mldsa-sigver-local-'))
    expect(local).toHaveLength(12) // 2 mutations × 3 parameter sets × 2 engines
    for (const r of local) {
      expect(r.status, r.details).toBe('pass')
      expect(r.caseMeta?.observed).toBe('C_Verify → CKR_SIGNATURE_INVALID')
      expect(r.evidenceTier).toBeUndefined()
      expect(r.caseMeta?.origin).toBe('product-authored-mutation')
      expect(r.testCase).toMatch(/product-authored/)
      expect(r.details).toMatch(/not a NIST vector/)
    }
  })

  it('byte-matches deterministic SigGen and seed KeyGen against NIST', () => {
    const det = section().filter((r) => /^mldsa-(siggen-det|keygen-seed)-/.test(r.id))
    expect(det).toHaveLength(24)
    for (const r of det) {
      expect(r.status, `${r.algorithm} ${r.testCase}: ${r.details}`).toBe('pass')
      expect(r.caseMeta?.observed).toBe('byte-equal')
      expect(r.evidenceTier).toBe('nist-acvp')
    }
    // External µ (vendor 0x403c) really ran on both engines — not skipped.
    const mu = det.filter((r) => r.caseMeta?.mode === 'externalMu')
    expect(mu.map(engineOf).sort()).toEqual(['C++', 'C++', 'C++', 'Rust', 'Rust', 'Rust'])
  })

  it('reports unsupported upstream groups as skip — never pass, never tiered', () => {
    const skips = section().filter((r) => r.status === 'skip')
    expect(skips.map(caseKey).sort()).toEqual([
      'mldsa-skip-hash-sha512t',
      'mldsa-skip-hash-sha512t',
      'mldsa-skip-hedged-rnd',
      'mldsa-skip-hedged-rnd',
      'mldsa-skip-internal',
      'mldsa-skip-internal',
    ])
    for (const r of skips) {
      expect(r.evidenceTier).toBeUndefined()
      expect(r.caseMeta?.expected).toBe('not-run')
      expect(r.details).toMatch(/^Skipped — /)
    }
    const sha = skips.find((r) => r.id.startsWith('mldsa-skip-hash-sha512t'))!
    expect(sha.details).toMatch(/SHA2-512\/224 or SHA2-512\/256/)
    expect(sha.details).toMatch(/advertises 10 of the 10/)
  })

  it('agrees across engines case by case (a disagreement is a finding, not noise)', () => {
    const byKey = new Map<string, TestResult[]>()
    for (const r of section()) byKey.set(caseKey(r), [...(byKey.get(caseKey(r)) ?? []), r])
    for (const [key, pair] of byKey) {
      expect(pair, key).toHaveLength(2)
      expect(pair[0].status, key).toBe(pair[1].status)
      expect(pair[0].caseMeta?.observed, key).toBe(pair[1].caseMeta?.observed)
    }
  })

  it('labels the pre-existing sigGen-derived verification rows with their transformation (D2-1)', () => {
    const derived = results.filter((r) =>
      /^mldsa-(sigver-ML-DSA|ctx-sigver|prehash-sigver)-/.test(r.id)
    )
    expect(derived).toHaveLength(18) // 3 plain + 3 context + 3 pre-hash, × 2 engines
    for (const r of derived) {
      expect(r.status, r.details).toBe('pass')
      expect(r.testCase).toContain('upstream sigGen')
      expect(r.testCase).toContain('→ local SigVer')
      expect(r.details).toMatch(/NIST sigGen output re-used as a positive SigVer tuple/)
      expect(r.caseMeta).toMatchObject({ upstreamOperation: 'sigGen', localOperation: 'sigVer' })
    }
  })
})

// ── Sabotage: expected values changed on a COPY must turn rows red ─────────
describe('ML-DSA reference samples — sabotaged expectations fail', () => {
  it('flipped disposition / expected bytes are detected on both engines', async () => {
    const sv = readVectors('mldsa_sigver_test.json')
    const pureNeg = sv.testGroups[0].tests.find((t: { testPassed: boolean }) => !t.testPassed)
    const purePos = sv.testGroups[0].tests.find((t: { testPassed: boolean }) => t.testPassed)
    pureNeg.testPassed = true // claim a NIST-negative case should verify
    purePos.testPassed = false // claim the NIST-positive case should be rejected

    const sg = readVectors('mldsa_siggen_det_test.json')
    const sgCase = sg.testGroups[0].tests[0]
    sgCase.signature =
      sgCase.signature.slice(0, -2) +
      (parseInt(sgCase.signature.slice(-2), 16) ^ 0x01).toString(16).padStart(2, '0')

    const kg = readVectors('mldsa_keygen_test.json')
    const kgCase = kg.testGroups[0].tests[0]
    kgCase.pk =
      (parseInt(kgCase.pk.slice(0, 2), 16) ^ 0x80).toString(16).padStart(2, '0') +
      kgCase.pk.slice(2)

    vi.resetModules()
    vi.doMock('@/data/acvp/mldsa_sigver_test.json', () => ({ default: sv }))
    vi.doMock('@/data/acvp/mldsa_siggen_det_test.json', () => ({ default: sg }))
    vi.doMock('@/data/acvp/mldsa_keygen_test.json', () => ({ default: kg }))
    try {
      const results = await runMlDsa()
      const g0 = sv.testGroups[0]
      for (const engine of ['C++', 'Rust']) {
        const row = (tc: number) =>
          results.find(
            (r) => r.id === `mldsa-sigver-nist-${g0.parameterSet}-tg${g0.tgId}-tc${tc}-${engine}`
          )
        expect(row(pureNeg.tcId)?.status).toBe('fail')
        expect(row(pureNeg.tcId)?.details).toMatch(/expected CKR_OK/)
        expect(row(purePos.tcId)?.status).toBe('fail')
        expect(row(purePos.tcId)?.details).toMatch(/expected CKR_SIGNATURE_INVALID/)

        const sgRow = results.find(
          (r) =>
            r.id ===
            `mldsa-siggen-det-${sg.testGroups[0].parameterSet}-tg${sg.testGroups[0].tgId}-tc${sgCase.tcId}-${engine}`
        )
        expect(sgRow?.status).toBe('fail')
        expect(sgRow?.details).toMatch(/signature mismatch/)

        const kgRow = results.find(
          (r) =>
            r.id ===
            `mldsa-keygen-seed-${kg.testGroups[0].parameterSet}-tg${kg.testGroups[0].tgId}-tc${kgCase.tcId}-${engine}`
        )
        expect(kgRow?.status).toBe('fail')
        expect(kgRow?.details).toMatch(/pk mismatch: first difference at byte 0/)
      }
      // Exactly the sabotaged rows failed — everything else still passes, so
      // the failures above are caused by the sabotage, not by a broken run.
      const failed = results.filter((r) => r.status === 'fail')
      expect(failed).toHaveLength(8) // 4 sabotaged cases × 2 engines
    } finally {
      vi.doUnmock('@/data/acvp/mldsa_sigver_test.json')
      vi.doUnmock('@/data/acvp/mldsa_siggen_det_test.json')
      vi.doUnmock('@/data/acvp/mldsa_keygen_test.json')
    }
  }, 120_000)
})
