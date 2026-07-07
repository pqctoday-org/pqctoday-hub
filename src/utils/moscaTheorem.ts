// SPDX-License-Identifier: GPL-3.0-only
/**
 * Mosca's inequality: if the time data must stay secure (x) plus the time to
 * migrate (y) exceeds the time until a CRQC exists (z), you are already too
 * late — x + y > z. This module turns that into a "latest safe start year"
 * and a "cost of waiting" figure, giving the Breach Scenario Simulator a
 * decision rule instead of only a dollar figure.
 *
 * Reference: Mosca, M. "Cybersecurity in an era with quantum computers: will
 * we be ready?" IEEE Security & Privacy, 2018.
 */

import { medianCrqcYear, type CrqcScenario } from './crqcProbability'
import { computeBreachCosts, type BreachModelInputs } from './breachCostModel'

export interface MoscaInputs {
  /** x — years compromised data of this class must remain secure. */
  shelfLifeYears: number
  /** y — years the organization estimates its migration will take. */
  migrationDurationYears: number
  /** Which CRQC-arrival scenario's median year to use as z. */
  crqcScenario: CrqcScenario
}

export interface MoscaVerdict {
  /** x */
  shelfLifeYears: number
  /** y */
  migrationDurationYears: number
  /** z — median CRQC arrival year for the chosen scenario. */
  crqcYear: number
  /** Latest calendar year migration can start and still finish before data minted at completion is exposed. */
  latestSafeStartYear: number
  /** True when x + y already exceeds the time remaining until z. */
  alreadyLate: boolean
  /** Years by which the organization is late (0 if not late). */
  yearsLate: number
}

export function computeMoscaVerdict(inputs: MoscaInputs, currentYear: number): MoscaVerdict {
  const crqcYear = medianCrqcYear(inputs.crqcScenario)
  const latestSafeStartYear = crqcYear - inputs.migrationDurationYears - inputs.shelfLifeYears
  const yearsLate = Math.max(0, currentYear - latestSafeStartYear)
  return {
    shelfLifeYears: inputs.shelfLifeYears,
    migrationDurationYears: inputs.migrationDurationYears,
    crqcYear,
    latestSafeStartYear,
    alreadyLate: yearsLate > 0,
    yearsLate,
  }
}

/**
 * The additional present-value loss from delaying migration start by
 * `delayYears` — computed by re-running the breach model as-of a later year
 * (the CRQC clock keeps ticking while the organization waits, so the same
 * planning horizon now covers a riskier window).
 */
export function costOfWaiting(baseInputs: BreachModelInputs, delayYears: number): number {
  const now = computeBreachCosts(baseInputs)
  const delayed = computeBreachCosts({ ...baseInputs, asOfYear: baseInputs.asOfYear + delayYears })
  return delayed.pvQuantumDelta - now.pvQuantumDelta
}
