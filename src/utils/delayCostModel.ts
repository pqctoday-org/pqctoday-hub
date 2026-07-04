// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cost-of-inaction model for the Business Case workshop's Cost of Inaction step.
 *
 * Fixes the prior model:
 *  - Penalty accrues under ONE correct condition (unmigrated past the hard
 *    deadline); the old code had two blocks whose `d >= delay === false`
 *    parsed to the same condition, double-counting the fine.
 *  - HNDL is applied once. The quantum single-event breach cost is passed in
 *    already amplified; annual loss = that × probability, not × an HNDL factor
 *    a second time.
 *  - Migrating "now" is NOT free of breach risk: data harvested before you
 *    migrate stays decryptable, so a residual HNDL tail persists post-migration.
 *  - Breach probability is an explicit input, not a hidden constant.
 *  - Cash flows are discounted to NPV, matching the ROI Calculator.
 */

export interface DelayScenarioInputs {
  /** Single-event quantum-enabled breach cost (SLE), already HNDL-amplified. */
  quantumBreachPerEvent: number
  /** Annual probability (0–100) of a breach. */
  annualBreachProbPct: number
  /** One-time migration cost. */
  migrationCostUSD: number
  /** Extra migration cost per year of delay (complexity premium). */
  delayPremiumPerYear: number
  /** Regulatory penalty per year spent unmigrated past the hard deadline. */
  regulatoryPenaltyUSD: number
  /** Year the mandate bites. */
  hardDeadlineYear: number
  /** Current calendar year (projection index 0). */
  currentYear: number
  /** Projection horizon in years. */
  horizonYears: number
  /** Discount rate (0–100) for NPV. */
  discountRatePct: number
  /**
   * Fraction (0–1) of the quantum annual breach risk that persists AFTER
   * migration — data harvested before you migrated stays decryptable (HNDL tail).
   */
  residualFactor: number
}

export const DELAY_MODEL_DEFAULTS = {
  annualBreachProbPct: 5,
  horizonYears: 10,
  discountRatePct: 10,
  residualFactor: 0.3,
} as const

/** Expected annual breach loss while still on quantum-vulnerable crypto. */
export function preMigrationAnnualLoss(inp: DelayScenarioInputs): number {
  return inp.quantumBreachPerEvent * (Math.max(0, inp.annualBreachProbPct) / 100)
}

/** Residual expected annual loss after migration (already-harvested data). */
export function postMigrationAnnualLoss(inp: DelayScenarioInputs): number {
  return preMigrationAnnualLoss(inp) * Math.max(0, inp.residualFactor)
}

export interface DelayYearRow {
  year: number
  migration: number
  breach: number
  penalty: number
  /** Cumulative discounted total through this year. */
  cumulativeTotal: number
}

export interface DelayScenarioResult {
  rows: DelayYearRow[]
  /** Total discounted cost over the horizon (NPV). */
  total: number
  totalMigration: number
  totalBreach: number
  totalPenalty: number
}

/**
 * Project the discounted cost of migrating after `delayYears` years.
 * `delayYears = 0` models migrating now — which still carries the HNDL residual
 * tail, so it is never zero-risk.
 */
export function projectDelayScenario(
  inp: DelayScenarioInputs,
  delayYears: number
): DelayScenarioResult {
  const r = Math.max(0, inp.discountRatePct) / 100
  const preLoss = preMigrationAnnualLoss(inp)
  const postLoss = postMigrationAnnualLoss(inp)

  const rows: DelayYearRow[] = []
  let cum = 0
  let totalMigration = 0
  let totalBreach = 0
  let totalPenalty = 0

  for (let t = 0; t < inp.horizonYears; t++) {
    const year = inp.currentYear + t
    const discount = 1 / Math.pow(1 + r, t)
    const migrated = t >= delayYears

    const migration =
      t === delayYears
        ? (inp.migrationCostUSD + inp.delayPremiumPerYear * delayYears) * discount
        : 0
    const breach = (migrated ? postLoss : preLoss) * discount
    // ONE condition: a fine accrues each year you are past the mandate deadline
    // and have not yet migrated.
    const penalty =
      !migrated && year > inp.hardDeadlineYear ? inp.regulatoryPenaltyUSD * discount : 0

    totalMigration += migration
    totalBreach += breach
    totalPenalty += penalty
    cum += migration + breach + penalty
    rows.push({ year, migration, breach, penalty, cumulativeTotal: cum })
  }

  return { rows, total: cum, totalMigration, totalBreach, totalPenalty }
}

/** Extra discounted cost of delaying `delayYears` vs migrating now. */
export function costOfInaction(inp: DelayScenarioInputs, delayYears: number): number {
  return projectDelayScenario(inp, delayYears).total - projectDelayScenario(inp, 0).total
}
