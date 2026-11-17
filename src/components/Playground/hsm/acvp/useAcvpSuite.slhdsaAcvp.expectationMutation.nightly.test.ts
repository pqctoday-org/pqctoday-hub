// SPDX-License-Identifier: AGPL-3.0-only
// Independent engine and mock state: retain the exact original expectation sabotage.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  BUDGET_MS,
  engineOf,
  initializeNightlyEngines,
  readVectors,
  runSlh,
} from './slhdsaNightlyFixture'

describe('SLH-DSA reference samples — sabotaged expectations fail', () => {
  beforeAll(initializeNightlyEngines, BUDGET_MS)

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
        const results = await runSlh('expectation mutation')
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
