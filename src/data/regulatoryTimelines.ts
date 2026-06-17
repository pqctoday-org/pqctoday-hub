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

import type { PhaseId } from './frameworkPhases'

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

/**
 * CNSA 2.0 per-equipment-class deadline labels — reconciled to the Applied
 * Quantum Reg & Standards Alignment Map (p.156) wording (PER-PAGE-CHANGES
 * Timeline #7). The milestone *years* are the same `CNSA_2_0` ladder; this view
 * pins which equipment class lands on each year so the Timeline can label a bar
 * with the framework's class-by-deadline semantics rather than the looser
 * `softwareExclusive`/`networkingExclusive` field names.
 *
 * Mapping-table wording (p.156): "NSS acquisitions compliant by 2027;
 * networking by 2030; web/cloud/OS by 2033; all NSS by 2035."
 */
export const CNSA_2_0_BY_CLASS: ReadonlyArray<{
  /** Equipment / system class as named in the framework Mapping table. */
  class: string
  /** Deadline year, sourced from the `CNSA_2_0` ladder. */
  year: number
  /** Framework Mapping-table requirement wording. */
  requirement: string
}> = [
  {
    class: 'Software & firmware (acquisitions)',
    year: CNSA_2_0.networkingRequired, // 2027 — procurement gate
    requirement: 'New software/firmware acquisitions must support CNSA 2.0',
  },
  {
    class: 'Networking equipment',
    year: CNSA_2_0.softwareExclusive, // 2030 per p.156 ("networking by 2030")
    requirement: 'Networking equipment exclusively CNSA 2.0',
  },
  {
    class: 'Web, cloud & operating systems',
    year: CNSA_2_0.networkingExclusive, // 2033 per p.156 ("web/cloud/OS by 2033")
    requirement: 'Web / cloud / OS exclusively CNSA 2.0',
  },
  {
    class: 'All National Security Systems',
    year: CNSA_2_0.fullEnforcement, // 2035
    requirement: 'All remaining NSS exclusively CNSA 2.0',
  },
] as const

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

/**
 * Public research RANGE for CRQC arrival, cited by the Assess risk windows.
 * NOTE: the Simulation's Mosca clock uses a deliberately MORE aggressive
 * first-CRQC anchor — `QC_FIRST_YEAR = 2029` in quantumTimeline.ts — which sits
 * at/below `lowerBound` on purpose (urgency for the most sensitive assets).
 * `QC_BROAD_YEAR` (2035) == `moderate` here. quantumTimeline.test.ts locks that
 * relationship so the two blocks stay consistent.
 */
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

export const PQC_TIMELINE_EVENTS: ReadonlyArray<{
  year: string
  event: string
  frameworkPhase: PhaseId
}> = [
  {
    year: NIST_DEPRECATION.fipsFinalized.slice(0, 4),
    event: 'FIPS 203, 204, 205 published — PQC standards are official',
    frameworkPhase: 'foundations',
  },
  {
    year: String(CNSA_2_0.softwarePreferred),
    event: 'CNSA 2.0: new software/firmware should prefer PQC algorithms',
    frameworkPhase: 'p4',
  },
  {
    year: String(CNSA_2_0.networkingRequired),
    event: 'CNSA 2.0: new networking equipment must support PQC',
    frameworkPhase: 'p4',
  },
  {
    year: String(NIST_DEPRECATION.deprecateClassical),
    event: 'NIST target: deprecate RSA-2048 and 112-bit ECC',
    frameworkPhase: 'p4',
  },
  {
    year: String(CNSA_2_0.networkingExclusive),
    event: 'CNSA 2.0: legacy networking replaced',
    frameworkPhase: 'p4',
  },
  {
    year: String(NIST_DEPRECATION.disallowClassical),
    event: 'NIST target: disallow all classical public-key crypto',
    frameworkPhase: 'p4',
  },
]

// ── Framework-phase tags (Wave-1) ─────────────────────────────────────────
//
// AQ Phase overlay tag for each exported regulatory/standards constant in this
// file. Per the Wave-0 contract (`./frameworkPhases.ts`): roadmap/deadline
// timelines map to Phase 4 (Roadmap & Governance, `p4`); regulatory/standards
// *mapping* references (the FIPS standard catalog, the CRQC threat horizon)
// are cross-cutting Foundations inputs (`foundations`).

