// SPDX-License-Identifier: GPL-3.0-only
import type { IndustryComplianceConfig } from './industryAssessConfig'
import { loadLatestCSV, splitSemicolon, parseBoolYesNo } from './csvUtils'
import { filterActive } from './loaderUtils'
import { COUNTRY_CODE_TO_NAME as JURISDICTION_CODE_TO_NAME } from './jurisdictionsData'

// ── Types ────────────────────────────────────────────────────────────────

export type BodyType =
  | 'standardization_body'
  | 'technical_standard'
  | 'certification_body'
  | 'compliance_framework'
  | 'industry_alliance'
  | 'regulatory_body'

export type DeadlinePhase = 'active' | 'imminent' | 'near' | 'mid' | 'long' | 'ongoing'

/**
 * Why a row has (or has not) a date — see ComplianceFramework.deadlineKind.
 * `unknown` is deliberately distinct from `none`: one is a gap in our data,
 * the other is a fact about the regulation.
 */
export type DeadlineKind = 'fixed' | 'phased' | 'ongoing' | 'none' | 'unknown'

/**
 * Five-valued PQC-requirement enum (canonical surface). Existing consumers
 * keep using the legacy `requiresPQC` boolean (= `pqcRequirement === 'yes'`);
 * new code should branch on the enum to surface the full spectrum.
 *
 * - `yes`      explicit mandate (e.g. CNSA 2.0, ANSSI PQC qualification)
 * - `no`       framework does not mandate / address PQC
 * - `partial`  PQC mandated for some scope but not whole framework
 * - `guidance` framework publishes PQC guidance but does not mandate adoption
 * - `expected` PQC mandate anticipated but not yet codified (e.g. CRA, FedRAMP)
 */
export type PQCRequirement = 'yes' | 'no' | 'partial' | 'guidance' | 'expected'

export interface ComplianceFramework {
  id: string
  label: string
  description: string
  industries: string[]
  countries: string[]
  /** Legacy boolean — equivalent to `pqcRequirement === 'yes'`. Prefer `pqcRequirement` in new code. */
  requiresPQC: boolean
  /** Canonical 5-valued PQC-requirement enum — surfaces nuance the boolean drops. */
  pqcRequirement: PQCRequirement
  deadline: string
  deadlineYear?: number
  deadlinePhase: DeadlinePhase
  /**
   * Every milestone date the source states, as {year, label}, parsed from the
   * `deadline_dates` column (WP-1.2, 2026-07-31).
   *
   * The free-text `deadline` above is for humans. This is what the facet and
   * the timeline read. Before it existed both derived from prose, so 66% of
   * rows produced no year and vanished from the timeline, and 21 phased rows
   * were collapsed to their earliest date — NIST IR 8547's "2030 (deprecate),
   * 2035 (disallow)" filed under 2030 only.
   */
  deadlineDates?: { year: number; label: string }[]
  /**
   * First stated milestone — when the obligation starts to bite.
   *
   * DERIVED from deadlineDates, never stored. Two columns holding the same
   * fact is the drift that produced this catalog's industry bug, where
   * `industries` and `naics_codes` were identical until they silently were
   * not. deadlineDates stays the single source of truth.
   */
  deadlineStart?: number
  /**
   * Last stated milestone — the date by which the transition must be COMPLETE.
   *
   * This is the compliance-critical one. NIST IR 8547 deprecates at 2030 and
   * disallows at 2035; an organisation with a 10-year retention horizon is
   * bound by 2035, not by 2030. Before WP-1.2 only the earliest date existed,
   * so the binding constraint was the one the data could not express.
   */
  deadlineEnd?: number
  /**
   * fixed | phased | ongoing | none | unknown.
   *
   * Splits what used to be one "ongoing / no year" bucket into states that
   * mean different things: genuinely open-ended (`ongoing`), the source states
   * no deadline (`none`), and nobody has read the source yet (`unknown`).
   */
  deadlineKind?: DeadlineKind
  notes: string
  enforcementBody: string
  libraryRefs: string[]
  timelineRefs: string[]
  bodyType: BodyType
  website?: string
  trustedSourceId?: string
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  websiteUrlQuality?: string
  confidenceScore?: number
  cswp39Tags?: string[]
  /** NAICS 2-digit sector codes — machine-readable counterpart to industries */
  naicsCodes?: string[]
  /** DS-series status — `active` rows are surfaced; `deprecated`/`obsolete` filtered out at load. */
  status?: 'active' | 'deprecated' | 'obsolete'
  deprecatedAt?: string
  deprecatedReason?: string
  /** Sister-standards / cross-walk tokens (free text; not yet resolved). */
  relatedStandards?: string[]
  /**
   * ISO date this row's fields were last checked against its primary source
   * — added 2026-07-16 (compliance-maintenance audit). Sparse by design:
   * only rows actually re-verified carry a real date; blank means "not yet
   * tracked", not "verified a long time ago" — never treat an empty value
   * as evidence of staleness on its own.
   */
  lastVerified?: string
}

