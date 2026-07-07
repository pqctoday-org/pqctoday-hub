// SPDX-License-Identifier: GPL-3.0-only
/**
 * Industry-specific cost-of-inaction profiles for the PQC Business Case module.
 * Used by the CostOfInactionAnalyzer workshop step.
 *
 * Migration cost and delay premium are industry-analyst estimates for a
 * mid-size org — illustrative, not cited figures. Everything else this step
 * needs (breach baseline, HNDL/CRQC modeling, regulatory deadline and
 * penalty) is DERIVED, not hand-maintained here: breach baseline from
 * roiBaselines.ts (IBM 2025), quantum-risk modeling from breachCostModel.ts
 * (GRI 2025 CRQC curve + data-class shelf-life decay), and deadline/penalty
 * from inactionDrivers.ts (complianceData.ts + the timeline CSV).
 */
import type { DataSensitivityClass } from '@/utils/breachCostModel'

export interface DelayCostProfile {
  industry: string
  /** Baseline total PQC migration cost (USD) for a mid-size org */
  migrationCostUSD: number
  /** Additional cost per year of delay due to complexity premium and deferred planning */
  delayPremiumPerYear: number
  /** Data class most representative of what this industry protects — drives HNDL shelf-life decay. */
  dataSensitivityClass: DataSensitivityClass
}

export const DELAY_COST_PROFILES: DelayCostProfile[] = [
  {
    industry: 'Finance & Banking',
    migrationCostUSD: 4_500_000,
    delayPremiumPerYear: 450_000,
    dataSensitivityClass: 'payment-card',
  },
  {
    industry: 'Healthcare',
    migrationCostUSD: 3_200_000,
    delayPremiumPerYear: 320_000,
    dataSensitivityClass: 'health-record',
  },
  {
    industry: 'Government & Defense',
    migrationCostUSD: 6_800_000,
    delayPremiumPerYear: 680_000,
    dataSensitivityClass: 'state-secret',
  },
  {
    industry: 'Technology',
    migrationCostUSD: 2_900_000,
    delayPremiumPerYear: 290_000,
    dataSensitivityClass: 'ip-trade-secret',
  },
  {
    industry: 'Telecommunications',
    migrationCostUSD: 5_100_000,
    delayPremiumPerYear: 510_000,
    dataSensitivityClass: 'general-pii',
  },
  {
    industry: 'Energy & Utilities',
    migrationCostUSD: 4_200_000,
    delayPremiumPerYear: 420_000,
    dataSensitivityClass: 'general-pii',
  },
  {
    industry: 'Retail & E-Commerce',
    migrationCostUSD: 1_800_000,
    delayPremiumPerYear: 180_000,
    dataSensitivityClass: 'payment-card',
  },
  {
    industry: 'Aerospace',
    migrationCostUSD: 5_800_000,
    delayPremiumPerYear: 580_000,
    dataSensitivityClass: 'ip-trade-secret',
  },
  {
    industry: 'Automotive',
    migrationCostUSD: 5_200_000,
    delayPremiumPerYear: 520_000,
    dataSensitivityClass: 'ip-trade-secret',
  },
  {
    industry: 'Education',
    migrationCostUSD: 1_600_000,
    delayPremiumPerYear: 160_000,
    dataSensitivityClass: 'general-pii',
  },
  {
    industry: 'Other',
    migrationCostUSD: 3_500_000,
    delayPremiumPerYear: 350_000,
    dataSensitivityClass: 'general-pii',
  },
]

export const DEFAULT_PROFILE = DELAY_COST_PROFILES[0]
