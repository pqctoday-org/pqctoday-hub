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
 * `delayYears`.
 *
 * Both scenarios are evaluated against the SAME terminal year — only the
 * protected start differs. Waiting can therefore only ever add exposure.
 *
 * The previous form slid a FIXED-WIDTH horizon window forward and differenced
 * the two, which meant the answer depended on where the window happened to sit
 * on the arrival curve. Once it slid past the steep part, later scored as
 * safer, and a function named `costOfWaiting` returned negative numbers:
 * −$82,718 at 8 years, −$942,987 at 15 (and exactly $0 at 1 and 5 years, where
 * the piecewise-linear curve's equal slopes cancelled). It fed the Breach
 * Scenario Simulator's decision layer. (Audit 2026-08-10, W1-3b.)
 */
export function costOfWaiting(baseInputs: BreachModelInputs, delayYears: number): number {
  const delay = Math.max(0, delayYears)
  if (delay === 0) return 0
  // Quantum-excess exposure accumulated across exactly the years spent waiting,
  // discounted to today. Each year inside that window carries its own
  // cumulative CRQC-arrival probability (see computeForScenario), so this grows
  // with the delay and can never be negative.
  return computeBreachCosts({ ...baseInputs, planningHorizonYears: delay }).pvQuantumDelta
}
