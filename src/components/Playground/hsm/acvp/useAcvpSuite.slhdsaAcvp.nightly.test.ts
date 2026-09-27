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
// Venue: `*.nightly.test.ts` — run by `npm run test:nightly`, scheduled nightly by
// .github/workflows/validation-nightly.yml (maintainer decision 2026-09-26). Moved
// off the pre-push `test:local` run because it was 26.3 of that run's 28.6 min: it
// runs the whole slh_stateful category on both engines three times (beforeAll plus
// two sabotage describes). A regression here can sit on main for up to a day; the
// workflow opens a "Nightly validation vectors are red" issue when it does.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { TestResult } from './useAcvpSuite'
import { SLH_CTX256_PIN } from './sections/slhdsaAcvp'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence'

/** Manifest evidence classes of a row (generated per-case records; [] = no record). */
const classesOf = (rowId: string) =>
  [...new Set(evidenceForRowId(rowId).map((e) => e.evidenceClass))].sort()

/**
 * Per-step time budget. Default measured on an M-series Mac (see each BUDGET note
 * below: the three steps took 508-561 s). A GitHub runner is slower and unmeasured
 * here, so the nightly workflow raises it with SLHDSA_BUDGET_MS rather than this
 * file guessing a runner speed.
 */
const BUDGET_MS = Number(process.env.SLHDSA_BUDGET_MS ?? 1_500_000)

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
    // BUDGET: 1_500_000 ms (25 min). Was 300_000 and timed out once §9e
    // (sections/slhdsaPreHash.ts) joined the `slh_stateful` category: runSlh()
    // drives the WHOLE category on BOTH engines, and §9e alone adds 120
    // (CKM_HASH_SLH_DSA_<hash> × parameter set) pairs over six operations each.
    // MEASURED 2026-09-26 on an M4 Pro, Node 22.23.1, this file running alone:
    // 1580.1 s end to end. It calls runSlh() three times — once here and once
    // in each of the two sabotage `describe`s below — and vitest timed those
    // two directly at 508.6 s and 561.2 s, so this beforeAll is the remainder,
    // ~510 s (the 13 `it` bodies themselves total under 20 ms). A ~578 s figure
    // for this beforeAll was reported under concurrent load; that one is
    // second-hand, not measured here, and is why the budget is not simply 2x
    // 510. 1_500_000 is ~2.9x the measured run and ~2.6x the reported
    // contended one.
    // Re-measure rather than nudge this if a new section joins slh_stateful.
  }, BUDGET_MS)

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
        expect(classesOf(row!.id)).toEqual(['nist-acvp-reference-sample'])
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

  // FIPS 205 §11 Table 2 signature sizes — the length a case must carry unless
  // its own upstream reason says otherwise.
  const SIG_BYTES: Record<string, number> = {
    '128s': 7856,
    '128f': 17088,
    '192s': 16224,
    '192f': 35664,
    '256s': 29792,
    '256f': 49856,
  }

  it('carries a signature whose LENGTH matches each case label (a length negative must really be the wrong length)', () => {
    // The bug this pins (2026-09-25): a row labelled "invalid signature - too
    // small" whose signature is the full FIPS 205 length grades a well-formed
    // signature against CKR_SIGNATURE_LEN_RANGE and tests nothing. The vectors
    // are a script-produced subset, so the label is not evidence — the length
    // is. sections/slhdsaAcvp.ts fails such a row loudly (vectorLengthDefect);
    // this asserts the shipped vectors are self-consistent in the first place.
    const seen = { small: 0, large: 0, full: 0 }
    for (const t of nistSigVer() as unknown as {
      parameterSet: string
      tcId: number
      reason: string
      signature: string
    }[]) {
      const want = SIG_BYTES[t.parameterSet.replace(/^SLH-DSA-(SHA2|SHAKE)-/, '')]
      expect(want, `no FIPS 205 size for ${t.parameterSet}`).toBeDefined()
      const got = t.signature.length / 2
      const where = `${t.parameterSet} tc${t.tcId} (${t.reason})`
      if (/too small/.test(t.reason)) {
        expect(got, `${where}: must be SHORTER than ${want}B`).toBeLessThan(want)
        seen.small++
      } else if (/too large/.test(t.reason)) {
        expect(got, `${where}: must be LONGER than ${want}B`).toBeGreaterThan(want)
        seen.large++
      } else {
        expect(got, `${where}: must be exactly ${want}B`).toBe(want)
        seen.full++
      }
    }
    // Both length reasons are actually exercised — not vacuously satisfied.
    expect(seen.small).toBeGreaterThan(0)
    expect(seen.large).toBeGreaterThan(0)
    expect(seen.full).toBeGreaterThan(0)
  })

  it('C++ HashSLH-DSA pre-hash signatures now verify/byte-match (E1 fixed: no more double message-wrap)', () => {
    // Was 'FINDING: C++ rejects every valid NIST HashSLH-DSA signature and
    // mis-signs HashSLH-DSA deterministically' until 2026-09-25 (P3 combined
    // rebuild, hsm a22e6ca0): E1 (fix(cpp): HashSLH-DSA signs/verifies M'
    // once, not wrapped twice) closes exactly the 7 cases this test used to
    // pin as failing — confirmed against the rebuilt engine, not guessed.
    const cppPreHash = section().filter(
      (r) =>
        engineOf(r) === 'C++' &&
        r.caseMeta?.mode === 'preHash' &&
        r.caseMeta?.origin === 'nist-acvp-server'
    )
    const failed = cppPreHash.filter((r) => r.status === 'fail').map(caseKey)
    expect(failed).toEqual([])
    for (const r of cppPreHash) {
      expect(r.status, `${r.testCase}: ${r.details}`).toBe('pass')
      // Rust agrees — the same cases already passed there.
      expect(results.find((x) => x.id === `${caseKey(r)}-Rust`)?.status).toBe('pass')
    }
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
      expect(classesOf(r!.id)).toEqual(['nist-acvp-reference-sample'])
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
      expect(classesOf(r!.id)).not.toContain('nist-acvp-reference-sample')
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
      expect(classesOf(h!.id)).not.toContain('nist-acvp-reference-sample')
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
      expect(classesOf(r.id)).toEqual([])
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
    // Was cppFindings + ctx256 + hedged-randomized until 2026-09-25 (P3
    // combined rebuild): E1 closed the cppFindings set (now empty) and E9/D6
    // aligned ctx256 to the same CKR_MECHANISM_PARAM_INVALID on both engines
    // (see SLH_CTX256_PIN) — confirmed against the rebuilt engine. Only the
    // inherently-randomized hedged-signature probe still legitimately
    // disagrees byte-for-byte between engines.
    const cppFindings = section()
      .filter((r) => engineOf(r) === 'C++' && r.status === 'fail')
      .map(caseKey)
    expect(cppFindings).toEqual([])
    expect(disagree.sort()).toEqual(['slhdsa-probe-hedged-randomized'])
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

// ── Sabotage: a length negative that is no longer short must turn red ──────
describe('SLH-DSA reference samples — a no-op length mutation fails loudly', () => {
  it(
    'a "too small" case whose signature is restored to the full FIPS 205 length turns that row red on both engines',
    async () => {
      // Regression guard for 2026-09-25: the negative that tests nothing must not
      // be able to pass. Restoring the full length on a COPY of the vectors (the
      // exact shape a subset-extraction bug would produce) must fail the row with
      // a vector-integrity verdict, never grade the engine's answer.
      const sv = readVectors('slhdsa_sigver_shake_test.json')
      const group = sv.testGroups.find((g: { tests: { reason: string }[] }) =>
        g.tests.some((t) => /too small/.test(t.reason))
      )
      const neg = group.tests.find((t: { reason: string }) => /too small/.test(t.reason))
      const short = neg.signature.length / 2
      neg.signature = neg.signature + '00' // 7855B → 7856B = full SLH-DSA-*-128s length
      expect(neg.signature.length / 2).toBe(short + 1)

      vi.resetModules()
      vi.doMock('@/data/acvp/slhdsa_sigver_shake_test.json', () => ({ default: sv }))
      try {
        const results = await runSlh()
        for (const engine of ['C++', 'Rust']) {
          const r = results.find(
            (x) =>
              x.id ===
              `slhdsa-sigver-nist-${group.parameterSet}-tg${group.tgId}-tc${neg.tcId}-${engine}`
          )
          expect(r, `${engine} tc${neg.tcId}`).toBeDefined()
          expect(r!.status, r!.details).toBe('fail')
          expect(r!.details).toMatch(
            /vector integrity: upstream reason "invalid signature - too small"/
          )
          expect(r!.details).toMatch(/not shorter than the 7856B FIPS 205 length/)
          expect(r!.details).toMatch(/cannot test what it claims/)
        }
        // Nothing else turned red — only the sabotaged case, on both engines.
        expect(results.filter((r) => r.status === 'fail')).toHaveLength(2)
      } finally {
        vi.doUnmock('@/data/acvp/slhdsa_sigver_shake_test.json')
      }
      // BUDGET: 1_500_000 ms (25 min). Was 300_000. This `it` runs a whole extra
      // runSlh() against the mocked vectors, so it costs about what the beforeAll
      // above costs. MEASURED DIRECTLY at 508.6 s on 2026-09-26 (M4 Pro, Node
      // 22.23.1) — vitest reported this `it` at 508643 ms. ~2.9x headroom.
    },
    BUDGET_MS
  )
})

// ── Sabotage: expected values changed on a COPY must turn rows red ─────────
describe('SLH-DSA reference samples — sabotaged expectations fail', () => {
  it(
    'a flipped NIST disposition and changed expected signature bytes are detected on both engines',
    async () => {
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
          // §9e.3 (sections/slhdsaPreHash.ts part 3) drives the SAME
          // slhdsa_ctx_test /sigGen tuples over the message-based interface, so
          // the flipped SLH-DSA-SHA2-128f expected signature must be caught
          // there too — once on the verify of the NIST signature, once on the
          // deterministic byte-match. See the derivation below.
          const mv = results.find(
            (r) => r.id === `slhdsa-pure-message-sigver-SLH-DSA-SHA2-128f-tg1-tc5-${engine}`
          )
          expect(mv?.status, mv?.details).toBe('fail')
          expect(mv?.details).toMatch(/C_VerifyMessage → CKR_SIGNATURE_INVALID/)
          const md = results.find(
            (r) => r.id === `slhdsa-pure-message-siggen-det-SLH-DSA-SHA2-128f-tg1-tc5-${engine}`
          )
          expect(md?.status, md?.details).toBe('fail')
          expect(md?.details).toMatch(/signature mismatch/)
        }

        // ── The sabotage proof: EXACTLY the rows that read a sabotaged byte ──
        //
        // This is a sabotage test, so the set of red rows IS the assertion. It
        // is asserted as the derived row-id SET, not as a bare count, because a
        // count silently absorbs both a new legitimate reader and an unrelated
        // regression. Each entry below is named with the code that reads the
        // mutated value, so the next person can re-derive rather than guess.
        //
        // Three fixtures are mocked; five row families legitimately read a
        // mutated byte, each on both engines → 5 × 2 = 10 red rows.
        //
        //  (A) slhdsa_sigver_sha2_test.json — one pure-group negative's
        //      `testPassed` flipped to true:
        //      1. slhdsa-sigver-nist-<ps>-tg<N>-tc<M>   sections/slhdsaAcvp.ts §1
        //  (B) slhdsa_siggen_det_test.json — testGroups[0].tests[0].signature
        //      flipped in its last byte:
        //      2. slhdsa-siggen-det-<ps>-tg<N>-tc<M>    sections/slhdsaAcvp.ts §2 (file:'det')
        //  (C) slhdsa_ctx_test.json — sigGen['SLH-DSA-SHA2-128f'].signature
        //      flipped in its last byte. THREE readers compare against it:
        //      3. slhdsa-siggen-det-SLH-DSA-SHA2-128f-tg1-tc5
        //                                               sections/slhdsaAcvp.ts §2 (file:'ctx')
        //      4. slhdsa-pure-message-sigver-SLH-DSA-SHA2-128f-tg1-tc5
        //                                               sections/slhdsaPreHash.ts §9e.3
        //      5. slhdsa-pure-message-siggen-det-SLH-DSA-SHA2-128f-tg1-tc5
        //                                               sections/slhdsaPreHash.ts §9e.3
        //
        // WENT 6 → 10 on 2026-09-26 when §9e.3 landed. Rows 4 and 5 are the new
        // ones and they are CORRECT additions: §9e.3 deliberately reuses the
        // same NIST tuples ("no new vector bytes: the point is the API path"), so
        // a corrupted expected signature must be detected on the message-based
        // path exactly as on the single-part one. The count was NOT relaxed to
        // make this green — the two new rows were each pinned individually above,
        // with the verdict text they must carry.
        //
        // Deliberately NOT red, verified by reading the code rather than assumed:
        //  - slhdsa-pure-message-siggen-hedged-SLH-DSA-SHA2-128f-tg1-tc5 —
        //    CKH_HEDGE_REQUIRED signs and verifies BACK its own signature and
        //    never reads the NIST expected bytes; it is a round-trip, not a
        //    byte-match, so a corrupted expectation is invisible to it by design.
        //  - slhdsa-cov-det-{msgflip,ctxflip}-SLH-DSA-SHA2-128f — sections/
        //    slhdsaCoverage.ts §3 reads the same signature but only asserts
        //    `firstDiff(s.sig, nistSig) !== 'identical'`, and a 1-bit-flipped
        //    expectation still differs from a correctly-produced signature.
        //  - slhdsa-sigver-kat-* and the product-authored slhdsa-sigver-local-*
        //    rows read slhdsa_ctx_test's /sigVer map, not /sigGen — untouched.
        //  - The 7 C++ HashSLH-DSA findings this used to add (E1) are fixed as of
        //    the P3 combined rebuild (2026-09-25, hsm a22e6ca0).
        const expectedRed = ['C++', 'Rust'].flatMap((engine) => [
          `slhdsa-sigver-nist-${pureGroup.parameterSet}-tg${pureGroup.tgId}-tc${neg.tcId}-${engine}`,
          `slhdsa-siggen-det-${det.testGroups[0].parameterSet}-tg${det.testGroups[0].tgId}-tc${detCase.tcId}-${engine}`,
          `slhdsa-siggen-det-SLH-DSA-SHA2-128f-tg1-tc5-${engine}`,
          `slhdsa-pure-message-sigver-SLH-DSA-SHA2-128f-tg1-tc5-${engine}`,
          `slhdsa-pure-message-siggen-det-SLH-DSA-SHA2-128f-tg1-tc5-${engine}`,
        ])
        expect(
          results
            .filter((r) => r.status === 'fail')
            .map((r) => r.id)
            .sort()
        ).toEqual([...expectedRed].sort())
      } finally {
        vi.doUnmock('@/data/acvp/slhdsa_sigver_sha2_test.json')
        vi.doUnmock('@/data/acvp/slhdsa_siggen_det_test.json')
        vi.doUnmock('@/data/acvp/slhdsa_ctx_test.json')
      }
      // BUDGET: 1_500_000 ms (25 min). Was 300_000. MEASURED DIRECTLY at 561.2 s
      // on 2026-09-26 (M4 Pro, Node 22.23.1) — vitest reported this `it` at
      // 561221 ms. It is the most expensive `it` in the file because its three
      // mocks force vi.resetModules() and a full re-import before its runSlh().
      // ~2.7x headroom.
    },
    BUDGET_MS
  )
})
