// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the SLH-DSA reference-sample section (sections/slhdsaAcvp.ts), driven
// through the REAL useAcvpSuite hook in dual-engine mode (C++ Emscripten engine
// loaded directly in Node + Rust wasm-bindgen engine). Nothing is mocked except
// the React context that hands the hook its two modules.
//
// What it proves:
//  - dedicated NIST SigVer: every negative returns exactly CKR_SIGNATURE_INVALID
//    (modified content) or CKR_SIGNATURE_LEN_RANGE (too small / too large) on
//    both engines; pure positives return CKR_OK on both; pre-hash positives
//    return CKR_OK on Rust and are REJECTED by C++ (FINDING, pinned below);
//  - deterministic SigGen byte-matches NIST for all 12 parameter sets (pure,
//    255-byte and empty context) on both engines; the HashSLH-DSA cases match
//    on Rust and not on C++ (same FINDING);
//  - product-authored pk/ctx/sig/msg mutations are rejected and carry no NIST
//    evidence tier; the 256-byte-context and hedged-randomization probes behave
//    as pinned; unexpressible upstream groups are 'skip', never pass;
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
import type { TestResult } from './useAcvpSuite'
import { SLH_CTX256_PIN } from './sections/slhdsaAcvp'

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

const runSlh = async (): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(['slh_stateful']))
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')
const SECTION = /^slhdsa-(sigver-nist|siggen-det|sigver-local|probe|skip)-/
const SV_FILES = ['slhdsa_sigver_sha2_test.json', 'slhdsa_sigver_shake_test.json']

