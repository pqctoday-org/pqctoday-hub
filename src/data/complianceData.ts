// SPDX-License-Identifier: GPL-3.0-only
import type { IndustryComplianceConfig } from './industryAssessConfig'
import { loadLatestCSV, splitSemicolon, parseBoolYesNo } from './csvUtils'

// ── Types ────────────────────────────────────────────────────────────────

export type BodyType =
  | 'standardization_body'
  | 'technical_standard'
  | 'certification_body'
  | 'compliance_framework'
  | 'industry_alliance'

export type DeadlinePhase = 'active' | 'imminent' | 'near' | 'mid' | 'long' | 'ongoing'

export interface ComplianceFramework {
  id: string
  label: string
  description: string
  industries: string[]
  countries: string[]
  requiresPQC: boolean
  deadline: string
  deadlineYear?: number
  deadlinePhase: DeadlinePhase
  notes: string
  enforcementBody: string
  libraryRefs: string[]
  timelineRefs: string[]
  bodyType: BodyType
  website?: string
  trustedSourceId?: string
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
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
  notes: string
  enforcement_body: string
  library_refs: string
  timeline_refs: string
  body_type: string
  website: string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
}

const modules = import.meta.glob('./compliance_*.csv', {
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
]

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
  const deadlineYear = extractDeadlineYear(deadline)
  const deadlinePhase = classifyDeadline(deadline, deadlineYear)

  return {
    id: row.id,
    label: row.label,
    description: row.description || '',
    industries: splitSemicolon(row.industries),
    countries: splitSemicolon(row.countries),
    requiresPQC: parseBoolYesNo(row.requires_pqc),
    deadline,
    deadlineYear,
    deadlinePhase,
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
  }
})

/** All compliance frameworks from the latest compliance CSV. */
export const complianceFrameworks: ComplianceFramework[] = frameworks

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
  // Europe non-EU
  Switzerland: 'Europe (non-EU)',
  Norway: 'Europe (non-EU)',
  Iceland: 'Europe (non-EU)',
  Turkey: 'Europe (non-EU)',
  Ukraine: 'Europe (non-EU)',
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
> = Object.fromEntries(
  frameworks.map((fw) => [
    fw.label,
    { requiresPQC: fw.requiresPQC, deadline: fw.deadline, notes: fw.notes },
  ])
)
