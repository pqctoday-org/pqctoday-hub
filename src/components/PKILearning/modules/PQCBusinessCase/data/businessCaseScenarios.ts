// SPDX-License-Identifier: GPL-3.0-only
/**
 * Industry-specific cost-of-inaction profiles for the PQC Business Case module.
 * Used by the CostOfInactionAnalyzer workshop step.
 *
 * Sources: IBM Cost of a Data Breach Report 2024, NIST IR 8547 migration urgency guidance,
 * and industry analyst estimates for PQC migration complexity.
 */

export interface DelayCostProfile {
  industry: string
  /** Baseline total PQC migration cost (USD) for a mid-size org */
  migrationCostUSD: number
  /** Additional cost per year of delay due to complexity premium and deferred planning */
  delayPremiumPerYear: number
  /** Multiplier applied to annual breach risk per year of HNDL exposure window */
  hndlExposureMultiplier: number
  /** Regulatory penalty per year of non-compliance after the hard deadline (USD) */
  regulatoryPenaltyUSD: number
  /** Year by which best-practice adoption is recommended */
  softDeadline: number
  /** Year by which compliance is mandated (hard deadline) */
  hardDeadline: number
}

export const DELAY_COST_PROFILES: DelayCostProfile[] = [
  {
    industry: 'Finance & Banking',
    migrationCostUSD: 4_500_000,
    delayPremiumPerYear: 450_000,
    hndlExposureMultiplier: 1.35,
    regulatoryPenaltyUSD: 2_000_000,
    softDeadline: 2027,
    hardDeadline: 2030,
  },
  {
    industry: 'Healthcare',
    migrationCostUSD: 3_200_000,
    delayPremiumPerYear: 320_000,
    hndlExposureMultiplier: 1.6,
    regulatoryPenaltyUSD: 1_500_000,
    softDeadline: 2027,
    hardDeadline: 2030,
  },
  {
    industry: 'Government & Defense',
    migrationCostUSD: 6_800_000,
    delayPremiumPerYear: 680_000,
    hndlExposureMultiplier: 1.8,
    regulatoryPenaltyUSD: 5_000_000,
    softDeadline: 2025,
    hardDeadline: 2030,
  },
  {
    industry: 'Technology',
    migrationCostUSD: 2_900_000,
    delayPremiumPerYear: 290_000,
    hndlExposureMultiplier: 1.25,
    regulatoryPenaltyUSD: 800_000,
    softDeadline: 2027,
    hardDeadline: 2033,
  },
  {
    industry: 'Telecommunications',
    migrationCostUSD: 5_100_000,
    delayPremiumPerYear: 510_000,
    hndlExposureMultiplier: 1.3,
    regulatoryPenaltyUSD: 1_200_000,
    softDeadline: 2027,
    hardDeadline: 2030,
  },
  {
    industry: 'Energy & Utilities',
    migrationCostUSD: 4_200_000,
    delayPremiumPerYear: 420_000,
    hndlExposureMultiplier: 1.5,
    regulatoryPenaltyUSD: 2_500_000,
    softDeadline: 2026,
    hardDeadline: 2030,
  },
  {
    industry: 'Retail & E-Commerce',
    migrationCostUSD: 1_800_000,
    delayPremiumPerYear: 180_000,
    hndlExposureMultiplier: 1.15,
    regulatoryPenaltyUSD: 500_000,
    softDeadline: 2028,
    hardDeadline: 2033,
  },
  {
    industry: 'Aerospace',
    migrationCostUSD: 5_800_000,
    delayPremiumPerYear: 580_000,
    hndlExposureMultiplier: 1.7,
    regulatoryPenaltyUSD: 3_000_000,
    softDeadline: 2026,
    hardDeadline: 2030,
  },
]

export const DEFAULT_PROFILE = DELAY_COST_PROFILES[0]

/** Annual breach risk: baseline cost × a modest annual probability (5%) */
export function annualBreachRisk(breachBaseline: number, hndlMultiplier: number): number {
  return breachBaseline * 0.05 * hndlMultiplier
}