describe('SLH-DSA reference samples — both engines, real vectors', () => {
  let results: TestResult[] = []

  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    results = await runSlh()
  }, 300_000)

  const section = () => results.filter((r) => SECTION.test(r.id))
  const nistSigVer = () =>
    SV_FILES.flatMap((f) =>
      readVectors(f).testGroups.flatMap(
        (g: {
          tgId: number
          parameterSet: string
          preHash: string
          tests: { tcId: number; testPassed: boolean; reason: string }[]
        }) =>
          g.tests.map((t) => ({
            ...t,
            tgId: g.tgId,
            parameterSet: g.parameterSet,
            preHash: g.preHash,
          }))
      )
    )

  it('runs the section on both engines with identical case sets', () => {
    const cpp = section().filter((r) => engineOf(r) === 'C++')
    const rust = section().filter((r) => engineOf(r) === 'Rust')
    // 16 NIST sigVer + 16 deterministic sigGen (12 ctx-255 + 4 empty-ctx/pre-hash)
    // + 32 product-authored mutations (12 × pk/ctx, 4 × sig/msg) + 2 probes + 3 skips.
    expect(cpp).toHaveLength(69)
    expect(rust.map(caseKey)).toEqual(cpp.map(caseKey))
  })

  it('returns the exact NIST disposition code for every dedicated SigVer case (pure: both engines)', () => {
    for (const engine of ['C++', 'Rust'])
      for (const t of nistSigVer()) {
        const row = results.find(
          (r) => r.id === `slhdsa-sigver-nist-${t.parameterSet}-tg${t.tgId}-tc${t.tcId}-${engine}`
        )
        expect(row, `${engine} tc${t.tcId}`).toBeDefined()
        const want = t.testPassed
          ? 'CKR_OK'
          : /too (small|large)/.test(t.reason)
            ? 'CKR_SIGNATURE_LEN_RANGE'
            : 'CKR_SIGNATURE_INVALID'
        expect(row!.caseMeta?.expectedRv).toBe(want)
        expect(row!.evidenceTier).toBe('nist-acvp')
        const cppPreHashPositive = engine === 'C++' && t.preHash === 'preHash' && t.testPassed
        if (cppPreHashPositive) continue // FINDING — asserted separately below
        expect(row!.status, `${engine} ${row!.testCase}: ${row!.details}`).toBe('pass')
        expect(row!.caseMeta?.observed).toBe(`C_Verify → ${want}`)
      }
  })

  it('covers all six upstream negative reasons, both length-range reasons included', () => {
    const reasons = new Set(
      nistSigVer()
        .filter((t) => !t.testPassed)
        .map((t) => t.reason)
    )
    expect([...reasons].sort()).toEqual([
      'invalid signature - too large',
      'invalid signature - too small',
      'modified message',
      'modified signature - R',
      'modified signature - SIGFORS',
      'modified signature - SIGHT',
    ])
    // every family × security level has a NIST disposition executed
    const cells = new Set(nistSigVer().map((t) => t.parameterSet.replace(/[sf]$/, '')))
    expect(cells.size).toBe(6)
  })

  it('FINDING: C++ rejects every valid NIST HashSLH-DSA signature and mis-signs HashSLH-DSA deterministically', () => {
    const cppPreHash = section().filter(
      (r) =>
        engineOf(r) === 'C++' &&
        r.caseMeta?.mode === 'preHash' &&
        r.caseMeta?.origin === 'nist-acvp-server'
    )
    const failed = cppPreHash
      .filter((r) => r.status === 'fail')
      .map(caseKey)
      .sort()
    const expectedFail = cppPreHash
      .filter((r) => r.caseMeta?.expected === 'valid' || r.caseMeta?.expected === 'byte-match')
      .map(caseKey)
      .sort()
    expect(failed).toEqual(expectedFail)
    expect(failed).toHaveLength(7) // 5 sigVer positives + 2 deterministic sigGen
    for (const r of cppPreHash.filter((x) => x.status === 'fail'))
      expect(r.details).toMatch(/REJECTED a valid NIST signature|signature mismatch/)
    // The same cases pass on Rust, so the vectors and the harness are not the cause.
    for (const k of failed) expect(results.find((r) => r.id === `${k}-Rust`)?.status).toBe('pass')
  })

  it('byte-matches deterministic SigGen for all 12 parameter sets (pure) on both engines', () => {
    const det = section().filter(
      (r) => r.id.startsWith('slhdsa-siggen-det-') && r.caseMeta?.mode === 'pure'
    )
    expect(det).toHaveLength(28) // (12 ctx-255 + 2 empty-context) × 2 engines
    expect(new Set(det.map((r) => r.caseMeta!.parameterSet)).size).toBe(12)
    for (const r of det) {
      expect(r.status, `${r.algorithm} ${r.testCase}: ${r.details}`).toBe('pass')
      expect(r.caseMeta?.observed).toBe('byte-equal')
      expect(r.evidenceTier).toBe('nist-acvp')
    }
    expect(det.some((r) => r.caseMeta?.contextBytes === 0)).toBe(true)
    expect(det.some((r) => r.caseMeta?.contextBytes === 255)).toBe(true)
  })

  it('rejects the product-authored mutations, without a NIST evidence tier', () => {
    const local = section().filter((r) => r.id.startsWith('slhdsa-sigver-local-'))
    expect(local).toHaveLength(64)
    for (const r of local) {
      expect(r.status, r.details).toBe('pass')
      expect(r.caseMeta?.observed).toBe('C_Verify → CKR_SIGNATURE_INVALID')
      expect(r.evidenceTier).toBeUndefined()
      expect(r.caseMeta?.origin).toBe('product-authored-mutation')
      expect(r.details).toMatch(/not a NIST vector/)
    }
  })

  it('refuses a 256-byte context with the pinned code and randomizes hedged signatures', () => {
    for (const engine of ['C++', 'Rust'] as const) {
      const c = results.find((r) => r.id === `slhdsa-probe-ctx256-${engine}`)!
      expect(c.status, c.details).toBe('pass')
      expect(c.caseMeta?.observed).toBe(engine === 'C++' ? SLH_CTX256_PIN.cpp : SLH_CTX256_PIN.rust)
      expect(c.details).toMatch(/at C_SignInit/)
      const h = results.find((r) => r.id === `slhdsa-probe-hedged-randomized-${engine}`)!
      expect(h.status, h.details).toBe('pass')
      expect(h.caseMeta?.observed).toMatch(/^signatures differ; verify CKR_OK\/CKR_OK; sha256:/)
      expect(h.evidenceTier).toBeUndefined()
    }
  })

  it('reports unexpressible upstream groups as skip — never pass, never tiered', () => {
    const skips = section().filter((r) => r.status === 'skip')
    expect(skips.map(caseKey).sort()).toEqual([
      'slhdsa-skip-hash-sha512t',
      'slhdsa-skip-hash-sha512t',
      'slhdsa-skip-hedged-rnd',
      'slhdsa-skip-hedged-rnd',
      'slhdsa-skip-internal',
      'slhdsa-skip-internal',
    ])
    for (const r of skips) {
      expect(r.evidenceTier).toBeUndefined()
      expect(r.details).toMatch(/^Skipped — /)
    }
    expect(skips.find((r) => r.id.startsWith('slhdsa-skip-hash'))!.details).toMatch(
      /advertises 10 of the 10/
    )
  })

  it('agrees across engines case by case except on the recorded findings', () => {
    const byKey = new Map<string, TestResult[]>()
    for (const r of section()) byKey.set(caseKey(r), [...(byKey.get(caseKey(r)) ?? []), r])
    const disagree: string[] = []
    for (const [key, pair] of byKey) {
      expect(pair, key).toHaveLength(2)
      if (pair[0].caseMeta?.observed !== pair[1].caseMeta?.observed) disagree.push(key)
    }
    const cppFindings = section()
      .filter((r) => engineOf(r) === 'C++' && r.status === 'fail')
      .map(caseKey)
    expect(disagree.sort()).toEqual(
      [...cppFindings, 'slhdsa-probe-ctx256', 'slhdsa-probe-hedged-randomized'].sort()
    )
  })

  it('labels the pre-existing sigGen-derived verification rows with their transformation (D3-1)', () => {
    const derived = results.filter((r) => /^slhdsa-sigver-kat-/.test(r.id))
    expect(derived).toHaveLength(24)
    for (const r of derived) {
      expect(r.status, r.details).toBe('pass')
      expect(r.testCase).toMatch(
        /^SigVer · upstream sigGen tg\d+\/tc\d+ → local SigVer · pure · ctx 255B$/
      )
      expect(r.details).toMatch(/NIST sigGen output re-used as a positive SigVer tuple/)
      expect(r.caseMeta).toMatchObject({ upstreamOperation: 'sigGen', localOperation: 'sigVer' })
    }
  })
})

