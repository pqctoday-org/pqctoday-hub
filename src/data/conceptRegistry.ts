// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'

/**
 * Canonical-id namespace for every concept that appears as an endpoint in
 * `concept_xwalks_*.csv`. PR 3a of the IR 8477 fidelity remediation.
 *
 * Each registry row pins a canonical id (e.g. `framework:nist-cswp-39`) to:
 *  - a `display_label` (the human-readable string used in xwalk + popovers),
 *  - a `source_table` + `source_row_id` pair locating the backing record
 *    (library / compliance / timeline / algorithm xref, or empty for
 *    concept_only rows that live solely inside the xwalk),
 *  - a `primary_url` for external deep-linking,
 *  - a coarse `source_type` for visualisation colour-coding.
 *
 * The xwalk migration (PR 3b) will add `from_concept_id` / `to_concept_id`
 * columns whose values reference `concept_id` from this registry.
 */
export type ConceptSourceType =
  | 'framework'
  | 'guidance'
  | 'standard'
  | 'algorithm'
  | 'timeline'
  | 'concept_only'

export interface ConceptRegistryRow {
  conceptId: string
  displayLabel: string
  sourceType: ConceptSourceType
  sourceTable: string
  sourceRowId: string
  primaryUrl: string
  status: 'active' | 'deprecated'
  deprecatedAt: string
  deprecatedReason: string
}

interface RawRow {
  concept_id: string
  display_label: string
  source_type: string
  source_table: string
  source_row_id: string
  primary_url: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

const VALID_SOURCE_TYPES = new Set<string>([
  'framework',
  'guidance',
  'standard',
  'algorithm',
  'timeline',
  'concept_only',
])

const FILENAME_REGEX = /concept_registry_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

const modules = import.meta.glob('./concept_registry_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function transformRow(row: RawRow): ConceptRegistryRow | null {
  if (!row.concept_id || !row.display_label) return null
  const status = (row.status?.trim().toLowerCase() ?? 'active') as 'active' | 'deprecated'
  if (status === 'deprecated') return null
  if (!VALID_SOURCE_TYPES.has(row.source_type)) return null
  return {
    conceptId: row.concept_id,
    displayLabel: row.display_label,
    sourceType: row.source_type as ConceptSourceType,
    sourceTable: row.source_table ?? '',
    sourceRowId: row.source_row_id ?? '',
    primaryUrl: row.primary_url ?? '',
    status,
    deprecatedAt: row.deprecated_at ?? '',
    deprecatedReason: row.deprecated_reason ?? '',
  }
}

const { data: allRows, metadata } = loadLatestCSV<RawRow, ConceptRegistryRow>(
  modules,
  FILENAME_REGEX,
  transformRow
)

/** Active registry rows. */
export const conceptRegistry: ConceptRegistryRow[] = allRows

/**
 * O(1) lookup: canonical concept_id → registry row.
 * Used by the xwalk traversal helper (PR 3b) to resolve canonical ids back
 * to display labels and deep-link targets.
 */
export const conceptByCanonicalId: Map<string, ConceptRegistryRow> = allRows.reduce(
  (map, r) => map.set(r.conceptId, r),
  new Map<string, ConceptRegistryRow>()
)

/**
 * O(1) reverse lookup: (source_table, source_row_id) → canonical concept_id.
 * Used by PR 3c accessors (`conceptIdFor(row)`) on the library / compliance /
 * timeline / algorithm stores so a hub component holding a domain row can
 * find its canonical concept id without walking the registry.
 */
export const conceptIdByStoreKey: Map<string, string> = allRows.reduce((map, r) => {
  if (r.sourceTable && r.sourceRowId) {
    map.set(`${r.sourceTable}:${r.sourceRowId}`, r.conceptId)
  }
  return map
}, new Map<string, string>())

/** Lookup helper for PR 3c store accessors. */
export function conceptIdForStoreKey(sourceTable: string, sourceRowId: string): string | undefined {
  return conceptIdByStoreKey.get(`${sourceTable}:${sourceRowId}`)
}

export const conceptRegistryMetadata = metadata
