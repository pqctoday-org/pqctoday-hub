// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Shared output contracts passed between the Business Case workshop steps.
 * Previously each step (and BoardPitchBuilder) declared its own local copy of
 * these interfaces; they had drifted (BreachOutput gained pCrqc/quantumALEUSD/
 * latestSafeStartYear/alreadyLate in one copy but not the other three), so a
 * chained value could silently lose fields at a step boundary. One definition.
 */
import type { DataSensitivityClass } from '@/utils/breachCostModel'

export interface InactionScenarioRecord {
  modelVersion: 'coi-2'
  asOfYear: number
  horizonYears: number
  industry: string
  delayYears: number
  migrationDurationYears: number
  migrationCostUSD: number
  delayPremiumPerYearUSD: number
  annualBreachProbPct: number
  breachBaselineUSD: number
  baselineOrigin: 'breach-simulator' | 'industry-default'
  baseYearsOfData: number
  hndlFactorPct: number
  dataSensitivityClass: DataSensitivityClass
  discountRatePct: number
  verifiedConsequence: {
    effectiveYear: number
    annualUSD: number
    oneTimeUSD: number
    sourceNote: string
  }
  sourceStatus: {
    breachBaseline: 'NetDiligence 2025 insurance-claim incident cost (lower bound), primary-verified'
    breachProbability: 'Cyentia IRIS 2025 primary-verified'
    crqcCurve: 'GRI 2025 expert-survey bands, interpolated by this model'
  }
}

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
  /** First year delayed cumulative NPV stays above migrate-now through the selected horizon; null if it does not. */
  crossoverYear: number | null
  latestSafeStartYear: number
  alreadyLate: boolean
  /** Complete, versioned inputs used to reproduce the displayed scenario. */
  scenario?: InactionScenarioRecord
}
