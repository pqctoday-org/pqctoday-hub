// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cost-of-inaction model for the Business Case workshop's Cost of Inaction step.
 *
 * v2 — built on the shared breach model (breachCostModel.ts) instead of a
 * parallel, hand-rolled HNDL/residual calculation:
 *  - Breach loss for each projected year comes from computeBreachCosts(), so
 *    it shares the same probability-weighted CRQC-arrival blend, data-class
 *    shelf-life decay, and HNDL cap as the Breach Scenario Simulator — no
 *    second, competing quantum-cost model.
 *  - Each row evaluates computeBreachCosts as-of THAT row's calendar year with
 *    a 1-year horizon — the marginal probability CRQC arrives in that specific
 *    year, blended into that year's expected loss. computeBreachCosts' own
 *    shelf-life decay depends only on yearsOfData (by the shared model's own
 *    design, to avoid double-counting elapsed-time uncertainty against the
 *    CRQC-arrival weighting), so it does not need a growing horizon to behave
 *    correctly here. computeBreachCosts' annuity/PV discounting is not used —
 *    it assumes a level annual amount across a horizon, not true when
 *    yearsOfData grows then freezes row to row — so this module discounts
 *    each row's ALE itself, matching the ROI Calculator's convention.
 *  - Migration is not instantaneous: exposure ramps from fully-vulnerable to
 *    the frozen post-migration residual over `migrationDurationYears`, and
 *    the harvested corpus (yearsOfData) stops growing once migration STARTS
 *    (no new data harvested once you're actively moving to PQC), not once it
 *    finishes. The residual tail's decay level is therefore fixed at whatever
 *    it was when migration began; what still varies year to year afterward is
 *    the marginal CRQC-arrival probability, not further corpus aging —
 *    matching the shared model's own simplification, not a separate one.
 *  - Regulatory penalties (fine and one-time cliff) accrue only once
 *    migration is FULLY complete and past a HARD-mandated deadline — a SOFT
 *    guidance deadline or a NONE (no applicable mandate) never accrues a
 *    penalty. See inactionDrivers.ts for how the deadline/penalty are sourced.
 */
import { computeBreachCosts, type DataSensitivityClass } from './breachCostModel'
import { ANNUAL_BREACH_PROBABILITY_PCT } from '@/data/roiBaselines'
import type { InactionMandateType } from './inactionDrivers'

export interface DelayScenarioInputs {
  /** Industry breach-cost baseline (SLE anchor), e.g. IBM 2025. */
  breachBaseline: number
  /** Breach severity as a multiple of the industry-average breach. */
  breachScale: number
  /** Years of harvested/stored encrypted data at HNDL risk, as of today. */
  baseYearsOfData: number
  /** Fraction (0–100) of stored data an attacker could retroactively decrypt. */
  hndlFactorPct: number
  dataSensitivityClass: DataSensitivityClass
  /** Annual probability (0–100) of a breach. */
  annualBreachProbPct: number
  /** One-time migration cost. */
  migrationCostUSD: number
  /** Extra migration cost per year of delay (complexity premium). */
  delayPremiumPerYear: number
  /** Years the migration itself takes once started. */
  migrationDurationYears: number
  /** Whether hardDeadlineYear is a binding mandate, guidance, or not applicable. */
  mandateType: InactionMandateType
  /** Year the mandate bites (only meaningful when mandateType === 'HARD'). */
  hardDeadlineYear: number
  /** Recurring annual fine once unmigrated past a HARD deadline. */
  annualFineUSD: number
  /** One-time contract/certification-loss cliff, charged once, past a HARD deadline. */
  cliffLossUSD: number
  /** Current calendar year (projection index 0). */
  currentYear: number
  /** Projection horizon in years. */
  horizonYears: number
  /** Discount rate (0–100) for NPV. */
  discountRatePct: number
}

export const DELAY_MODEL_DEFAULTS = {
  // Cyentia IRIS 2025 average-org anchor, not an unsourced flat figure — see
  // roiBaselines.ts. Matches the ROI Calculator and Breach Scenario Simulator.
  annualBreachProbPct: ANNUAL_BREACH_PROBABILITY_PCT.average,
  baseYearsOfData: 5,
  hndlFactorPct: 30,
  dataSensitivityClass: 'general-pii' as DataSensitivityClass,
  migrationDurationYears: 3,
  horizonYears: 10,
  discountRatePct: 10,
} as const

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
  totalFine: number
  totalCliff: number
}

/**
 * This row's probability-weighted expected annual loss, weighted by the
 * CUMULATIVE probability a CRQC exists by `year` — not the marginal chance one
 * arrives in `year` specifically.
 *
 * The marginal reading (the original) asked each row "does a CRQC arrive in
 * this one year?", which the GRI curve answers with ~3–4.5% in every year of
 * the horizon. Expected annual loss therefore came out flat — $417,582 in 2026
 * against $403,017 in 2040 — so quantum risk never accumulated, and the only
 * thing left driving the model was a fixed capex sliding down the discount
 * curve. At the default 10% rate with no hard mandate the tool concluded that
 * delaying eight years was CHEAPER than migrating now. A CRQC that arrives in
 * 2032 still exists in 2040; the right weight for year t is P(exists by t).
 * (Audit 2026-08-10, W1-1.)
 */
