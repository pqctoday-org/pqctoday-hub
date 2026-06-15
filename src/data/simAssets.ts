// SPDX-License-Identifier: GPL-3.0-only
/**
 * simAssets — the Simulation's enterprise risk/value model: the critical assets
 * (grounded in the hub's own assess-engine sensitivity data + the
 * Data-Asset-Sensitivity learn module's tiers), their value, the cyber-insurance
 * policy, the P0-driven budget, and the date-driven quantum threat (HNDL + TNFL).
 *
 * Assets are real per-industry items from src/data/pqcassessment_*.csv; tiers
 * follow the module's low/medium/high/critical model (sensitivity 0/5/15/25).
 *
 * Timeline assumption (set by product):
 *  - 2029: the first CRQC arrives and can break the MOST sensitive assets.
 *  - 2035: CRQC is broadly available — EVERY sensitivity tier is at risk.
 * Risk evolves as the simulated date advances 2026 → 2029 → 2035; an
 * accelerating-CRQC event (crqcShift, years) pulls both dates earlier.
 */

import { QC_FIRST_YEAR, QC_BROAD_YEAR } from './quantumTimeline'

export type OrgSize = 'small' | 'mid' | 'large' | 'global'
export type SensitivityTier = 'critical' | 'high' | 'medium' | 'low'

// Q-Day horizon — single source in quantumTimeline (shared with moscaClock + Assess).
export { QC_FIRST_YEAR, QC_BROAD_YEAR }

/** The year each sensitivity tier comes under quantum risk (interpolated 2029→2035). */
export const TIER_AT_RISK_YEAR: Record<SensitivityTier, number> = {
  critical: QC_FIRST_YEAR, // 2029
  high: 2031,
  medium: 2033,
  low: QC_BROAD_YEAR, // 2035
}
const TIER_RANK: Record<SensitivityTier, number> = { critical: 0, high: 1, medium: 2, low: 3 }
/** Estimated value at the "mid" org scale, € millions, by tier. */
const TIER_BASE_VALUE: Record<SensitivityTier, number> = {
  critical: 30,
  high: 18,
  medium: 8,
  low: 3,
}
const SIZE_MULT: Record<OrgSize, number> = { small: 0.25, mid: 1, large: 4, global: 12 }

export interface CriticalAsset {
  id: string
  label: string
  tier: SensitivityTier
  /** Estimated value at risk, € millions, at the chosen org scale. */
  valueM: number
  /** Dominant quantum exposure: HNDL (confidentiality) or TNFL (authenticity). */
  exposure: 'HNDL' | 'TNFL'
}

type AssetSeed = Omit<CriticalAsset, 'valueM'>

// Every org carries cryptographic keys / a signing PKI — the universal TNFL crown jewel.
const UNIVERSAL: AssetSeed[] = [
  { id: 'pki', label: 'PKI & code-signing keys', tier: 'critical', exposure: 'TNFL' },
]

// Per-sector assets, taken verbatim from the assess-engine sensitivity catalogue
// (sensitivity 25→critical, 15→high, 5→medium, 0→low).
const SECTOR_SEEDS: Record<string, AssetSeed[]> = {
  general: [
    {
      id: 'crypto-keys',
      label: 'Cryptographic keys / secrets',
      tier: 'critical',
      exposure: 'HNDL',
    },
    {
      id: 'source-code',
      label: 'Source code / IP / trade secrets',
      tier: 'high',
      exposure: 'HNDL',
    },
    { id: 'user-analytics', label: 'User analytics / telemetry', tier: 'medium', exposure: 'HNDL' },
  ],
  retail: [
    { id: 'pci-data', label: 'Payment card data (PCI scope)', tier: 'high', exposure: 'HNDL' },
    {
      id: 'customer-purchase',
      label: 'Customer purchase history / PII',
      tier: 'medium',
      exposure: 'HNDL',
    },
    { id: 'product-catalog', label: 'Product catalog / pricing', tier: 'low', exposure: 'HNDL' },
  ],
  telecom: [
    {
      id: 'network-topology',
      label: 'Network topology / configs',
      tier: 'critical',
      exposure: 'HNDL',
    },
    { id: 'cdr', label: 'Call detail records (CDR) / location', tier: 'high', exposure: 'HNDL' },
    {
      id: 'subscriber-meta',
      label: 'Subscriber metadata / plans',
      tier: 'medium',
      exposure: 'HNDL',
    },
  ],
  financial: [
    {
      id: 'trading-algos',
      label: 'Trading algorithms / risk models',
      tier: 'critical',
      exposure: 'HNDL',
    },
    {
      id: 'customer-financial',
      label: 'Customer financial records / PII',
      tier: 'high',
      exposure: 'HNDL',
    },
    {
      id: 'transaction-logs',
      label: 'Transaction & reconciliation logs',
      tier: 'medium',
      exposure: 'TNFL',
    },
  ],
  energy: [
    { id: 'scada-ot', label: 'SCADA / OT operational data', tier: 'critical', exposure: 'TNFL' },
    {
      id: 'grid-topology',
      label: 'Grid topology / substation configs',
      tier: 'high',
      exposure: 'HNDL',
    },
    {
      id: 'meter-readings',
      label: 'Meter readings / consumption',
      tier: 'medium',
      exposure: 'HNDL',
    },
  ],
  healthcare: [
    {
      id: 'genomic-data',
      label: 'Genomic / clinical-trial data',
      tier: 'critical',
      exposure: 'HNDL',
    },
    { id: 'phi', label: 'Protected Health Information (PHI)', tier: 'high', exposure: 'HNDL' },
    {
      id: 'admin-health',
      label: 'Administrative health records',
      tier: 'medium',
      exposure: 'HNDL',
    },
  ],
  government: [
    {
      id: 'classified-info',
      label: 'Classified information (TS/SCI)',
      tier: 'critical',
      exposure: 'HNDL',
    },
    { id: 'cui', label: 'Controlled Unclassified Information', tier: 'high', exposure: 'HNDL' },
    { id: 'fouo', label: 'Internal government data (FOUO)', tier: 'medium', exposure: 'HNDL' },
  ],
}

