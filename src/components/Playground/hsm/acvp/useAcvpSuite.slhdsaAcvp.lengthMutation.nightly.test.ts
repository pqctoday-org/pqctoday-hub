// SPDX-License-Identifier: AGPL-3.0-only
// Independent engine and mock state: retain the exact original length-integrity sabotage.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { BUDGET_MS, initializeNightlyEngines, readVectors, runSlh } from './slhdsaNightlyFixture'

describe('SLH-DSA reference samples — a no-op length mutation fails loudly', () => {
  beforeAll(initializeNightlyEngines, BUDGET_MS)

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
        const results = await runSlh('length mutation')
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
