// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV, parseBoolYesNo } from './csvUtils'
import { VIEW_CITED_SOURCE_IDS, type CitedView } from './generated/viewSourceCitations.generated'

export interface AuthoritativeSource {
  /** Raw CSV `id` column — was never captured before 2026-07-16, so nothing
   * in the app could resolve a compliance row's trustedSourceId against this
   * registry by id (only by sourceName, which doesn't match the id format).
   * Optional because loadLatestCSV / this file's own age predates the fix in
   * lockstep with the CSV always having had the column; kept optional to
   * match every other field's defensive style here. */
  id?: string
  /** trusted_sources source_id for the same organization when it differs
   * from `id` (ids are never renamed). Blank when the two ids are equal. */
  trustedSourceId?: string
  sourceName: string
  sourceType: 'Government' | 'Academic' | 'Industry Workgroup' | 'Vendor'
  region: 'Americas' | 'EMEA' | 'APAC' | 'Global'
  primaryUrl: string
  description: string
  /**
   * Whether this source names the issuing authority of patent records. Patent records carry no
   * trusted_source_id, so /patents is the one page whose source list is not derived from its
   * records. Every other page's list comes from the ids its records cite (see getSourcesForView).
   */
  patentsCsv: boolean
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
  // ADDED 2026-08-07. /patents was the one data page with no provenance
  // surface at all — not because a column was missing, but because NEITHER
  // registry contained a single patent authority. USPTO (the issuing
  // authority for the catalogue's US records) and Google Patents (the index the
  // harvester actually queries) are now registered, so this ViewType finally
  // has sources to point at.
  | 'Patents'

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
  Patents_CSV: string
  Last_Verified_Date: string
  trusted_source_id?: string
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
    trustedSourceId: row.trusted_source_id || undefined,
    sourceName: row.Source_Name,
    sourceType: row.Source_Type as AuthoritativeSource['sourceType'],
    region: row.Region as AuthoritativeSource['region'],
    primaryUrl: row.Primary_URL,
    description: row.Description,
    patentsCsv: parseBoolYesNo(row.Patents_CSV),
    lastVerifiedDate: row.Last_Verified_Date,
  })
)

export const authoritativeSources: AuthoritativeSource[] = data

export const sourcesMetadata = metadata

const CITED_BY_VIEW: Record<CitedView, ReadonlySet<string>> = Object.fromEntries(
  Object.entries(VIEW_CITED_SOURCE_IDS).map(([view, ids]) => [view, new Set(ids)])
) as Record<CitedView, ReadonlySet<string>>

/** True when the page's active records cite this source (by its id, or its trusted-sources id). */
export function isSourceCitedInView(source: AuthoritativeSource, viewType: ViewType): boolean {
  if (viewType === 'Patents') return source.patentsCsv
  // eslint-disable-next-line security/detect-object-injection -- viewType is the typed ViewType union
  const cited = CITED_BY_VIEW[viewType]
  return (
    (source.id !== undefined && cited.has(source.id)) ||
    (source.trustedSourceId !== undefined && cited.has(source.trustedSourceId))
  )
}

/** The sources a page lists: those its own records cite (derived, not hand-flagged). */
export function getSourcesForView(viewType: ViewType): AuthoritativeSource[] {
  return authoritativeSources.filter((source) => isSourceCitedInView(source, viewType))
}

/** Looks up a source by its raw CSV `id` (e.g. a compliance row's trustedSourceId). */
export function getAuthoritativeSource(id: string): AuthoritativeSource | undefined {
  return authoritativeSources.find((source) => source.id === id)
}