/** The critical-asset portfolio for an org of this sector + size, sorted by tier. */
export function portfolioFor(sector: string, size: OrgSize): CriticalAsset[] {
  const mult = SIZE_MULT[size] ?? 1
  const seeds = [...UNIVERSAL, ...(SECTOR_SEEDS[sector] ?? SECTOR_SEEDS.general)]
  return seeds
    .map((s) => ({ ...s, valueM: Math.round(TIER_BASE_VALUE[s.tier] * mult * 10) / 10 }))
    .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])
}

/** Total estimated value of the portfolio, € millions. */
export function portfolioValue(sector: string, size: OrgSize): number {
  return round1(portfolioFor(sector, size).reduce((s, a) => s + a.valueM, 0))
}

/**
 * The PQC-program budget the board can ultimately commit — justified by the
 * value at risk once assets are discovered (≈15% of the at-risk portfolio).
 */
export function programBudgetTarget(sector: string, size: OrgSize): number {
  return round1(portfolioValue(sector, size) * 0.15)
}

/** Cyber-insurance policy floor, € millions, by org size. */
export const INSURANCE_POLICY: Record<OrgSize, number> = {
  small: 5,
  mid: 30,
  large: 120,
  global: 500,
}

/** Quantum-EXPOSED value of the critical-tier assets (sum of their exposedM). */
export function criticalExposedValue(rows: AssetExposure[]): number {
  return round1(rows.filter((r) => r.tier === 'critical').reduce((s, r) => s + r.exposedM, 0))
}

/** Insured value = quantum-exposed value of the CRITICAL + HIGH tier assets. */
export function insuredValue(rows: AssetExposure[]): number {
  return round1(
    rows
      .filter((r) => r.tier === 'critical' || r.tier === 'high')
      .reduce((s, r) => s + r.exposedM, 0)
  )
}

/**
 * Cyber-insurance coverage: the size floor, raised so it covers at least the
 * quantum-exposed value of the critical + high assets. Pass the exposed rows so
 * the needed coverage tracks the date-driven exposure.
 */
export function insuranceCoverage(size: OrgSize, exposedRows: AssetExposure[]): number {
  return Math.max(INSURANCE_POLICY[size] ?? 0, insuredValue(exposedRows))
}

/** Annual cyber-insurance premium = 0.15% of the insured (covered) value, € millions. */
export function insurancePremium(coverageM: number): number {
  return Math.round(coverageM * 0.0015 * 1000) / 1000
}

/** Is an asset of this tier under quantum risk at the given (shifted) date? */
export function assetAtRisk(tier: SensitivityTier, currentYear: number, crqcShift = 0): boolean {
  return currentYear >= TIER_AT_RISK_YEAR[tier] - crqcShift
}

/**
 * Fraction of an asset's value that is quantum-EXPOSED at a given threat level:
 * very low 20% · low 40% · medium 60% · high 80% · critical 100%.
 */
export const EXPOSURE_PCT: Record<ThreatScore, number> = {
  0: 0.2,
  1: 0.4,
  2: 0.6,
  3: 0.8,
  4: 1.0,
}

