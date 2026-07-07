// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  DELAY_MODEL_DEFAULTS,
  projectDelayScenario,
  costOfInaction,
  crossoverYear,
  type DelayScenarioInputs,
  type DelayYearRow,
} from './delayCostModel'
import { computeBreachCosts } from './breachCostModel'

function computeRowAleForTest(inp: DelayScenarioInputs, yearsOfData: number, year: number): number {
  return computeBreachCosts({
    baseline: inp.breachBaseline,
    breachScale: inp.breachScale,
    yearsOfData,
    hndlFactorPct: inp.hndlFactorPct,
    annualBreachProbPct: inp.annualBreachProbPct,
    dataSensitivityClass: inp.dataSensitivityClass,
    asOfYear: year,
    planningHorizonYears: 1,
    discountRateAnnual: Math.max(0, inp.discountRatePct) / 100,
  }).quantumALE
}

// now=2026, deadline 2030 — a delay long enough to cross it triggers penalties.
const base: DelayScenarioInputs = {
  breachBaseline: 5_560_000,
  breachScale: 1,
  baseYearsOfData: 5,
  hndlFactorPct: 30,
  dataSensitivityClass: 'general-pii',
  annualBreachProbPct: DELAY_MODEL_DEFAULTS.annualBreachProbPct,
  migrationCostUSD: 4_500_000,
  delayPremiumPerYear: 450_000,
  migrationDurationYears: DELAY_MODEL_DEFAULTS.migrationDurationYears,
  mandateType: 'HARD',
  hardDeadlineYear: 2030,
  annualFineUSD: 2_000_000,
  cliffLossUSD: 0,
  currentYear: 2026,
  horizonYears: DELAY_MODEL_DEFAULTS.horizonYears,
  discountRatePct: DELAY_MODEL_DEFAULTS.discountRatePct,
}

describe('projectDelayScenario', () => {
  it('migrating now still carries a nonzero HNDL residual in every row (never zero-risk)', () => {
    const result = projectDelayScenario(base, 0)
    for (const row of result.rows) {
      expect(row.breach).toBeGreaterThan(0)
    }
    expect(result.totalPenalty).toBe(0) // migrated well before the deadline
  })

  it('freezing the harvested corpus at migration changes exposure from the never-migrate counterfactual', () => {
    // migrationDurationYears = 3, delayYears = 0 -> fully migrated from t=3 on,
    // corpus frozen at baseYearsOfData (5). A counterfactual that never
    // migrates keeps accumulating (5 + t) instead.
    const migrated = projectDelayScenario(base, 0)
    const neverMigrates = projectDelayScenario(base, base.horizonYears + 1) // delay past the whole horizon = never migrates within it
    const undiscount = (row: DelayYearRow, t: number) => row.breach * Math.pow(1.1, t)
    expect(undiscount(migrated.rows[9], 9)).not.toBeCloseTo(undiscount(neverMigrates.rows[9], 9), 0)
  })

  it('exposure during the migration transition is always between the fully-vulnerable and fully-migrated values for that year (a ramp, not an instant switch)', () => {
    const delayYears = 2
    const result = projectDelayScenario(base, delayYears)
    const discount = (t: number) => 1 / Math.pow(1.1, t)

    for (let t = delayYears; t < delayYears + base.migrationDurationYears; t++) {
      const year = base.currentYear + t
      const vulnerableYearsOfData = base.baseYearsOfData + t
      const frozenYearsOfData = base.baseYearsOfData + delayYears
      const vulnerableALE = computeRowAleForTest(base, vulnerableYearsOfData, year)
      const frozenALE = computeRowAleForTest(base, frozenYearsOfData, year)
      const lo = Math.min(vulnerableALE, frozenALE) * discount(t)
      const hi = Math.max(vulnerableALE, frozenALE) * discount(t)
      expect(result.rows[t].breach).toBeGreaterThanOrEqual(lo - 1)
      expect(result.rows[t].breach).toBeLessThanOrEqual(hi + 1)
    }
  })

  it('accrues a penalty only once migration fully completes past a HARD deadline', () => {
    const result = projectDelayScenario({ ...base, hardDeadlineYear: 2027 }, 8)
    const penaltyRows = result.rows.filter((row) => row.penalty > 0)
    expect(penaltyRows.length).toBeGreaterThan(0)
  })

  it('charges the one-time cliff exactly once even across many unmigrated years past the deadline', () => {
    const result = projectDelayScenario(
      { ...base, hardDeadlineYear: 2027, cliffLossUSD: 3_000_000, annualFineUSD: 0 },
      8
    )
    // First unmigrated year past 2027 is 2028 (t=2); charged once, discounted there.
    expect(result.totalCliff).toBeCloseTo(3_000_000 / Math.pow(1.1, 2), -2)
  })

  it('a SOFT mandate never accrues a penalty, however long the delay', () => {
    const result = projectDelayScenario({ ...base, mandateType: 'SOFT', hardDeadlineYear: 2027 }, 8)
    expect(result.totalPenalty).toBe(0)
  })

  it('a NONE mandate never accrues a penalty', () => {
    const result = projectDelayScenario({ ...base, mandateType: 'NONE', hardDeadlineYear: 2027 }, 8)
    expect(result.totalPenalty).toBe(0)
  })

  it('a delay that still completes migration before the HARD deadline incurs no penalty', () => {
    // hardDeadlineYear 2033, currentYear 2026, delay 1yr + 3yr migration duration -> done by 2030.
    const result = projectDelayScenario({ ...base, hardDeadlineYear: 2033 }, 1)
    expect(result.totalPenalty).toBe(0)
  })

  it('adds the delay premium to the (later, discounted) migration cost', () => {
    const now = projectDelayScenario(base, 0)
    const delayed = projectDelayScenario(base, 3)
    expect(now.totalMigration).toBeCloseTo(base.migrationCostUSD, -2)
    const delayedMigrationUndiscounted = delayed.totalMigration * Math.pow(1.1, 3)
    expect(delayedMigrationUndiscounted).toBeCloseTo(
      base.migrationCostUSD + base.delayPremiumPerYear * 3,
      -2
    )
  })

  it('discounts later cash flows (higher discount rate lowers the same delayed scenario total)', () => {
    const lowRate = projectDelayScenario({ ...base, discountRatePct: 2 }, 5).total
    const highRate = projectDelayScenario({ ...base, discountRatePct: 20 }, 5).total
    expect(highRate).toBeLessThan(lowRate)
  })
})

