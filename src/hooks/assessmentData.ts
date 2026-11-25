// SPDX-License-Identifier: AGPL-3.0-only
import type { AssessmentInput } from './assessmentTypes'
import {
  ALGORITHM_DB,
  DATA_RETENTION_YEARS,
  INDUSTRY_THREAT,
  USE_CASE_WEIGHTS,
} from '../data/assessmentReferenceData'
import { ALL_JURISDICTION_ENTRIES } from '../data/jurisdictionsData'
import { QC_FIRST_YEAR } from '../data/quantumTimeline'
import {
  TIMELINE_COUNTRY_DEADLINE_BY_NAME,
  TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME,
  type DeadlineMandate,
} from '../data/timelineFacts.generated'

export { ALGORITHM_DB }
export const VULNERABLE_ALGORITHMS = new Set(
  Object.entries(ALGORITHM_DB)
    .filter(([, info]) => info.quantumVulnerable)
    .map(([name]) => name)
)
/** Signature algorithms vulnerable to Shor's algorithm (HNFL targets). */
export const SIGNING_ALGORITHMS = new Set([
  'RSA-2048',
  'RSA-3072',
  'RSA-4096',
  'ECDSA P-256',
  'ECDSA P-384',
  'ECDSA P-521',
  'Ed25519',
  'Ed448',
  'secp256k1',
])
// Compliance data now comes from the dedicated compliance CSV (single source of truth)
import { complianceDB, type ComplianceProvenance } from '@/data/complianceData'
export const COMPLIANCE_DB: Record<
  string,
  { requiresPQC: boolean; deadline: string; notes: string } & ComplianceProvenance
> = complianceDB
/** Expose compliance deadline/notes for UI tooltips in the wizard. */
export const COMPLIANCE_DESCRIPTIONS: Record<string, { deadline: string; notes: string }> =
  Object.fromEntries(
    Object.entries(COMPLIANCE_DB).map(([k, v]) => [k, { deadline: v.deadline, notes: v.notes }])
  )