// ── CSV loading (versioned filename pattern) ────────────────────────────

interface RawComplianceRow {
  id: string
  label: string
  description: string
  industries: string
  countries: string
  requires_pqc: string
  deadline: string
  deadline_dates?: string
  deadline_kind?: string
  notes: string
  enforcement_body: string
  library_refs: string
  timeline_refs: string
  body_type: string
  website: string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
  website_url_quality: string
  confidence_score?: string
  cswp39_tags?: string
  naics_codes?: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
  related_standards?: string
  last_verified?: string
}

// '[0-9]' not a bare '*' — the broad pattern also matched
// compliance_xwalk_candidates_*.csv (a maintenance-pipeline artifact, not
// app data), which was being bundled into the build for nothing even though
// loadLatestCSV's own regex below always picked the right file at runtime
// (fixed 2026-07-16 — same collision already fixed on the Python/maintenance
// side in source_status.py, deprecation_sweep.py, and merge-xwalk-candidates.ts).
const modules = import.meta.glob('./compliance_[0-9]*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const validBodyTypes: BodyType[] = [
  'standardization_body',
  'technical_standard',
  'certification_body',
  'compliance_framework',
  'industry_alliance',
  'regulatory_body',
]

// ISO alpha-2 → full country name, derived from the canonical jurisdictions CSV.
// GB alias for United Kingdom is already emitted by the loader (compliance CSV
// uses GB; the jurisdiction CSV key is UK). PQC-REGION-* synthetic overlay tokens
// are not real country codes and stay inline here.
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  ...JURISDICTION_CODE_TO_NAME,
  'PQC-REGION-AU-AFRICA': 'African Union',
  'PQC-REGION-EU': 'European Union',
  'PQC-REGION-GLOBAL': 'Global',
}

function expandCountryToken(token: string): string {
  const trimmed = token.trim()
  // eslint-disable-next-line security/detect-object-injection
  return COUNTRY_CODE_TO_NAME[trimmed] ?? trimmed
}

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Parse the earliest future (or latest historic) year out of a free-text deadline
 * string. Treats strings starting with "ongoing" / "annual" as year-less so that
 * parenthetical provenance like "Ongoing (GL-2004-2022)" does not fabricate a
 * 2004 deadline.
 */
function extractDeadlineYear(deadline: string): number | undefined {
  if (!deadline) return undefined
  const trimmed = deadline.trim().toLowerCase()
  if (trimmed.startsWith('ongoing') || trimmed.startsWith('annual')) return undefined
  // An explicit "YYYY-YYYY" range whose start year has already passed is a phased
  // mandate that is *in force now* (e.g. CNSA 2.0 "2025-2033", ANSSI "2025-2030").
  // Selecting the far endpoint would bucket it as a distant ('mid'/'long') deadline
  // and bury the active phase, so treat a straddling range as the current year.
  const range = deadline.replace(/[–—]/g, '-').match(/\b(20\d{2})-(20\d{2})\b/)
  if (range) {
    const start = parseInt(range[1], 10)
    const end = parseInt(range[2], 10)
    if (start <= CURRENT_YEAR && CURRENT_YEAR <= end) return CURRENT_YEAR
  }
  const matches = deadline.match(/\b(20\d{2})\b/g)
  if (!matches || matches.length === 0) return undefined
  const years = matches.map((m) => parseInt(m, 10)).sort((a, b) => a - b)
  const future = years.find((y) => y >= CURRENT_YEAR)
  return future ?? years[0]
}

/**
 * Classify a deadline into a phase bucket. Enables the UI deadline facet
 * without needing the CSV author to hand-assign a phase.
 *
 * - active:   no future deadline / ongoing / current year already reached
 * - imminent: within 12 months (deadlineYear - CURRENT_YEAR <= 1)
 * - near:     within ~3 years (2-3)
 * - mid:      within ~6 years (4-6)
 * - long:     beyond 6 years
 * - ongoing:  fallback when no year could be parsed and text says ongoing
 */
