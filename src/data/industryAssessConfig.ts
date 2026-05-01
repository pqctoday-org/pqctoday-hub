// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV, splitSemicolon, parseIntSafe } from './csvUtils'

export interface IndustryComplianceConfig {
  category: 'compliance'
  id: string
  label: string
  description: string
  industries: string[]
  countries: string[]
  complianceDeadline: string
  complianceNotes: string
}

export interface IndustryUseCaseConfig {
  category: 'use_case'
  id: string
  label: string
  description: string
  industries: string[]
  hndlRelevance: number
  migrationPriority: number
  complianceIds: string[]
  threatIds: string[]
}

export interface IndustryRetentionConfig {
  category: 'retention'
  id: string
  label: string
  description: string
  industries: string[]
  retentionYears: number
  complianceIds: string[]
  threatIds: string[]
}

export interface IndustrySensitivityConfig {
  category: 'sensitivity'
  id: string
  label: string
  description: string
  industries: string[]
  sensitivityScore: number
  complianceIds: string[]
  threatIds: string[]
}

export type IndustryConfigRow =
  | IndustryComplianceConfig
  | IndustryUseCaseConfig
  | IndustryRetentionConfig
  | IndustrySensitivityConfig

interface RawAssessRow {
  category: string
  id: string
  label: string
  description: string
  industries: string
  hndl_relevance: string
  migration_priority: string
  retention_years: string
  compliance_deadline: string
  compliance_notes: string
  countries: string
  compliance_id: string
  threat_id: string
}

const modules = import.meta.glob('./pqcassessment_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data: allRows, metadata: parsedMetadata } = loadLatestCSV<RawAssessRow, IndustryConfigRow>(
  modules,
  /pqcassessment_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    const industries = splitSemicolon(row.industries)
    const countries = splitSemicolon(row.countries)
    const complianceIds = splitSemicolon(row.compliance_id)
    const threatIds = splitSemicolon(row.threat_id)

    if (row.category === 'compliance') {
      return {
        category: 'compliance',
        id: row.id || '',
        label: row.label || '',
        description: row.description || '',
        industries,
        countries,
        complianceDeadline: row.compliance_deadline || '',
        complianceNotes: row.compliance_notes || '',
      } satisfies IndustryComplianceConfig
    }

    if (row.category === 'use_case') {
      return {
        category: 'use_case',
        id: row.id || '',
        label: row.label || '',
        description: row.description || '',
        industries,
        hndlRelevance: row.hndl_relevance ? parseIntSafe(row.hndl_relevance) : 5,
        migrationPriority: row.migration_priority ? parseIntSafe(row.migration_priority) : 5,
        complianceIds,
        threatIds,
      } satisfies IndustryUseCaseConfig
    }

    if (row.category === 'retention') {
      return {
        category: 'retention',
        id: row.id || '',
        label: row.label || '',
        description: row.description || '',
        industries,
        retentionYears: row.retention_years ? parseIntSafe(row.retention_years) : 0,
        complianceIds,
        threatIds,
      } satisfies IndustryRetentionConfig
    }

    if (row.category === 'sensitivity') {
      return {
        category: 'sensitivity',
        id: row.id || '',
        label: row.label || '',
        description: row.description || '',
        industries,
        sensitivityScore: row.hndl_relevance ? parseIntSafe(row.hndl_relevance) : 5,
        complianceIds,
        threatIds,
      } satisfies IndustrySensitivityConfig
    }

    return null
  }
)

// Compliance configs now come from the dedicated compliance CSV
// (single source of truth: compliance_*.csv → complianceData.ts)
export { complianceAsIndustryConfigs as industryComplianceConfigs } from './complianceData'

export const industryUseCaseConfigs: IndustryUseCaseConfig[] = allRows.filter(
  (r): r is IndustryUseCaseConfig => r.category === 'use_case'
)

export const industryRetentionConfigs: IndustryRetentionConfig[] = allRows.filter(
  (r): r is IndustryRetentionConfig => r.category === 'retention' && r.industries.length > 0
)

export const universalRetentionConfigs: IndustryRetentionConfig[] = allRows.filter(
  (r): r is IndustryRetentionConfig => r.category === 'retention' && r.industries.length === 0
)

export const industrySensitivityConfigs: IndustrySensitivityConfig[] = allRows.filter(
  (r): r is IndustrySensitivityConfig => r.category === 'sensitivity'
)

export const metadata: { filename: string; lastUpdate: Date } | null = parsedMetadata

/** Returns configs for a given industry from a typed config array. */
export function getIndustryConfigs<T extends { industries: string[] }>(
  configs: T[],
  industry: string
): T[] {
  if (!industry) return []
  return configs.filter((c) => c.industries.includes(industry))
}
