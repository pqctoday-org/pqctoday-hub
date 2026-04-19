// SPDX-License-Identifier: GPL-3.0-only
import {
  INDUSTRY_BREACH_BASELINES,
  FRAMEWORK_PENALTY_BASELINES,
  DEFAULT_FRAMEWORK_PENALTY,
  INFRA_LAYER_COST,
  DEFAULT_INFRA_LAYER_COST,
} from '@/data/roiBaselines'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

/** Default annual probability of a compliance incident per applicable framework. */
export const DEFAULT_COMPLIANCE_INCIDENT_RATE = 0.1

/** Minimum migration cost floor for assessment-derived estimates. */
export const MIGRATION_COST_FLOOR = 50_000

/** Default compliance penalty when no framework-specific value is available. */
export const DEFAULT_MANDATED_PENALTY_FALLBACK = 2_000_000

export function resolveIndustryBreachBaseline(industry: string | undefined): number {
  if (!industry) return INDUSTRY_BREACH_BASELINES.Other
  return INDUSTRY_BREACH_BASELINES[industry] ?? INDUSTRY_BREACH_BASELINES.Other
}

export interface BreachSavingsInputs {
  breachBaseline: number
  breachProbabilityPct: number
  quantumMultiplier?: number
}

/** Annual expected breach-avoidance savings (no horizon). */
export function computeAnnualBreachSavings({
  breachBaseline,
  breachProbabilityPct,
  quantumMultiplier = 1,
}: BreachSavingsInputs): number {
  return breachBaseline * quantumMultiplier * (breachProbabilityPct / 100)
}

export interface ComplianceSavingsInputs {
  frameworkCount: number
  penaltyPerIncident: number
  incidentRate?: number
}

/** Annual expected compliance savings (no horizon). Probabilistic by design. */
export function computeAnnualComplianceSavings({
  frameworkCount,
  penaltyPerIncident,
  incidentRate = DEFAULT_COMPLIANCE_INCIDENT_RATE,
}: ComplianceSavingsInputs): number {
  return frameworkCount * penaltyPerIncident * incidentRate
}

export interface ROIInputs {
  /** One-time capital expenditure (e.g. migration cost). */
  migrationCost: number
  /** Recurring annual operating cost to keep the PQC stack running. Default 0. */
  annualOpex?: number
  /** Gross annual benefit from PQC (breach avoidance + compliance). */
  annualBenefit: number
  horizonYears: number
  /** Optional WACC as a decimal (e.g. 0.1 = 10%). When provided, npv is returned. */
  discountRate?: number
}

export interface ROIMetrics {
  /** Echoed input: gross annual benefit. */
  annualBenefit: number
  /** Echoed input: annual operating cost. */
  annualOpex: number
  /** Benefit net of ongoing opex. Used as the payback denominator. */
  netAnnualBenefit: number
  /** horizonYears × annualBenefit (gross, un-discounted). */
  totalBenefit: number
  /** Total lifetime cost: migrationCost + horizonYears × annualOpex. */
  totalCost: number
  /** ((totalBenefit − totalCost) / totalCost) × 100 */
  roiPercent: number
  /** migrationCost / (netAnnualBenefit / 12). Infinity when netAnnualBenefit ≤ 0. */
  paybackMonths: number
  /** NPV at discountRate, discounting netAnnualBenefit over horizon; only when discountRate provided. */
  npv?: number
}

/**
 * Core ROI computation. Payback uses netAnnualBenefit (benefit net of opex),
 * never the horizon-scaled total — the horizon-scaled variant would understate
 * payback by a factor of horizon.
 */
export function computeROI({
  migrationCost,
  annualOpex = 0,
  annualBenefit,
  horizonYears,
  discountRate,
}: ROIInputs): ROIMetrics {
  const netAnnualBenefit = annualBenefit - annualOpex
  const totalBenefit = annualBenefit * horizonYears
  const totalCost = migrationCost + annualOpex * horizonYears
  const roiPercent = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0
  const paybackMonths = netAnnualBenefit > 0 ? migrationCost / (netAnnualBenefit / 12) : Infinity
  const metrics: ROIMetrics = {
    annualBenefit,
    annualOpex,
    netAnnualBenefit,
    totalBenefit,
    totalCost,
    roiPercent,
    paybackMonths,
  }
  if (discountRate !== undefined) {
    let pv = 0
    for (let t = 1; t <= horizonYears; t++) {
      pv += netAnnualBenefit / Math.pow(1 + discountRate, t)
    }
    metrics.npv = pv - migrationCost
  }
  return metrics
}

// ── Decomposed quantum multiplier ────────────────────────────────────────

export interface QuantumMultiplierComponents {
  /** Fraction of data subject to harvest-now-decrypt-later exposure (0-100). */
  hndlExposurePct: number
  /** Attacker-sophistication uplift once a CRQC is available (0-100). */
  crqcAttackerUpliftPct: number
  /** Uplift from longer detection windows post-CRQC (0-100). */
  detectionTimelineUpliftPct: number
}

/**
 * Compose a quantum amplification factor from three defensible components.
 * Additive composition: 1 + Σ (component / 100). Defaults 50/50/50 reproduce
 * the legacy 2.5× default.
 */