function classifyDeadline(deadline: string, year: number | undefined): DeadlinePhase {
  const text = (deadline || '').toLowerCase().trim()
  if (!year) {
    if (text.includes('immediate') || text.includes('active') || text.includes('in force'))
      return 'active'
    return 'ongoing'
  }
  const delta = year - CURRENT_YEAR
  if (delta <= 0) return 'active'
  if (delta <= 1) return 'imminent'
  if (delta <= 3) return 'near'
  if (delta <= 6) return 'mid'
  return 'long'
}

const { data: frameworks, metadata: parsedMetadata } = loadLatestCSV<
  RawComplianceRow,
  ComplianceFramework
>(modules, /compliance_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/, (row) => {
  if (!row.id || !row.label) return null

  const bodyType: BodyType = validBodyTypes.includes(row.body_type as BodyType)
    ? (row.body_type as BodyType)
    : 'compliance_framework'

  const deadline = row.deadline || 'Ongoing'

  // Prefer the structured column; fall back to parsing the prose only for rows
  // that predate the WP-1.2 migration (deprecated rows keep their old shape).
  const deadlineDates = (row.deadline_dates || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [y, ...rest] = part.split(':')
      return { year: parseInt(y, 10), label: rest.join(':').trim() }
    })
    .filter((d) => Number.isFinite(d.year))
    // Sorted ascending HERE rather than trusted from the CSV. The migration
    // writes them in order, but a hand-edited row must not be able to make
    // deadlineDates[0] mean something other than "the first milestone" —
    // consumers index it directly, and an out-of-order row would silently
    // render a later date as the start.
    .sort((a, b) => a.year - b.year)

  const validKinds: DeadlineKind[] = ['fixed', 'phased', 'ongoing', 'none', 'unknown']
  const deadlineKind: DeadlineKind = validKinds.includes(row.deadline_kind as DeadlineKind)
    ? (row.deadline_kind as DeadlineKind)
    : 'unknown'

  // Earliest stated date drives the existing single-year consumers; the full
  // set is available via deadlineDates for the facet and timeline.
  // deadlineDates is sorted ascending above, so these are its two ends.
  const deadlineStart = deadlineDates.length > 0 ? deadlineDates[0].year : undefined
  const deadlineEnd =
    deadlineDates.length > 0 ? deadlineDates[deadlineDates.length - 1].year : undefined

  // deadlineYear keeps its original meaning — the EARLIEST date — because
  // existing consumers (sort, urgency badge, Assess/Report) read it as "the
  // next thing due". Callers that need the completion date want deadlineEnd.
  const deadlineYear = deadlineStart ?? extractDeadlineYear(deadline)
  const deadlinePhase = classifyDeadline(deadline, deadlineYear)

  return {
    id: row.id,
    label: row.label,
    description: row.description || '',
    industries: splitSemicolon(row.industries),
    countries: splitSemicolon(row.countries).map(expandCountryToken),
    requiresPQC: parseBoolYesNo(row.requires_pqc),
    pqcRequirement: ((): PQCRequirement => {
      const v = (row.requires_pqc || '').trim().toLowerCase()
      if (v === 'yes' || v === 'no' || v === 'partial' || v === 'guidance' || v === 'expected') {
        return v
      }
      return 'no'
    })(),
    deadline,
    deadlineYear,
    deadlinePhase,
    deadlineDates,
    deadlineKind,
    deadlineStart,
    deadlineEnd,
    notes: row.notes || '',
    enforcementBody: row.enforcement_body || '',
    libraryRefs: splitSemicolon(row.library_refs),
    timelineRefs: splitSemicolon(row.timeline_refs),
    bodyType,
    website: row.website?.trim() || undefined,
    trustedSourceId: row.trusted_source_id?.trim() || undefined,
    peerReviewed:
      (row.peer_reviewed?.toLowerCase() as ComplianceFramework['peerReviewed']) || undefined,
    vettingBody: row.vetting_body ? splitSemicolon(row.vetting_body) : undefined,
    websiteUrlQuality: row.website_url_quality || undefined,
    confidenceScore: ((): number | undefined => {
      const raw = (row.confidence_score || '').trim()
      if (!raw) return undefined
      const n = Number(raw)
      return Number.isFinite(n) ? n : undefined
    })(),
    cswp39Tags: row.cswp39_tags ? splitSemicolon(row.cswp39_tags) : undefined,
    naicsCodes: row.naics_codes ? splitSemicolon(row.naics_codes) : undefined,
    status: ((): ComplianceFramework['status'] => {
      const s = (row.status || '').trim().toLowerCase()
      if (s === 'deprecated' || s === 'obsolete') return s
      return 'active'
    })(),
    deprecatedAt: row.deprecated_at?.trim() || undefined,
    deprecatedReason: row.deprecated_reason?.trim() || undefined,
    relatedStandards: row.related_standards ? splitSemicolon(row.related_standards) : undefined,
    lastVerified: row.last_verified?.trim() || undefined,
  }
})

