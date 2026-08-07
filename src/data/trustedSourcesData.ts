// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV, parseBoolYesNo, parseIntSafe } from './csvUtils'

export interface TrustedSource {
  sourceId: string
  sourceName: string
  sourceType:
    | 'Government'
    | 'Standards_Body'
    | 'Industry_Workgroup'
    | 'Academic'
    | 'Industry_Analyst'
    | 'Vendor'
    | 'Open_Source_Project'
  trustTier: '1_Authoritative' | '2_Core' | '3_Supporting' | '4_Contextual'
  region: 'Americas' | 'EMEA' | 'APAC' | 'Global'
  primaryUrl: string
  description: string
  verificationStatus: 'Verified' | 'Pending' | 'Stale' | 'Deprecated'
  lastVerifiedDate: string
  leadersCsv: boolean
  libraryCsv: boolean
  algorithmCsv: boolean
  threatsCsv: boolean
  timelineCsv: boolean
  complianceCsv: boolean
  migrateCsv: boolean
  /** ADDED 2026-08-07 — patents provenance, see authoritativeSourcesData ViewType. */
  patentsCsv: boolean
  localDocCount: number
  lastDownloadDate: string
  downloadStatus: 'Active' | 'Partial' | 'Blocked' | 'None'
  docCollection: string
  notes: string
  primaryUrlQuality?: string
  dateStamp?: string
}

/**
 * NOTE (2026-08-07): this is a SECOND, hand-mirrored copy of the `ViewType`
 * union declared in authoritativeSourcesData.ts. Adding 'Patents' there did
 * not add it here, and the only thing that caught the divergence was
 * `Record<ViewType, keyof TrustedSource>` failing to compile — i.e. luck of
 * the filter map's shape, not a guard. Worth collapsing to one exported
 * union; left as-is for now to keep this change to patents provenance.
 */
export type ViewType =
  | 'Timeline'
  | 'Library'
  | 'Threats'
  | 'Leaders'
  | 'Algorithms'
  | 'Compliance'
  | 'Migrate'
  | 'Patents'

interface RawTrustedSourceRow {
  source_id: string
  source_name: string
  source_type: string
  trust_tier: string
  region: string
  primary_url: string
  description: string
  verification_status: string
  last_verified_date: string
  leaders_csv: string
  library_csv: string
  algorithm_csv: string
  threats_csv: string
  timeline_csv: string
  compliance_csv: string
  migrate_csv: string
  patents_csv: string
  local_doc_count: string
  last_download_date: string
  download_status: string
  doc_collection: string
  notes: string
  primary_url_quality: string
  date_stamp: string
}

const modules = import.meta.glob('./trusted_sources_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data, metadata } = loadLatestCSV<RawTrustedSourceRow, TrustedSource>(
  modules,
  /trusted_sources_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    sourceId: row.source_id,
    sourceName: row.source_name,
    sourceType: row.source_type as TrustedSource['sourceType'],
    trustTier: row.trust_tier as TrustedSource['trustTier'],
    region: row.region as TrustedSource['region'],
    primaryUrl: row.primary_url,
    description: row.description,
    verificationStatus: row.verification_status as TrustedSource['verificationStatus'],
    lastVerifiedDate: row.last_verified_date,
    leadersCsv: parseBoolYesNo(row.leaders_csv),
    libraryCsv: parseBoolYesNo(row.library_csv),
    algorithmCsv: parseBoolYesNo(row.algorithm_csv),
    threatsCsv: parseBoolYesNo(row.threats_csv),
    timelineCsv: parseBoolYesNo(row.timeline_csv),
    complianceCsv: parseBoolYesNo(row.compliance_csv),
    migrateCsv: parseBoolYesNo(row.migrate_csv),
    patentsCsv: parseBoolYesNo(row.patents_csv),
    localDocCount: parseIntSafe(row.local_doc_count),
    lastDownloadDate: row.last_download_date ?? '',
    downloadStatus: (row.download_status as TrustedSource['downloadStatus']) ?? 'None',
    docCollection: row.doc_collection ?? 'none',
    notes: row.notes ?? '',
    primaryUrlQuality: row.primary_url_quality || undefined,
    dateStamp: row.date_stamp || undefined,
  })
)

/** All trusted sources. */
export const trustedSources: TrustedSource[] = data

/** Backward-compatibility alias used by graphBuilder.ts and legacy consumers. */
export const authoritativeSources = trustedSources

/** CSV file metadata. */
export const sourcesMetadata = metadata

/** Filter trusted sources by the view they contribute data to. */
export function getSourcesForView(viewType: ViewType): TrustedSource[] {
  const filterMap: Record<ViewType, keyof TrustedSource> = {
    Timeline: 'timelineCsv',
    Library: 'libraryCsv',
    Threats: 'threatsCsv',
    Leaders: 'leadersCsv',
    Algorithms: 'algorithmCsv',
    Compliance: 'complianceCsv',
    Migrate: 'migrateCsv',
    Patents: 'patentsCsv',
  }

  const filterKey = filterMap[viewType]
  return trustedSources.filter((source) => source[filterKey] === true)
}

/** Look up a single trusted source by its stable source_id slug. */
export function getTrustedSource(sourceId: string): TrustedSource | undefined {
  return trustedSources.find((s) => s.sourceId === sourceId)
}
