// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV, parseBoolYesNo } from './csvUtils'

export interface AuthoritativeSource {
  /** Raw CSV `id` column — was never captured before 2026-07-16, so nothing
   * in the app could resolve a compliance row's trustedSourceId against this
   * registry by id (only by sourceName, which doesn't match the id format).
   * Optional because loadLatestCSV / this file's own age predates the fix in
   * lockstep with the CSV always having had the column; kept optional to
   * match every other field's defensive style here. */
  id?: string
  sourceName: string
  sourceType: 'Government' | 'Academic' | 'Industry Workgroup' | 'Vendor'
  region: 'Americas' | 'EMEA' | 'APAC' | 'Global'
  primaryUrl: string
  description: string
  leadersCsv: boolean
  libraryCsv: boolean
  algorithmCsv: boolean
  threatsCsv: boolean
  timelineCsv: boolean
  complianceCsv: boolean
  migrateCsv: boolean
  lastVerifiedDate: string
}

export type ViewType =
  | 'Timeline'
  | 'Library'
  | 'Threats'
  | 'Leaders'
  | 'Algorithms'
  | 'Compliance'
  | 'Migrate'

interface RawSourceRow {
  id: string
  Source_Name: string
  Source_Type: string
  Region: string
  Primary_URL: string
  Description: string
  Leaders_CSV: string
  Library_CSV: string
  Algorithm_CSV: string
  Threats_CSV: string
  Timeline_CSV: string
  Compliance_CSV: string
  Migrate_CSV: string
  Last_Verified_Date: string
}

const modules = import.meta.glob('./pqc_authoritative_sources_reference_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data, metadata } = loadLatestCSV<RawSourceRow, AuthoritativeSource>(
  modules,
  /pqc_authoritative_sources_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    id: row.id,
    sourceName: row.Source_Name,
    sourceType: row.Source_Type as AuthoritativeSource['sourceType'],
    region: row.Region as AuthoritativeSource['region'],
    primaryUrl: row.Primary_URL,
    description: row.Description,
    leadersCsv: parseBoolYesNo(row.Leaders_CSV),
    libraryCsv: parseBoolYesNo(row.Library_CSV),
    algorithmCsv: parseBoolYesNo(row.Algorithm_CSV),
    threatsCsv: parseBoolYesNo(row.Threats_CSV),
    timelineCsv: parseBoolYesNo(row.Timeline_CSV),
    complianceCsv: parseBoolYesNo(row.Compliance_CSV),
    migrateCsv: parseBoolYesNo(row.Migrate_CSV),
    lastVerifiedDate: row.Last_Verified_Date,
  })
)

export const authoritativeSources: AuthoritativeSource[] = data

export const sourcesMetadata = metadata

// Filter sources by view type
export function getSourcesForView(viewType: ViewType): AuthoritativeSource[] {
  const filterMap: Record<ViewType, keyof AuthoritativeSource> = {
    Timeline: 'timelineCsv',
    Library: 'libraryCsv',
    Threats: 'threatsCsv',
    Leaders: 'leadersCsv',
    Algorithms: 'algorithmCsv',
    Compliance: 'complianceCsv',
    Migrate: 'migrateCsv',
  }

  const filterKey = filterMap[viewType]

  return authoritativeSources.filter((source) => source[filterKey] === true)
}

/** Looks up a source by its raw CSV `id` (e.g. a compliance row's trustedSourceId). */
export function getAuthoritativeSource(id: string): AuthoritativeSource | undefined {
  return authoritativeSources.find((source) => source.id === id)
}