/**
 * All ACTIVE compliance frameworks from the latest compliance CSV. Deprecated /
 * obsolete rows are filtered out at load (DS-series self-containment rule). Use
 * `allComplianceFrameworks` if you need the unfiltered set for cross-reference
 * resolution or audit views.
 */
export const complianceFrameworks: ComplianceFramework[] = filterActive(
  frameworks as Array<ComplianceFramework & { status?: string }>
) as ComplianceFramework[]

/** Unfiltered set including deprecated/obsolete rows — for audits + cross-refs. */
export const allComplianceFrameworks: ComplianceFramework[] = frameworks

/** CSV file metadata (filename and date). */
export const complianceMetadata = parsedMetadata

// ── Regional taxonomy ───────────────────────────────────────────────────

export type RegionBloc =
  | 'North America'
  | 'Latin America'
  | 'European Union'
  | 'Europe (non-EU)'
  | 'United Kingdom'
  | 'Asia-Pacific'
  | 'Middle East'
  | 'Africa'
  | 'Global'
  | 'Other'

/** Map each country string as used in compliance CSV to a regulatory bloc. */
const COUNTRY_TO_REGION: Record<string, RegionBloc> = {
  // North America
  'United States': 'North America',
  Canada: 'North America',
  Mexico: 'Latin America',
  // Latin America
  Brazil: 'Latin America',
  Argentina: 'Latin America',
  Chile: 'Latin America',
  Colombia: 'Latin America',
  Peru: 'Latin America',
  Uruguay: 'Latin America',
  // EU / EEA
  'European Union': 'European Union',
  France: 'European Union',
  Germany: 'European Union',
  Netherlands: 'European Union',
  Denmark: 'European Union',
  Italy: 'European Union',
  Spain: 'European Union',
  Ireland: 'European Union',
  Greece: 'European Union',
  Poland: 'European Union',
  Sweden: 'European Union',
  Finland: 'European Union',
  Belgium: 'European Union',
  Austria: 'European Union',
  Portugal: 'European Union',
  'Czech Republic': 'European Union',
  Czechia: 'European Union',
  Estonia: 'European Union',
  // Europe non-EU
  Switzerland: 'Europe (non-EU)',
  Norway: 'Europe (non-EU)',
  Iceland: 'Europe (non-EU)',
  Turkey: 'Europe (non-EU)',
  Ukraine: 'Europe (non-EU)',
  Russia: 'Europe (non-EU)',
  // UK
  'United Kingdom': 'United Kingdom',
  // APAC
  Japan: 'Asia-Pacific',
  Australia: 'Asia-Pacific',
  'South Korea': 'Asia-Pacific',
  Singapore: 'Asia-Pacific',
  India: 'Asia-Pacific',
  'New Zealand': 'Asia-Pacific',
  'Hong Kong': 'Asia-Pacific',
  Taiwan: 'Asia-Pacific',
  Malaysia: 'Asia-Pacific',
  China: 'Asia-Pacific',
  Indonesia: 'Asia-Pacific',
  Philippines: 'Asia-Pacific',
  Thailand: 'Asia-Pacific',
  Vietnam: 'Asia-Pacific',
  // Middle East
  Israel: 'Middle East',
  'United Arab Emirates': 'Middle East',
  'Saudi Arabia': 'Middle East',
  Bahrain: 'Middle East',
  Jordan: 'Middle East',
  Qatar: 'Middle East',
  Kuwait: 'Middle East',
  Oman: 'Middle East',
  // Africa
  'South Africa': 'Africa',
  Nigeria: 'Africa',
  Kenya: 'Africa',
  Egypt: 'Africa',
  Morocco: 'Africa',
  Ghana: 'Africa',
  Rwanda: 'Africa',
  'African Union': 'Africa',
  // Global
  Global: 'Global',
  International: 'Global',
}

