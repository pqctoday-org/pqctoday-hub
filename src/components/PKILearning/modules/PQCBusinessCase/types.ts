// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared output contracts passed between the Business Case workshop steps.
 * Previously each step (and BoardPitchBuilder) declared its own local copy of
 * these interfaces; they had drifted (BreachOutput gained pCrqc/quantumALEUSD/
 * latestSafeStartYear/alreadyLate in one copy but not the other three), so a
 * chained value could silently lose fields at a step boundary. One definition.
 */
import type { DataSensitivityClass } from '@/utils/breachCostModel'

export interface ROIOutput {
  totalCostUSD: number
  roiPercent: number
  paybackMonths: number
  breachCostSavingsUSD: number
}

export interface BreachOutput {
  /** Industry the figures below were computed for — lets downstream steps detect a mismatch. */
  industry: string
  classicalCostUSD: number
  quantumCostUSD: number
  deltaUSD: number
  /** Probability a CRQC exists within the planning horizon (consensus scenario). */
  pCrqc: number
  /** Probability-weighted expected annual loss — the figure for further ROI math. */
  quantumALEUSD: number
  /** Latest year migration can start and still finish before the median CRQC arrival year. */
  latestSafeStartYear: number
  alreadyLate: boolean
  dataSensitivityClass: DataSensitivityClass
  yearsOfData: number
  hndlFactorPct: number
  annualBreachProbPct: number
}

export interface InactionOutput {
  costOfInactionUSD: number
  delayYears: number
  /** First year the delayed cumulative NPV permanently exceeds migrate-now's; null if it never does within the horizon. */
  crossoverYear: number | null
  latestSafeStartYear: number
  alreadyLate: boolean
}
