// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'

/**
 * Maps a published cryptographic standard to the concrete parameter sets it
 * specifies. Sits OUTSIDE the IR 8477 concept-xwalk because the `implements`
 * relationship is auxiliary metadata, not part of the IR 8477 closed
 * vocabulary (see trust-engine-explainability.md §3.1, §3.4 footnote).
 *
 * Each row: one (standard, param-set) pair.
 *  - is_default: the canonical default this standard recommends for general
 *    use. Used by visualisations that want to render only the "headline"
 *    parameter set per standard (e.g. D3 worked example).
 */
export type AlgoFamily = 'KEM' | 'DSA' | 'HBS'

export interface StandardImplementsAlgoXref {
  xrefId: string
  standardId: string
  paramSet: string
  family: AlgoFamily
  isDefault: boolean
  status: 'active' | 'deprecated'
  deprecatedAt: string
  deprecatedReason: string
}

interface RawRow {
  xref_id: string
  standard_id: string
  param_set: string
  family: string
  is_default: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

const VALID_FAMILIES = new Set<string>(['KEM', 'DSA', 'HBS'])

const FILENAME_REGEX = /standard_implements_algo_xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

const modules = import.meta.glob('./standard_implements_algo_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function transformRow(row: RawRow): StandardImplementsAlgoXref | null {
  if (!row.xref_id || !row.standard_id || !row.param_set) return null
  const status = (row.status?.trim().toLowerCase() ?? 'active') as 'active' | 'deprecated'
  if (status === 'deprecated') return null
  if (!VALID_FAMILIES.has(row.family)) return null
  return {
    xrefId: row.xref_id,
    standardId: row.standard_id,
    paramSet: row.param_set,
    family: row.family as AlgoFamily,
    isDefault: (row.is_default ?? '').trim().toLowerCase() === 'yes',
    status,
    deprecatedAt: row.deprecated_at ?? '',
    deprecatedReason: row.deprecated_reason ?? '',
  }
}

const { data: allRows, metadata } = loadLatestCSV<RawRow, StandardImplementsAlgoXref>(
  modules,
  FILENAME_REGEX,
  transformRow
)

/** Every (standard, param-set) implementation pair. */
export const standardImplementsAlgoXref: StandardImplementsAlgoXref[] = allRows

/** O(1) lookup: standard_id → param-sets it implements. */
export const paramSetsByStandard: Map<string, StandardImplementsAlgoXref[]> = allRows.reduce(
  (map, row) => {
    const existing = map.get(row.standardId)
    if (existing) existing.push(row)
    else map.set(row.standardId, [row])
    return map
  },
  new Map<string, StandardImplementsAlgoXref[]>()
)

/** O(1) reverse lookup: param_set → the standard that specifies it. */
export const standardByParamSet: Map<string, StandardImplementsAlgoXref> = allRows.reduce(
  (map, row) => {
    map.set(row.paramSet, row)
    return map
  },
  new Map<string, StandardImplementsAlgoXref>()
)

export const standardImplementsAlgoXrefMetadata = metadata

/**
 * Canonical concept_id for an algorithm parameter set — PR 3c. Resolves via
 * the concept_registry by (source_table, source_row_id) where source_row_id
 * is the canonical param_set string (e.g. `ML-KEM-768`).
 */
import { conceptIdForStoreKey } from './conceptRegistry'
export function conceptIdForParamSet(paramSet: string): string | undefined {
  return conceptIdForStoreKey('standard_implements_algo_xref', paramSet)
}