export function composeQuantumMultiplier({
  hndlExposurePct,
  crqcAttackerUpliftPct,
  detectionTimelineUpliftPct,
}: QuantumMultiplierComponents): number {
  return 1 + hndlExposurePct / 100 + crqcAttackerUpliftPct / 100 + detectionTimelineUpliftPct / 100
}

export function breachProbabilityFromRiskScore(riskScore: number): number {
  return Math.min(50, Math.max(0, Math.round(riskScore / 2)))
}

export function selectCompliancePenalty(
  mandatedFrameworks: string[],
  fallback: number = DEFAULT_MANDATED_PENALTY_FALLBACK
): { penalty: number; driverFramework: { name: string; penalty: number } | null } {
  if (mandatedFrameworks.length === 0) {
    return { penalty: fallback, driverFramework: null }
  }
  let maxPenalty = 0
  let driver: { name: string; penalty: number } | null = null
  for (const f of mandatedFrameworks) {
    const p = FRAMEWORK_PENALTY_BASELINES[f]?.annualPenalty ?? DEFAULT_FRAMEWORK_PENALTY
    if (p > maxPenalty) {
      maxPenalty = p
      driver = { name: f, penalty: p }
    }
  }
  return { penalty: maxPenalty, driverFramework: driver }
}

// ── Assessment-driven migration cost derivation ─────────────────────────────

const SYS_SCALE_MAP: Record<string, number> = {
  '1-10': 1.0,
  '11-50': 1.3,
  '51-200': 1.8,
  '200-plus': 3.0,
}
const VENDOR_MAP: Record<string, number> = {
  'open-source': 0.8,
  'in-house': 0.7,
  mixed: 1.0,
  'heavy-vendor': 1.4,
}
const MIGRATION_STATUS_MAP: Record<string, number> = {
  started: 0.4,
  planning: 0.7,
  'not-started': 1.0,
  unknown: 1.0,
}
const AGILITY_MAP: Record<string, number> = {
  'fully-abstracted': 0.6,
  'partially-abstracted': 0.85,
  hardcoded: 1.5,
  unknown: 1.2,
}
const TEAM_MAP: Record<string, number> = {
  '200-plus': 0.85,
  '51-200': 0.95,
  '11-50': 1.0,
  '1-10': 1.3,
}

export interface MigrationCostDetails {
  algoCount: number
  sysScale: number
  algoBase: number
  infraLayers: string[]
  infraBase: number
  vendorLabel: string
  vendorMul: number
  migrationStatus: string
  migrationDiscount: number
  agilityLabel: string
  agilityMul: number
  teamLabel: string
  teamMul: number
  baseCost: number
  migrationCost: number
}

export interface MigrationCostResult {
  migrationCost: number
  details: MigrationCostDetails
}

export function computeMigrationCostFromProfile(result: AssessmentResult): MigrationCostResult {
  const profile = result.assessmentProfile
  const vulnAlgos = result.algorithmMigrations?.filter((a) => a.quantumVulnerable) ?? []
  const algoCount = vulnAlgos.length || 1

  const sysScale = SYS_SCALE_MAP[profile?.systemScale ?? ''] ?? 1.0
  const algoBase = Math.max(MIGRATION_COST_FLOOR, algoCount * 30_000 * sysScale)

  const infraLayers = profile?.infrastructure ?? []
  const infraBaseRaw =
    infraLayers.length > 0
      ? infraLayers.reduce((sum, id) => sum + (INFRA_LAYER_COST[id] ?? DEFAULT_INFRA_LAYER_COST), 0)
      : profile?.infrastructureUnknown
        ? DEFAULT_INFRA_LAYER_COST * 3
        : 0
  const subCats = profile?.infrastructureSubCategories ?? {}
  const totalSubCats = Object.values(subCats).reduce((sum, cats) => sum + cats.length, 0)
  const subCatMultiplier = Math.min(2.0, 1.0 + totalSubCats * 0.15)
  const infraBase = Math.round(infraBaseRaw * subCatMultiplier)

  const vendorMul = profile?.vendorUnknown
    ? 1.2
    : (VENDOR_MAP[profile?.vendorDependency ?? ''] ?? 1.0)
  const migrationDiscount = MIGRATION_STATUS_MAP[profile?.migrationStatus ?? 'not-started'] ?? 1.0
  const agilityMul = AGILITY_MAP[profile?.cryptoAgility ?? ''] ?? 1.0
  const teamMul = TEAM_MAP[profile?.teamSize ?? ''] ?? 1.0

  const baseCost = algoBase + infraBase
  const migrationCost = Math.max(
    MIGRATION_COST_FLOOR,
    Math.round(baseCost * vendorMul * migrationDiscount * agilityMul * teamMul)
  )

  return {
    migrationCost,
    details: {
      algoCount,
      sysScale,
      algoBase,
      infraLayers,
      infraBase,
      vendorLabel: profile?.vendorUnknown ? 'Unknown' : (profile?.vendorDependency ?? 'Not set'),
      vendorMul,
      migrationStatus: profile?.migrationStatus ?? 'not-started',
      migrationDiscount,
      agilityLabel: profile?.cryptoAgility ?? 'Not set',
      agilityMul,
      teamLabel: profile?.teamSize ?? 'Not set',
      teamMul,
      baseCost,
      migrationCost,
    },
  }
}
