// SPDX-License-Identifier: AGPL-3.0-only
// Baseline: all original reference-vector assertions, on both real engines.
// The two mutation passes live in separate nightly files so all three can run concurrently.
import { beforeAll, describe, expect, it } from 'vitest'
import type { TestResult } from './useAcvpSuite'
import { SLH_CTX256_PIN } from './sections/slhdsaAcvp'
import {
  BUDGET_MS,
  SECTION,
  SV_FILES,
  caseKey,
  classesOf,
  engineOf,
  initializeNightlyEngines,
  readVectors,
  runSlh,
} from './slhdsaNightlyFixture'

describe('SLH-DSA reference samples — both engines, real vectors', () => {
  let results: TestResult[] = []

  beforeAll(async () => {
    await initializeNightlyEngines()
    results = await runSlh('baseline')
    // The full-category baseline retains its 25-minute per-pass budget.
    // Mutation passes now run in separate files, each with its own engine state.
    // Re-measure if a new section joins slh_stateful; do not raise the budget
    // to hide a regression.
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
    // 28 NIST sigVer (14 SHA2 + 14 SHAKE, including the SHA2-512/224 and /256
    // pre-hash cases) + 16 deterministic sigGen (12 ctx-255 + 4 empty-ctx/pre-hash)
    // + 32 product-authored mutations (12 × pk/ctx, 4 × sig/msg) + 2 probes; no skip
    // row remains. Hedged and internal groups: optionalInput local test.
    expect(cpp).toHaveLength(78)
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

  it('runs every upstream group it carries — no skips', () => {
    expect(section().filter((r) => r.status === 'skip')).toEqual([])
  })

  it('runs the SHA2-512/224 and SHA2-512/256 cases through the generic CKM_HASH_SLH_DSA', () => {
    const t = section().filter(
      (r) => r.caseMeta?.mode === 'preHash' && String(r.caseMeta?.hashAlg).startsWith('SHA2-512/')
    )
    expect(t).toHaveLength(24) // 12 NIST sigVer cases × 2 engines
    for (const r of t) {
      expect(r.status, r.details).toBe('pass')
      expect(r.details).toMatch(
        /CKM_HASH_SLH_DSA \(generic, hash = CKM_SHA512_2(24|56), PH\(M\) supplied\)/
      )
    }
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
