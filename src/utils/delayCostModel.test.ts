// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  DELAY_MODEL_DEFAULTS,
  type DelayScenarioInputs,
  preMigrationAnnualLoss,
  postMigrationAnnualLoss,
  projectDelayScenario,
  costOfInaction,
} from './delayCostModel'

// now=2026, deadline 2030 — a delay long enough to cross it triggers penalties.
const base: DelayScenarioInputs = {
  quantumBreachPerEvent: 15_000_000,
  annualBreachProbPct: 5,
  migrationCostUSD: 4_500_000,
  delayPremiumPerYear: 450_000,
  regulatoryPenaltyUSD: 2_000_000,
  hardDeadlineYear: 2030,
  currentYear: 2026,
  horizonYears: 10,
  discountRatePct: 10,
  residualFactor: 0.3,
}

describe('annual loss', () => {
  it('pre-migration loss = breach × probability', () => {
    expect(preMigrationAnnualLoss(base)).toBeCloseTo(15_000_000 * 0.05, 6)
  })

  it('post-migration loss is the residual HNDL tail (never zero for a positive risk)', () => {
    expect(postMigrationAnnualLoss(base)).toBeCloseTo(preMigrationAnnualLoss(base) * 0.3, 6)
    expect(postMigrationAnnualLoss(base)).toBeGreaterThan(0)
  })
})

describe('projectDelayScenario', () => {
  it('migrating now still carries an HNDL residual — breach cost is non-zero', () => {
    const now = projectDelayScenario(base, 0)
    expect(now.totalBreach).toBeGreaterThan(0)
    expect(now.totalPenalty).toBe(0) // migrated, so never past-deadline-unmigrated
    // migration paid at t=0 (undiscounted)
    expect(now.rows[0].migration).toBeCloseTo(base.migrationCostUSD, 6)
  })

  it('accrues the penalty exactly once per unmigrated post-deadline year (no double-count)', () => {
    // delay 6 → migrate 2032; unmigrated years past 2030 = just 2031 (t=5)
    const d6 = projectDelayScenario(base, 6)
    const penaltyYears = d6.rows.filter((r) => r.penalty > 0)
    expect(penaltyYears.map((r) => r.year)).toEqual([2031])
    // discounted single penalty, NOT double
    const expected = base.regulatoryPenaltyUSD / Math.pow(1.1, 5)
    expect(penaltyYears[0].penalty).toBeCloseTo(expected, 2)
    expect(d6.totalPenalty).toBeCloseTo(expected, 2)
  })

  it('short delays that still beat the deadline incur no penalty', () => {
    expect(projectDelayScenario(base, 2).totalPenalty).toBe(0)
    expect(projectDelayScenario(base, 3).totalPenalty).toBe(0)
  })

  it('adds the delay premium to the (later, discounted) migration cost', () => {
    const d2 = projectDelayScenario(base, 2)
    const migRow = d2.rows.find((r) => r.migration > 0)!
    expect(migRow.year).toBe(2028)
    const expected = (base.migrationCostUSD + base.delayPremiumPerYear * 2) / Math.pow(1.1, 2)
    expect(migRow.migration).toBeCloseTo(expected, 2)
  })

  it('discounts later cash flows (0% rate ≥ 10% rate total)', () => {
    const undiscounted = projectDelayScenario({ ...base, discountRatePct: 0 }, 4).total
    const discounted = projectDelayScenario(base, 4).total
    expect(undiscounted).toBeGreaterThan(discounted)
  })
})

describe('costOfInaction', () => {
  it('is positive — delaying costs more than migrating now', () => {
    expect(costOfInaction(base, 2)).toBeGreaterThan(0)
    expect(costOfInaction(base, 6)).toBeGreaterThan(costOfInaction(base, 2))
  })

  it('is zero when the delay is zero', () => {
    expect(costOfInaction(base, 0)).toBe(0)
  })

  it('exposes sane defaults', () => {
    expect(DELAY_MODEL_DEFAULTS.annualBreachProbPct).toBe(5)
    expect(DELAY_MODEL_DEFAULTS.horizonYears).toBe(10)
    expect(DELAY_MODEL_DEFAULTS.residualFactor).toBe(0.3)
  })
})