export const AVAILABLE_DATA_RETENTION: string[] = [
  'under-1y',
  '1-5y',
  '5-10y',
  '10-25y',
  '25-plus',
  'indefinite',
]
export const AVAILABLE_SYSTEM_COUNTS: AssessmentInput['systemCount'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
export const AVAILABLE_TEAM_SIZES: AssessmentInput['teamSize'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
/**
 * Industry quantum-threat base scores (0–30).
 * Derived from CISA critical infrastructure designations, sector-specific HNDL/HNFL
 * exposure profiles, and regulatory urgency timelines.
 * Sources: CISA Critical Infrastructure Sectors, NIST CNSA 2.0 (2022), EU NIS2 Directive (2022).
 */
export { INDUSTRY_THREAT }
export const ALGORITHM_WEIGHTS: Record<string, number> = {
  'RSA-2048': 10,
  'RSA-3072': 9,
  'RSA-4096': 8,
  'ECDSA P-256': 10,
  'ECDSA P-384': 6,
  'ECDH P-256': 10,
  'ECDH P-384': 8,
  'ECDH P-521': 6,
  Ed25519: 6,
  'DH (Diffie-Hellman)': 4,
  X25519: 8,
  secp256k1: 6,
}
export const DEFAULT_ALGORITHM_WEIGHT = 8
export const DATA_SENSITIVITY_SCORES: Record<string, number> = {
  low: 0,
  medium: 5,
  high: 15,
  critical: 25,
}
export const MIGRATION_STATUS_SCORES: Record<string, number> = {
  started: -20,
  planning: -10,
  'not-started': 10,
  unknown: 15,
}
export { USE_CASE_WEIGHTS }
export { DATA_RETENTION_YEARS }
/** Credential / signature lifetime → years (parallel to DATA_RETENTION_YEARS for HNFL). */
export const CREDENTIAL_LIFETIME_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-3y': 3,
  '3-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 100,
}
export const AGILITY_COMPLEXITY: Record<string, number> = {
  'fully-abstracted': 0.2,
  'partially-abstracted': 0.5,
  hardcoded: 0.9,
  unknown: 0.75, // conservative but not worst-case — softer than confirmed hardcoded
}
export const INFRA_COMPLEXITY: Record<string, number> = {
  Hardware: 15, // HSMs, Smart Cards, QRNG, Secure Boot — hardest to migrate
  'Security Stack': 12, // PKI, KMS, IAM, CLM
  OS: 11, // Operating Systems, Network OS
  Network: 10, // VPN, IPsec, 5G
  Application: 8, // TLS/SSL, SSH, PQC libraries, email, code signing
  Cloud: 6, // Cloud KMS/HSM — vendor-managed, easier path
  Database: 6, // Database encryption software
}
export const SYSTEM_SCALE: Record<string, number> = {
  '1-10': 1.0,
  '11-50': 1.3,
  '51-200': 1.6,
  '200-plus': 2.0,
}
export const TEAM_CAPACITY: Record<string, number> = {
  '1-10': 0.4,
  '11-50': 0.6,
  '51-200': 0.8,
  '200-plus': 1.0,
}
export const VENDOR_DEPENDENCY_WEIGHT: Record<string, number> = {
  'heavy-vendor': 20,
  mixed: 10,
  'open-source': 5,
  'in-house': 3,
}
export const TIMELINE_URGENCY: Record<string, number> = {
  'within-1y': 1.3,
  'within-2-3y': 1.15,
  'internal-deadline': 1.05,
  'no-deadline': 1.0,
  unknown: 1.2, // not knowing is worse than no deadline — assume near-term pressure
}
/**
 * Country-specific regulatory urgency scores (0–12) for risk scoring.
 * Based on published national PQC mandates, advisory timelines, and regulatory frameworks.
 * Sources: NSA CNSA 2.0 (Sept 2022), ANSSI Avis (Jan 2024), BSI TR-02102 (2023),
 * INCD Advisory (2024), NCSC White Paper (2023), ASD ISM (2024), CCCS ITSAP.00.017 (2023),
 * OSCCA NGCC Program (2023), MAS Circular (2024), CRYPTREC PQC Report (2023),
 * MSIT/KpqC Roadmap (2024), EU NIS2 Directive (2022), EU DORA (2023).
 */
export const COUNTRY_REGULATORY_URGENCY: Record<string, number> = Object.fromEntries(
  ALL_JURISDICTION_ENTRIES.filter((j) => j.regulatoryUrgency !== undefined).map((j) => [
    j.name,
    j.regulatoryUrgency as number,
  ])
)
// Aligned to the Applied Quantum framework Q-Day (first CRQC). Single source: quantumTimeline.
export const ESTIMATED_QUANTUM_THREAT_YEAR = QC_FIRST_YEAR
/**
 * Country PQC migration horizons — DERIVED from the single source of truth (the
 * timeline CSV's `is_sim_deadline` rows, via `gen:timeline-facts`), NOT hand-coded.
 * This replaced the former hand-maintained table so Assess + the Report show the
 * SAME deadline as the Timeline and the Simulation — one source, no drift.
 *
 * Countries the CSV doesn't tag are absent here and fall back via the consumers'
 * existing logic: smartDefaults' EU-member fallthrough (→2030) and riskWindows'
 * Q-Day anchor (ESTIMATED_QUANTUM_THREAT_YEAR). To give a jurisdiction its own
 * curated deadline, tag its row `is_sim_deadline=true` in the timeline CSV.
 */
export const COUNTRY_PLANNING_HORIZON: Record<string, number> = TIMELINE_COUNTRY_DEADLINE_BY_NAME

/**
 * Whether a country's planning horizon is a binding legal mandate (`HARD` — law,
 * regulation, executive order) or soft guidance / roadmap (`SOFT`) — from the same
 * single source (timeline CSV `mandate_type`). Lets the Report label a "regulatory
 * deadline" vs a "guidance target" instead of presenting every date as binding.
 * A country absent here has no curated national deadline (falls back to the estimate).
 */
export const COUNTRY_PLANNING_MANDATE: Record<string, DeadlineMandate> =
  TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME
export type { DeadlineMandate }
/** Industry-specific composite score weights (must sum to 1.0). */
export const INDUSTRY_COMPOSITE_WEIGHTS: Record<
  string,
  { qe: number; mc: number; rp: number; or: number }
> = {
  'Government & Defense': { qe: 0.3, mc: 0.15, rp: 0.3, or: 0.25 },
  'Finance & Banking': { qe: 0.3, mc: 0.2, rp: 0.3, or: 0.2 },
  Healthcare: { qe: 0.3, mc: 0.2, rp: 0.25, or: 0.25 },
  Telecommunications: { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Technology: { qe: 0.35, mc: 0.2, rp: 0.15, or: 0.3 },
  'Energy & Utilities': { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Automotive: { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Aerospace: { qe: 0.3, mc: 0.25, rp: 0.25, or: 0.2 },
  'Retail & E-Commerce': { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 },
  Education: { qe: 0.3, mc: 0.2, rp: 0.25, or: 0.25 },
  Manufacturing: { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Other: { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 },
}
export const DEFAULT_COMPOSITE_WEIGHTS = { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 }
export const AVAILABLE_INDUSTRIES = Object.keys(INDUSTRY_THREAT)
export const AVAILABLE_ALGORITHMS = Object.keys(ALGORITHM_DB)
export const AVAILABLE_COMPLIANCE = Object.keys(COMPLIANCE_DB)
export const AVAILABLE_USE_CASES = Object.keys(USE_CASE_WEIGHTS)
export const AVAILABLE_INFRASTRUCTURE = Object.keys(INFRA_COMPLEXITY)
export const AVAILABLE_CREDENTIAL_LIFETIME: string[] = [
  'under-1y',
  '1-3y',
  '3-10y',
  '10-25y',
  '25-plus',
  'indefinite',
]
