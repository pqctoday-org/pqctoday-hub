// SPDX-License-Identifier: GPL-3.0-only
import type { IndustryComplianceConfig } from './industryAssessConfig'
import { loadLatestCSV, splitSemicolon, parseBoolYesNo } from './csvUtils'

// ── Types ────────────────────────────────────────────────────────────────

export type BodyType =
  | 'standardization_body'
  | 'technical_standard'
  | 'certification_body'
  | 'compliance_framework'

export interface ComplianceFramework {
  id: string
  label: string
  description: string
  industries: string[]
  countries: string[]
  requiresPQC: boolean
  deadline: string
  notes: string
  enforcementBody: string
  libraryRefs: string[]
  timelineRefs: string[]
  bodyType: BodyType
  website?: string
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
]

const { data: frameworks, metadata: parsedMetadata } = loadLatestCSV<
  RawComplianceRow,
  ComplianceFramework
>(modules, /compliance_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/, (row) => {
  if (!row.id || !row.label) return null

  const bodyType: BodyType = validBodyTypes.includes(row.body_type as BodyType)
    ? (row.body_type as BodyType)
    : 'compliance_framework'

  return {
    id: row.id,
    label: row.label,
    description: row.description || '',
    industries: splitSemicolon(row.industries),
    countries: splitSemicolon(row.countries),
    requiresPQC: parseBoolYesNo(row.requires_pqc),
    deadline: row.deadline || 'Ongoing',
    notes: row.notes || '',
    enforcementBody: row.enforcement_body || '',
    libraryRefs: splitSemicolon(row.library_refs),
    timelineRefs: splitSemicolon(row.timeline_refs),
    bodyType,
    website: row.website?.trim() || undefined,
  }
})

/** All compliance frameworks from the latest compliance CSV. */
export const complianceFrameworks: ComplianceFramework[] = frameworks

/** CSV file metadata (filename and date). */
export const complianceMetadata = parsedMetadata

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
