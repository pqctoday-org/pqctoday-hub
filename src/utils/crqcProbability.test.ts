// SPDX-License-Identifier: GPL-3.0-only
/**
 * The CRQC-arrival curve had NO test file.
 *
 * Every dollar figure the business tools produce passes through
 * `crqcCumulativeProbability`: the Breach Scenario Simulator, the Cost of
 * Inaction Analyzer, the Cost Model Explorer's ALE reference, the Cyber
 * Insurance Lens, and — via `medianCrqcYear` — the entire Mosca decision layer.
 * It was the single most load-bearing numeric function in the suite and the
 * only one of its group without a gate. (Re-audit batch 3, 2026-08-11.)
 *
 * The maths was independently recomputed and is correct; nothing here is a bug
 * fix. What was missing was anything to stop it changing silently. The GRI
 * anchors in particular are the one part of this suite's grounding that was
 * ever verified against a cached primary source, so they are worth pinning:
 * the report states 28-49% within 10 years and 51-70% within 15, from 26
 * experts, and the curve reproduces all four numbers.
 */
import { describe, it, expect } from 'vitest'
import {
  crqcCumulativeProbability,
  crqcProbabilityWithinHorizon,
  medianCrqcYear,
  CRQC_CURVE_YEAR_RANGE,
  type CrqcScenario,
} from './crqcProbability'

const SCENARIOS: CrqcScenario[] = ['slow', 'consensus', 'fast']

describe('CRQC curve — GRI 2025 anchors', () => {
  it('reproduces the report’s 10-year band exactly (28-49% by 2035)', () => {
    expect(crqcCumulativeProbability(2035, 'slow')).toBeCloseTo(0.28, 10)
    expect(crqcCumulativeProbability(2035, 'fast')).toBeCloseTo(0.49, 10)
  })

  it('reproduces the report’s 15-year band exactly (51-70% by 2040)', () => {
    expect(crqcCumulativeProbability(2040, 'slow')).toBeCloseTo(0.51, 10)
    expect(crqcCumulativeProbability(2040, 'fast')).toBeCloseTo(0.7, 10)
  })

  it('places consensus at the midpoint of the survey band, not at either edge', () => {
    // 'consensus' is computed, not stored — a silent switch to "average of
    // something else" would move every headline number in the suite.
    expect(crqcCumulativeProbability(2035, 'consensus')).toBeCloseTo(0.385, 10)
    expect(crqcCumulativeProbability(2040, 'consensus')).toBeCloseTo(0.605, 10)
  })
})

describe('crqcCumulativeProbability', () => {
  it('is monotonically non-decreasing in every scenario', () => {
    for (const s of SCENARIOS) {
      for (let y = CRQC_CURVE_YEAR_RANGE.first; y < CRQC_CURVE_YEAR_RANGE.last; y++) {
        expect(
          crqcCumulativeProbability(y + 1, s),
          `${s} fell between ${y} and ${y + 1}`
        ).toBeGreaterThanOrEqual(crqcCumulativeProbability(y, s))
      }
    }
  })

  it('orders the scenarios slow <= consensus <= fast at every year', () => {
    for (let y = CRQC_CURVE_YEAR_RANGE.first; y <= CRQC_CURVE_YEAR_RANGE.last; y++) {
      const slow = crqcCumulativeProbability(y, 'slow')
      const mid = crqcCumulativeProbability(y, 'consensus')
      const fast = crqcCumulativeProbability(y, 'fast')
      expect(mid, `year ${y}`).toBeGreaterThanOrEqual(slow)
      expect(fast, `year ${y}`).toBeGreaterThanOrEqual(mid)
    }
  })

  it('stays a probability, and clamps outside the curve rather than extrapolating', () => {
    for (const s of SCENARIOS) {
      for (const y of [1900, 2000, 2025, 2046, 2100, 3000]) {
        const p = crqcCumulativeProbability(y, s)
        expect(p, `${s} @ ${y}`).toBeGreaterThanOrEqual(0)
        expect(p, `${s} @ ${y}`).toBeLessThanOrEqual(1)
      }
      // Clamped, not extrapolated: a far-future year must not exceed the
      // curve's own endpoint.
      expect(crqcCumulativeProbability(3000, s)).toBe(
        crqcCumulativeProbability(CRQC_CURVE_YEAR_RANGE.last, s)
      )
      expect(crqcCumulativeProbability(1900, s)).toBe(
        crqcCumulativeProbability(CRQC_CURVE_YEAR_RANGE.first, s)
      )
    }
  })

  it('interpolates linearly between anchors', () => {
    // 2035 -> 0.28, 2036 -> 0.33 on the slow curve; the midpoint is 0.305.
    expect(crqcCumulativeProbability(2035.5, 'slow')).toBeCloseTo(0.305, 10)
  })
})

describe('crqcProbabilityWithinHorizon', () => {
  it('is never negative, however the window is placed', () => {
    for (const s of SCENARIOS) {
      for (let from = 2020; from <= 2050; from += 2) {
        for (const h of [0, 1, 5, 10, 30]) {
          expect(crqcProbabilityWithinHorizon(from, h, s), `${s} ${from}+${h}`).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('is zero for a zero-length window', () => {
    for (const s of SCENARIOS) expect(crqcProbabilityWithinHorizon(2030, 0, s)).toBe(0)
  })

  it('grows with the horizon', () => {
    for (const s of SCENARIOS) {
      const short = crqcProbabilityWithinHorizon(2026, 5, s)
      const long = crqcProbabilityWithinHorizon(2026, 15, s)
      expect(long).toBeGreaterThan(short)
    }
  })
})

describe('medianCrqcYear', () => {
  // Recomputed by hand from the curve: the first year each scenario crosses
  // 0.5, linearly interpolated between the bracketing anchors.
  it('finds the 50% crossing for each scenario', () => {
    expect(medianCrqcYear('slow')).toBeCloseTo(2039.8, 6)
    expect(medianCrqcYear('consensus')).toBeCloseTo(2037.6, 6)
    expect(medianCrqcYear('fast')).toBeCloseTo(2035.25, 6)
  })

  it('orders the scenarios the way their names claim', () => {
    // A sign flip here would invert every Mosca verdict in the suite while
    // still producing plausible-looking years.
    expect(medianCrqcYear('fast')).toBeLessThan(medianCrqcYear('consensus'))
    expect(medianCrqcYear('consensus')).toBeLessThan(medianCrqcYear('slow'))
  })

  it('lands inside the curve’s own range', () => {
    for (const s of SCENARIOS) {
      expect(medianCrqcYear(s)).toBeGreaterThanOrEqual(CRQC_CURVE_YEAR_RANGE.first)
      expect(medianCrqcYear(s)).toBeLessThanOrEqual(CRQC_CURVE_YEAR_RANGE.last)
    }
  })
})
