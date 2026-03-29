// SPDX-License-Identifier: GPL-3.0-only
/**
 * Single source of truth for regulatory PQC migration deadlines.
 *
 * All learn modules and workshop simulations should import dates from here
 * instead of hardcoding year values. When a regulatory body updates a deadline,
 * update it here — all consumers update automatically.
 *
 * Sources:
 *   - CNSA 2.0: NSA Cybersecurity Advisory (September 2022, updated March 2024)
 *   - NIST IR 8547: Transition to Post-Quantum Cryptography Standards (November 2024)
 *   - ANSSI: Avis relatif à la migration vers la cryptographie post-quantique (2024)
 *   - BSI TR-02102: Cryptographic Mechanisms: Recommendations and Key Lengths (2024)
 */

// ── CNSA 2.0 (NSA) — National Security Systems ────────────────────────────

/** CNSA 2.0 milestone years for NSS migration */
export const CNSA_2_0 = {
  /** New software/firmware should prefer CNSA 2.0 algorithms */
  softwarePreferred: 2025,
  /** New networking equipment must support CNSA 2.0 */
  networkingRequired: 2027,
  /** All deployed NSS software must use CNSA 2.0 signatures */
  softwareExclusive: 2030,
  /** Legacy networking equipment must be replaced with CNSA 2.0 */
  networkingExclusive: 2033,
  /** All remaining NSS systems — web, cloud, servers */
  fullEnforcement: 2035,
  /** Date the advisory was originally published */
  publishedDate: '2022-09-07',
} as const

// ── NIST Deprecation Targets ──────────────────────────────────────────────

/** NIST deprecation and disallowance timeline (NIST IR 8547, November 2024) */
export const NIST_DEPRECATION = {
  /** Target year to deprecate RSA-2048 and 112-bit ECC */
  deprecateClassical: 2030,
  /** Target year to fully disallow all classical public-key crypto */
  disallowClassical: 2035,
  /** FIPS 203/204/205 finalization date */
  fipsFinalized: '2024-08-13',
} as const

// ── FIPS Standards ────────────────────────────────────────────────────────

export const FIPS_STANDARDS = {
  203: { algorithm: 'ML-KEM', name: 'Module-Lattice-Based Key-Encapsulation Mechanism' },
  204: { algorithm: 'ML-DSA', name: 'Module-Lattice-Based Digital Signature Algorithm' },
  205: { algorithm: 'SLH-DSA', name: 'Stateless Hash-Based Digital Signature Algorithm' },
  206: {
    algorithm: 'FN-DSA',
    name: 'FFT over NTRU-Lattice-Based Digital Signature Algorithm',
    status: 'draft',
  },
} as const

// ── ANSSI (France) ────────────────────────────────────────────────────────

export const ANSSI_TIMELINE = {
  /** ANSSI requires hybrid mode for all PQC deployments (except standalone hash-based sigs) */
  hybridMandatory: true,
  /** Hash-based signatures (SLH-DSA, LMS, XMSS) may be used standalone */
  hashBasedStandaloneAllowed: true,
  /** Target year for organizations to have PQC migration plans */
  migrationPlanTarget: 2025,
} as const

// ── BSI (Germany) ─────────────────────────────────────────────────────────

export const BSI_TIMELINE = {
  /** BSI recommends hybrid PQC+classical for transition period */
  hybridRecommended: true,
  /** Target for quantum-safe by default */
  quantumSafeDefault: 2030,
} as const

// ── Common CRQC (Cryptographically Relevant Quantum Computer) Estimates ───

export const CRQC_ESTIMATES = {
  /** Conservative lower bound for CRQC arrival (research consensus) */
  lowerBound: 2030,
  /** Moderate estimate */
  moderate: 2035,
  /** Upper bound */
  upperBound: 2040,
  /** Default for workshop simulations */
  workshopDefault: 2035,
} as const

// ── Vendor PQC Roadmap Dates ──────────────────────────────────────────────
//
// NOTE: Vendor-specific dates (Microsoft 2029, Oracle 2026, MongoDB 2026, etc.)
// are NOT centralized here. They are editorial claims in module narratives
// sourced from vendor announcements and product roadmaps. They change
// frequently and are tracked per-product in the migrate CSV catalog.
//
// Each module's content.ts has a `lastReviewed` date — vendor claims should
// be re-verified against the migrate catalog when lastReviewed > 90 days old.
//
// Do NOT add vendor dates here — this file is for government/standards body
// deadlines only.

// ── Helpers ───────────────────────────────────────────────────────────────

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Format an ISO date string as "Month YYYY" (e.g., "August 2024") */
export function formatMonthYear(isoDate: string): string {
  const [y, m] = isoDate.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${y}`
}

// ── Helper: timeline events for module reuse ─────────────────────────────

export const PQC_TIMELINE_EVENTS = [
  {
    year: NIST_DEPRECATION.fipsFinalized.slice(0, 4),
    event: 'FIPS 203, 204, 205 published — PQC standards are official',
  },
  {
    year: String(CNSA_2_0.softwarePreferred),
    event: 'CNSA 2.0: new software/firmware should prefer PQC algorithms',
  },
  {
    year: String(CNSA_2_0.networkingRequired),
    event: 'CNSA 2.0: new networking equipment must support PQC',
  },
  {
    year: String(NIST_DEPRECATION.deprecateClassical),
    event: 'NIST target: deprecate RSA-2048 and 112-bit ECC',
  },
  { year: String(CNSA_2_0.networkingExclusive), event: 'CNSA 2.0: legacy networking replaced' },
  {
    year: String(NIST_DEPRECATION.disallowClassical),
    event: 'NIST target: disallow all classical public-key crypto',
  },
] as const