describe('costOfInaction', () => {
  it('is positive when a real HARD deadline and delay premium are in play', () => {
    expect(costOfInaction(base, 5)).toBeGreaterThan(0)
  })

  it('is zero when the delay is zero', () => {
    expect(costOfInaction(base, 0)).toBe(0)
  })
})

describe('crossoverYear', () => {
  function row(year: number, cumulativeTotal: number): DelayYearRow {
    return { year, migration: 0, breach: 0, penalty: 0, cumulativeTotal }
  }

  it('finds the first year the delayed scenario permanently overtakes migrate-now', () => {
    const now = [row(2026, 100), row(2027, 200), row(2028, 300)]
    const delayed = [row(2026, 50), row(2027, 250), row(2028, 400)]
    expect(crossoverYear(now, delayed)).toBe(2027)
  })

  it('returns the first year when delayed is ahead from the start', () => {
    const now = [row(2026, 100), row(2027, 200)]
    const delayed = [row(2026, 150), row(2027, 300)]
    expect(crossoverYear(now, delayed)).toBe(2026)
  })

  it('returns null when delayed never permanently overtakes migrate-now', () => {
    const now = [row(2026, 100), row(2027, 500)]
    const delayed = [row(2026, 150), row(2027, 200)]
    expect(crossoverYear(now, delayed)).toBeNull()
  })

  it('ignores a brief, non-permanent crossing', () => {
    const now = [row(2026, 100), row(2027, 500), row(2028, 600)]
    const delayed = [row(2026, 150), row(2027, 200), row(2028, 900)]
    // 2027: delayed(200) < now(500), so the only candidate is 2028, which
    // does hold through the horizon end.
    expect(crossoverYear(now, delayed)).toBe(2028)
  })
})

describe('DELAY_MODEL_DEFAULTS', () => {
  it('exposes sane defaults', () => {
    expect(DELAY_MODEL_DEFAULTS.horizonYears).toBeGreaterThan(0)
    expect(DELAY_MODEL_DEFAULTS.discountRatePct).toBeGreaterThan(0)
    expect(DELAY_MODEL_DEFAULTS.migrationDurationYears).toBeGreaterThan(0)
  })
})
