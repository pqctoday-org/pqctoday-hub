// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { costOfWaiting, computeMoscaVerdict } from './moscaTheorem'
import {
  DATA_SHELF_LIFE_YEARS,
  type BreachModelInputs,
  type DataSensitivityClass,
} from './breachCostModel'

describe('computeMoscaVerdict', () => {
  it('applies x + y > z: latest safe start = CRQC year − migration − shelf life', () => {
    const v = computeMoscaVerdict(
      { shelfLifeYears: 10, migrationDurationYears: 3, crqcScenario: 'consensus' },
      2026
    )
    expect(v.latestSafeStartYear).toBeCloseTo(v.crqcYear - 3 - 10, 6)
    expect(v.alreadyLate).toBe(true)
    expect(v.yearsLate).toBeCloseTo(2026 - v.latestSafeStartYear, 6)
  })

  it('a slower CRQC scenario leaves a later safe start than a faster one', () => {
    const slow = computeMoscaVerdict(
      { shelfLifeYears: 10, migrationDurationYears: 3, crqcScenario: 'slow' },
      2026
    )
    const fast = computeMoscaVerdict(
      { shelfLifeYears: 10, migrationDurationYears: 3, crqcScenario: 'fast' },
      2026
    )
    expect(slow.latestSafeStartYear).toBeGreaterThan(fast.latestSafeStartYear)
  })

  it('reports not-late when the deadline is still ahead', () => {
    const v = computeMoscaVerdict(
      { shelfLifeYears: 3, migrationDurationYears: 3, crqcScenario: 'consensus' },
      2026
    )
    expect(v.alreadyLate).toBe(false)
    expect(v.yearsLate).toBe(0)
  })
})

// ── W1-3b regression guard (audit 2026-08-10) ────────────────────────────────
// costOfWaiting returned NEGATIVE numbers — −$82,718 at 8 years, −$942,987 at
// 15 — because it slid a fixed-width horizon window forward and differenced the
// two ends. Waiting must never be free, and must never pay.
describe('costOfWaiting', () => {
  const inputs: BreachModelInputs = {
    baseline: 4_440_000,
    breachScale: 1,
    yearsOfData: 5,
    hndlFactorPct: 30,
    annualBreachProbPct: 9,
    dataSensitivityClass: 'general-pii',
    asOfYear: 2026,
    planningHorizonYears: 10,
    discountRateAnnual: 0.06,
  }

  it('is never negative, for any delay, scenario or data class', () => {
    for (const dataSensitivityClass of Object.keys(
      DATA_SHELF_LIFE_YEARS
    ) as DataSensitivityClass[]) {
      for (let d = 0; d <= 20; d++) {
        expect(
          costOfWaiting({ ...inputs, dataSensitivityClass }, d),
          `${dataSensitivityClass} @ ${d}y`
        ).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('grows strictly with the length of the wait', () => {
    let prev = -1
    for (let d = 0; d <= 15; d++) {
      const cost = costOfWaiting(inputs, d)
      expect(cost, `delay ${d}y`).toBeGreaterThan(prev)
      prev = cost
    }
  })

  it('is zero for a zero delay', () => {
    expect(costOfWaiting(inputs, 0)).toBe(0)
  })
})