// ── Sabotage: expected values changed on a COPY must turn rows red ─────────
describe('SLH-DSA reference samples — sabotaged expectations fail', () => {
  it('a flipped NIST disposition and changed expected signature bytes are detected on both engines', async () => {
    const flipLast = (h: string) =>
      h.slice(0, -2) + (parseInt(h.slice(-2), 16) ^ 0x01).toString(16).padStart(2, '0')
    const sv = readVectors('slhdsa_sigver_sha2_test.json')
    const pureGroup = sv.testGroups.find((g: { preHash: string }) => g.preHash === 'pure')
    const neg = pureGroup.tests.find((t: { testPassed: boolean }) => !t.testPassed)
    neg.testPassed = true // claim a NIST-negative case should verify

    const det = readVectors('slhdsa_siggen_det_test.json')
    const detCase = det.testGroups[0].tests[0]
    detCase.signature = flipLast(detCase.signature)

    const ctxv = readVectors('slhdsa_ctx_test.json')
    ctxv.sigGen['SLH-DSA-SHA2-128f'].signature = flipLast(
      ctxv.sigGen['SLH-DSA-SHA2-128f'].signature
    )

    vi.resetModules()
    vi.doMock('@/data/acvp/slhdsa_sigver_sha2_test.json', () => ({ default: sv }))
    vi.doMock('@/data/acvp/slhdsa_siggen_det_test.json', () => ({ default: det }))
    vi.doMock('@/data/acvp/slhdsa_ctx_test.json', () => ({ default: ctxv }))
    try {
      const results = await runSlh()
      const find = (p: string) => results.filter((r) => r.id.startsWith(p))
      for (const engine of ['C++', 'Rust']) {
        const n = results.find(
          (r) =>
            r.id ===
            `slhdsa-sigver-nist-${pureGroup.parameterSet}-tg${pureGroup.tgId}-tc${neg.tcId}-${engine}`
        )
        expect(n?.status).toBe('fail')
        expect(n?.details).toMatch(/expected CKR_OK/)
        const d = results.find(
          (r) =>
            r.id ===
            `slhdsa-siggen-det-${det.testGroups[0].parameterSet}-tg${det.testGroups[0].tgId}-tc${detCase.tcId}-${engine}`
        )
        expect(d?.status).toBe('fail')
        expect(d?.details).toMatch(/signature mismatch: first difference at byte 17087/)
        const c = find('slhdsa-siggen-det-SLH-DSA-SHA2-128f-tg1-tc5-').find(
          (r) => engineOf(r) === engine
        )
        expect(c?.status).toBe('fail')
      }
      // Exactly the sabotaged rows failed (3 × 2 engines) plus the 7 C++ HashSLH-DSA findings.
      expect(results.filter((r) => r.status === 'fail')).toHaveLength(6 + 7)
    } finally {
      vi.doUnmock('@/data/acvp/slhdsa_sigver_sha2_test.json')
      vi.doUnmock('@/data/acvp/slhdsa_siggen_det_test.json')
      vi.doUnmock('@/data/acvp/slhdsa_ctx_test.json')
    }
  }, 300_000)
})