/** Phase tag for each exported regulatory constant block above. */
export const REGULATORY_PHASE = {
  /** CNSA 2.0 milestone years → roadmap deadlines. */
  CNSA_2_0: 'p4',
  /** NIST IR 8547 deprecation/disallowance targets → roadmap deadlines. */
  NIST_DEPRECATION: 'p4',
  /** FIPS standard catalog → standards reference mapping. */
  FIPS_STANDARDS: 'foundations',
  /** ANSSI migration-plan target & hybrid policy → roadmap deadlines. */
  ANSSI_TIMELINE: 'p4',
  /** BSI quantum-safe-by-default target → roadmap deadline. */
  BSI_TIMELINE: 'p4',
  /** CRQC threat-horizon estimates → cross-cutting Foundations input. */
  CRQC_ESTIMATES: 'foundations',
} as const satisfies Record<string, PhaseId>

// ── "2026–2030 Squeeze" converging-deadline sequence (Phase 4 map, p.157) ──
//
// The framework frames ≥14 distinct regulatory deadlines compressing into a
// ~48-month window. This is the dated sequence surfaced by the Timeline
// "Squeeze ribbon" (PER-PAGE-CHANGES Timeline #2). All entries are Phase-4
// roadmap deadlines. The CA/Browser Forum SC-081v3 certificate-lifetime track
// (200d → 100d → 47d) and the new 2026 developments live here too.

/** A single converging-deadline event in the 2026–2030 squeeze window. */
export interface SqueezeEvent {
  /** ISO date (YYYY-MM) of the deadline. */
  date: string
  /** Short label for the ribbon tick. */
  label: string
  /** One-line detail of what the deadline requires. */
  detail: string
  /** Track lane the event belongs to. */
  track: 'standards' | 'cab-forum' | 'regulation' | 'cnsa'
}

export const SQUEEZE_2026_2030: ReadonlyArray<SqueezeEvent> = [
  {
    date: '2026-01',
    label: 'NIS2 PQC Amendment',
    detail: 'COM(2026) 13 — EU NIS2 post-quantum amendment proposed (Jan 2026)',
    track: 'regulation',
  },
  {
    date: '2026-01',
    label: 'G7 Financial PQC Roadmap',
    detail: 'G7 financial-sector PQC roadmap: 2030–2032 targets, full migration 2035',
    track: 'regulation',
  },
  {
    date: '2026-03',
    label: 'CA/B 200-day certs',
    detail: 'CA/Browser Forum SC-081v3: max TLS cert lifetime drops to 200 days',
    track: 'cab-forum',
  },
  {
    date: '2026-06',
    label: "Let's Encrypt MTC",
    detail: "Let's Encrypt begins issuing Merkle Tree Certificates (June 2026)",
    track: 'standards',
  },
  {
    date: '2026-09',
    label: 'FIPS 140-2 sunset',
    detail: 'FIPS 140-2 validated modules retired; FIPS 140-3 required',
    track: 'standards',
  },
  {
    date: '2026-11',
    label: 'CMMC Level 2',
    detail: 'CMMC Level 2 enforcement — FIPS 140-3 required for CUI',
    track: 'regulation',
  },
  {
    date: '2027-01',
    label: 'CNSA 2.0 procurement gate',
    detail: 'CNSA 2.0: new software/firmware acquisitions must support PQC',
    track: 'cnsa',
  },
  {
    date: '2027-03',
    label: 'CA/B 100-day certs',
    detail: 'CA/Browser Forum SC-081v3: max TLS cert lifetime drops to 100 days',
    track: 'cab-forum',
  },
  {
    date: '2027-07',
    label: 'Chrome QR Root Store',
    detail: 'IETF MTC + Chrome quantum-resistant root-store changes (Q3 2027)',
    track: 'standards',
  },
  {
    date: '2029-03',
    label: 'CA/B 47-day certs',
    detail: 'CA/Browser Forum SC-081v3: max TLS cert lifetime drops to 47 days',
    track: 'cab-forum',
  },
  {
    date: '2030-01',
    label: 'CNSA 2.0 software',
    detail: 'CNSA 2.0 software/firmware compliance; EU critical-infra + G7 financial targets',
    track: 'cnsa',
  },
  {
    date: '2031-01',
    label: 'Canada / NCSC UK',
    detail: 'Canada and NCSC UK high-priority systems migration target',
    track: 'regulation',
  },
] as const

