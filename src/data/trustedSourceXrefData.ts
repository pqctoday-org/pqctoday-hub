// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'

export type XrefResourceType =
  | 'library'
  | 'threats'
  | 'timeline'
  | 'leaders'
  | 'migrate'
  | 'compliance'
  | 'algorithm'

export type XrefMatchMethod = 'direct' | 'mapped' | 'inferred' | 'category-inferred'

export interface TrustedSourceXref {
  resourceType: XrefResourceType
  resourceId: string
  sourceId: string
  matchMethod: XrefMatchMethod
}

interface RawXrefRow {
  resource_type: string
  resource_id: string
  source_id: string
  match_method: string
}

const modules = import.meta.glob('./trusted_source_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data: allXrefs, metadata } = loadLatestCSV<RawXrefRow, TrustedSourceXref>(
  modules,
  /trusted_source_xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    resourceType: row.resource_type as XrefResourceType,
    resourceId: row.resource_id,
    sourceId: row.source_id,
    matchMethod: (row.match_method as XrefMatchMethod) ?? 'mapped',
  })
)

/** All trusted source cross-references. */
export const trustedSourceXrefs: TrustedSourceXref[] = allXrefs

/** Lookup map: source_id → TrustedSourceXref[] */
export const xrefsBySource: Map<string, TrustedSourceXref[]> = allXrefs.reduce((map, xref) => {
  const existing = map.get(xref.sourceId) ?? []
  existing.push(xref)
  map.set(xref.sourceId, existing)
  return map
}, new Map<string, TrustedSourceXref[]>())

/** Lookup map: resourceId → TrustedSourceXref[] */
export const xrefsByResource: Map<string, TrustedSourceXref[]> = allXrefs.reduce((map, xref) => {
  const existing = map.get(xref.resourceId) ?? []
  existing.push(xref)
  map.set(xref.resourceId, existing)
  return map
}, new Map<string, TrustedSourceXref[]>())

/**
 * Get all trusted source cross-references for a specific record.
 * @param resourceType - The type of resource (e.g., 'library', 'threats')
 * @param resourceId - The primary key of the resource record
 */
export function getSourcesForRecord(
  resourceType: XrefResourceType,
  resourceId: string
): TrustedSourceXref[] {
  return allXrefs.filter((x) => x.resourceType === resourceType && x.resourceId === resourceId)
}

/** CSV file metadata. */
export const xrefMetadata = metadata