export interface AssetExposure extends CriticalAsset {
  /** 0–1, from the threat level of this asset's exposure type (HNDL or TNFL). */
  exposurePct: number
  /** € millions exposed = value × exposurePct. */
  exposedM: number
}

/**
 * Quantum-exposed value = HNDL-exposure% × Σ(HNDL asset value) + TNFL-exposure% ×
 * Σ(TNFL asset value). Each asset is weighted by the threat level of ITS exposure
 * type, so exposure rises as the date-driven HNDL/TNFL levels rise.
 */
export function exposeAssets(
  assets: CriticalAsset[],
  hndlScore: ThreatScore,
  tnflScore: ThreatScore
): { rows: AssetExposure[]; totalM: number } {
  const rows = assets.map((a) => {
    const pct = EXPOSURE_PCT[a.exposure === 'HNDL' ? hndlScore : tnflScore]
    return { ...a, exposurePct: pct, exposedM: round1(a.valueM * pct) }
  })
  return { rows, totalM: round1(rows.reduce((s, r) => s + r.exposedM, 0)) }
}

export type ThreatScore = 0 | 1 | 2 | 3 | 4
export interface ThreatLevel {
  score: ThreatScore
  label: string
  tone: string
  note: string
}
const THREAT_LABEL: Record<ThreatScore, { label: string; tone: string }> = {
  0: { label: 'Very low', tone: 'text-success' },
  1: { label: 'Low', tone: 'text-success' },
  2: { label: 'Medium', tone: 'text-warning' },
  3: { label: 'High', tone: 'text-warning' },
  4: { label: 'Critical', tone: 'text-destructive' },
}
const clampScore = (n: number): ThreatScore =>
  Math.max(0, Math.min(4, Math.round(n))) as ThreatScore
const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * HNDL ("harvest now, decrypt later") + TNFL ("trust now, forge later") posture,
 * both escalating as the date approaches 2029 and again at 2035.
 *  - HNDL is a PRESENT risk: data captured today is exposed if it is still
 *    confidential when a CRQC can decrypt it (currentYear + shelfLife ≥ 2029).
 *  - TNFL is a NEAR-FUTURE risk: signatures can only be forged once a CRQC
 *    exists, so it ramps as 2029 approaches and is total by 2035.
 */
export function computeThreatLevels(input: {
  currentYear: number
  shelfLifeYears: number
  crqcShift?: number
}): { hndl: ThreatLevel; tnfl: ThreatLevel; qcFirst: number; qcBroad: number } {
  const shift = input.crqcShift ?? 0
  const qcFirst = QC_FIRST_YEAR - shift
  const qcBroad = QC_BROAD_YEAR - shift
  const { currentYear, shelfLifeYears } = input

  // HNDL — overlap of today's secret lifetime with the CRQC era.
  const overlap = currentYear + shelfLifeYears - qcFirst
  let hndlScore: number
  if (currentYear >= qcBroad) hndlScore = 4
  else if (overlap >= 10) hndlScore = 4
  else if (overlap >= 5) hndlScore = 3
  else if (overlap >= 0) hndlScore = 2
  else if (overlap >= -3) hndlScore = 1
  else hndlScore = 0
  const hndlNote =
    hndlScore >= 4
      ? 'data captured today is decryptable by Q-Day'
      : hndlScore >= 2
        ? `${shelfLifeYears}y-shelf data outlives Q-Day ${qcFirst}`
        : `secrets expire before Q-Day ${qcFirst}`

  // TNFL — forgeability ramps purely with the date: a CRQC must exist before any
  // signature can be forged. Very low until ~3y out, then low → medium → high as
  // Q-Day (qcFirst) approaches, and total once CRQC is broadly available.
  let tnflScore: number
  if (currentYear >= qcBroad) tnflScore = 4
  else if (currentYear >= qcFirst) tnflScore = 3
  else if (currentYear >= qcFirst - 1) tnflScore = 2
  else if (currentYear >= qcFirst - 2) tnflScore = 1
  else tnflScore = 0
  const tnflNote =
    tnflScore >= 4
      ? 'all signatures forgeable post-Q-Day'
      : tnflScore >= 3
        ? `high-value signatures forgeable at Q-Day ${qcFirst}`
        : tnflScore >= 1
          ? `forge risk rising toward Q-Day ${qcFirst}`
          : `no CRQC to forge until ~${qcFirst}`

  const mk = (n: number, note: string): ThreatLevel => {
    const s = clampScore(n)
    return { score: s, ...THREAT_LABEL[s], note }
  }
  return { hndl: mk(hndlScore, hndlNote), tnfl: mk(tnflScore, tnflNote), qcFirst, qcBroad }
}