// ── CA/Browser Forum SC-081v3 certificate-lifetime track ──────────────────

/** The TLS certificate-lifetime compression steps (SC-081v3). */
export const CAB_FORUM_CERT_LIFETIME: ReadonlyArray<{ date: string; maxDays: number }> = [
  { date: '2026-03', maxDays: 200 },
  { date: '2027-03', maxDays: 100 },
  { date: '2029-03', maxDays: 47 },
] as const

// ── "Build Your Roadmap" — Phase 4 §4.2 five-year org template (p.84–85) ───
//
// The prescriptive Year 1–5 migration skeleton an org can superimpose on the
// national-deadline backdrop (PER-PAGE-CHANGES Timeline #1). Each year maps to
// the AQ phases it primarily exercises.

/** One year of the 5-year "Build Your Roadmap" template. */
export interface RoadmapYear {
  year: 1 | 2 | 3 | 4 | 5
  /** Theme name from Activity 4.2. */
  theme: string
  /** The headline deliverables for the year. */
  milestones: string[]
  /** AQ phases this year primarily advances. */
  phases: PhaseId[]
}

export const ROADMAP_5_YEAR: ReadonlyArray<RoadmapYear> = [
  {
    year: 1,
    theme: 'Foundation',
    milestones: [
      'Crypto-BOM v1 published',
      '2–4 hybrid pilots (TLS / VPN)',
      'Team training & Crypto Champion',
    ],
    phases: ['p0', 'p1', 'p2', 'p3'],
  },
  {
    year: 2,
    theme: 'Tier-1 Rollout',
    milestones: [
      'Multi-year roadmap & PMO live',
      'Tier-1 systems migrated to hybrid',
      'Gate G4 cleared',
    ],
    phases: ['p4', 'p5'],
  },
  {
    year: 3,
    theme: 'Bulk Migration',
    milestones: ['Wave migration across the estate', 'HSM / KMS modernization', 'Vendor PQC SLAs'],
    phases: ['p5', 'p6', 'p7'],
  },
  {
    year: 4,
    theme: 'Long Tail & OT',
    milestones: [
      'Long-tail & embedded/OT systems',
      'Data-at-rest re-encryption',
      'Exception register closed',
    ],
    phases: ['p5', 'p6'],
  },
  {
    year: 5,
    theme: 'Hardening & Agility',
    milestones: [
      'Classical public-key disallowed (NIST 2035 track)',
      'Crypto-agility verified',
      'Continuous vendor governance (BAU)',
    ],
    phases: ['p6', 'p7', 'foundations'],
  },
] as const

// ── Phase → regulation "what output satisfies it" map (p.156–157) ──────────
//
// Ties a regulation to the framework deliverable that satisfies it
// (PER-PAGE-CHANGES Timeline #5). Surfaced as a "satisfies-it" reference so a
// reader can connect a deadline to the artifact an org must produce.

/** A regulation and the framework output(s) that satisfy it. */
export interface SatisfiesItEntry {
  regulation: string
  /** Framework deliverable(s) that prove compliance. */
  satisfiedBy: string
  /** AQ phase that produces the deliverable. */
  phase: PhaseId
}

export const PHASE_REGULATION_SATISFIES: ReadonlyArray<SatisfiesItEntry> = [
  {
    regulation: 'PCI DSS 12.3.3',
    satisfiedBy: 'Cryptographic inventory (CBOM) + QRA',
    phase: 'p3',
  },
  {
    regulation: 'OMB M-23-02',
    satisfiedBy: 'Prioritized inventory + annual updates through 2035',
    phase: 'p1',
  },
  {
    regulation: 'EU NIS2 / DORA / CRA',
    satisfiedBy: 'Governance structure + vendor-governance dossier',
    phase: 'p0',
  },
  {
    regulation: 'NIST SP 1800-38',
    satisfiedBy: 'Discovery & pilot reports',
    phase: 'p5',
  },
  {
    regulation: 'CNSA 2.0 (NSS)',
    satisfiedBy: 'Multi-year roadmap with class-by-deadline plan',
    phase: 'p4',
  },
] as const