/** Returns the regulatory bloc for a country string, or 'Other' if unknown. */
export function regionForCountry(country: string): RegionBloc {
  return COUNTRY_TO_REGION[country.trim()] ?? 'Other'
}

/**
 * Every deadline phase a framework legitimately belongs to.
 *
 * ADDED 2026-07-31 (WP-1.2). `deadlinePhase` is a single value derived from the
 * EARLIEST stated date, which is wrong for the 19 phased rows: filtering
 * "Long-term (>6y)" could never surface NIST IR 8547's 2035 disallow date,
 * because the row was filed under its 2030 deprecate date. Matching against
 * this set instead makes a phased framework reachable from every bucket it
 * actually has a milestone in.
 */
export function deadlinePhasesFor(fw: ComplianceFramework): DeadlinePhase[] {
  const dates = fw.deadlineDates ?? []
  if (dates.length === 0) return [fw.deadlinePhase]
  return [...new Set(dates.map((d) => classifyDeadline(fw.deadline, d.year)))]
}

/** All region blocs present in the current dataset, sorted for stable UI. */
export const REGION_BLOC_ORDER: RegionBloc[] = [
  'Global',
  'North America',
  'Latin America',
  'European Union',
  'Europe (non-EU)',
  'United Kingdom',
  'Asia-Pacific',
  'Middle East',
  'Africa',
  'Other',
]

/** Unique regions represented in the current frameworks data. */
export const availableRegions: RegionBloc[] = REGION_BLOC_ORDER.filter((region) =>
  frameworks.some((fw) => fw.countries.some((c) => regionForCountry(c) === region))
)

// ── Backward-compatible exports ─────────────────────────────────────────

/**
 * Maps compliance frameworks to IndustryComplianceConfig shape
 * for backward compatibility with the assessment wizard (Step 5).
 */
export const complianceAsIndustryConfigs: IndustryComplianceConfig[] = frameworks.map((fw) => ({
  category: 'compliance' as const,
  id: fw.id,
  label: fw.label,
  description: fw.description,
  industries: fw.industries,
  countries: fw.countries,
  complianceDeadline: fw.deadline,
  complianceNotes: fw.notes,
}))

/**
 * Maps compliance frameworks to the COMPLIANCE_DB shape
 * for backward compatibility with assessment scoring.
 */
export const complianceDB: Record<
  string,
  { requiresPQC: boolean; deadline: string; notes: string }
> = frameworks.reduce<Record<string, { requiresPQC: boolean; deadline: string; notes: string }>>(
  (acc, fw) => {
    // Some labels appear on more than one row (e.g. a `compliance_framework` row and a
    // `standardization_body` row both labelled "ANSSI"). Resolve such collisions
    // deterministically: a row that REQUIRES PQC wins over one that does not, so the
    // stronger obligation is never silently dropped by CSV import order.
    const existing = acc[fw.label]
    // Prefer a PQC-requiring row; among rows with the SAME requiresPQC, keep the
    // later one — matching the prior Object.fromEntries last-wins for deadline/notes
    // so this only changes the silently-dropped requiresPQC flag, nothing else.
    if (!existing || fw.requiresPQC || !existing.requiresPQC) {
      acc[fw.label] = { requiresPQC: fw.requiresPQC, deadline: fw.deadline, notes: fw.notes }
    }
    return acc
  },
  {}
)

/**
 * Canonical concept_id for a compliance framework — PR 3c.
 * Resolves via the concept_registry by (source_table, source_row_id).
 */
import { conceptIdForStoreKey } from './conceptRegistry'
export function conceptIdForFramework(fw: { id: string }): string | undefined {
  return conceptIdForStoreKey('compliance', fw.id)
}

/**
 * Soft lookup — returns undefined if the id is not in the active CSV.
 * Use this in learning modules to derive display names, deadlines, and
 * website URLs from the canonical source rather than hardcoding them.
 * Does NOT throw — callers should provide a fallback for graceful degradation.
 */
export function getFrameworkById(id: string): ComplianceFramework | undefined {
  return complianceFrameworks.find((f) => f.id === id)
}