function rowAnnualLoss(
  inp: DelayScenarioInputs,
  yearsOfData: number,
  year: number,
  /**
   * Years between the end of this corpus and this row's decryption year. Zero
   * while still harvesting; once migration has stopped the corpus growing, it
   * is the time since it stopped — so a corpus frozen long before a CRQC
   * arrives has aged out of its shelf life and stops costing anything.
   */
  decryptionGapYears: number
): number {
  return computeBreachCosts({
    baseline: inp.breachBaseline,
    breachScale: inp.breachScale,
    yearsOfData,
    hndlFactorPct: inp.hndlFactorPct,
    annualBreachProbPct: inp.annualBreachProbPct,
    dataSensitivityClass: inp.dataSensitivityClass,
    asOfYear: year,
    planningHorizonYears: 1,
    crqcProbabilityMode: 'cumulative',
    decryptionGapYears,
    discountRateAnnual: Math.max(0, inp.discountRatePct) / 100,
  }).quantumALE
}

/**
 * Project the discounted cost of migrating after `delayYears` years.
 * `delayYears = 0` models migrating now — which still carries the HNDL
 * residual tail (data already harvested stays decryptable), so it is never
 * zero-risk.
 */
export function projectDelayScenario(
  inp: DelayScenarioInputs,
  delayYears: number
): DelayScenarioResult {
  const r = Math.max(0, inp.discountRatePct) / 100
  const migrationDuration = Math.max(1, inp.migrationDurationYears)

  const rows: DelayYearRow[] = []
  let cum = 0
  let totalMigration = 0
  let totalBreach = 0
  let totalFine = 0
  let totalCliff = 0
  let cliffCharged = false

  for (let t = 0; t < inp.horizonYears; t++) {
    const year = inp.currentYear + t
    const discount = 1 / Math.pow(1 + r, t)

    // 0 before migration starts, ramps to 1 across migrationDurationYears,
    // 1 for the rest of the horizon once migration is complete.
    const progress = Math.min(1, Math.max(0, (t - delayYears) / migrationDuration))
    const fullyMigrated = progress >= 1

    const vulnerableYearsOfData = inp.baseYearsOfData + t
    // No new harvesting once migration has started, not once it finishes.
    const frozenYearsOfData = inp.baseYearsOfData + Math.min(t, delayYears)

    // Still harvesting → the newest data is same-year fresh, gap 0. Once
    // migration has frozen the corpus, the gap is the time since it froze.
    const frozenGapYears = Math.max(0, t - delayYears)
    const breachALE =
      (1 - progress) * rowAnnualLoss(inp, vulnerableYearsOfData, year, 0) +
      progress * rowAnnualLoss(inp, frozenYearsOfData, year, frozenGapYears)
    const breach = breachALE * discount

    const migration =
      t === delayYears
        ? (inp.migrationCostUSD + inp.delayPremiumPerYear * delayYears) * discount
        : 0

    const pastHardDeadline = inp.mandateType === 'HARD' && year > inp.hardDeadlineYear
    const fine = !fullyMigrated && pastHardDeadline ? inp.annualFineUSD * discount : 0
    let cliff = 0
    if (!fullyMigrated && pastHardDeadline && !cliffCharged) {
      cliff = inp.cliffLossUSD * discount
      cliffCharged = true
    }
    const penalty = fine + cliff

    totalMigration += migration
    totalBreach += breach
    totalFine += fine
    totalCliff += cliff
    cum += migration + breach + penalty
    rows.push({ year, migration, breach, penalty, cumulativeTotal: cum })
  }

  // A delay at or beyond the horizon means `t === delayYears` never fires
  // inside the loop, so the migration was silently never paid for — making
  // "delay past the horizon" the cheapest option on the board by exactly the
  // migration cost (a 10-year delay on a 10-year horizon scored −$4.5M).
  // The organization still has to migrate eventually, so charge it, discounted
  // from the year it would actually happen. (Audit 2026-08-10, W1-1.)
  if (delayYears >= inp.horizonYears) {
    const deferred =
      (inp.migrationCostUSD + inp.delayPremiumPerYear * delayYears) / Math.pow(1 + r, delayYears)
    totalMigration += deferred
    cum += deferred
  }

  return {
    rows,
    total: cum,
    totalMigration,
    totalBreach,
    totalPenalty: totalFine + totalCliff,
    totalFine,
    totalCliff,
  }
}

/** Extra discounted cost of delaying `delayYears` vs migrating now. */
export function costOfInaction(inp: DelayScenarioInputs, delayYears: number): number {
  return projectDelayScenario(inp, delayYears).total - projectDelayScenario(inp, 0).total
}

/**
 * First year the delayed scenario's cumulative NPV permanently exceeds
 * migrate-now's (not just crosses briefly) — null if it never does within
 * the horizon.
 */
export function crossoverYear(nowRows: DelayYearRow[], delayedRows: DelayYearRow[]): number | null {
  for (let i = 0; i < nowRows.length; i++) {
    const staysAhead = delayedRows
      .slice(i)
      .every((row, j) => row.cumulativeTotal >= nowRows[i + j].cumulativeTotal)
    if (staysAhead && delayedRows[i].cumulativeTotal > nowRows[i].cumulativeTotal) {
      return nowRows[i].year
    }
  }
  return null
}
