// SPDX-License-Identifier: GPL-3.0-only
/**
 * Table-view column sort ↔ URL. The page-level `?sort=` (card view: name |
 * country | category | relevance) is reused when the table sort means the
 * same thing — Name A→Z or Country A→Z — so a link keeps its order across
 * views. Every other column / direction goes to `?tsort=<column>` (+
 * `tdir=desc`), which wins over `?sort` while the table is showing.
 */
export type LeadersTableSortKey = 'name' | 'title' | 'organization' | 'country' | 'type'
export type LeadersTableSortDir = 'asc' | 'desc'
export interface LeadersTableSort {
  key: LeadersTableSortKey
  dir: LeadersTableSortDir
}

const TABLE_SORT_KEYS: readonly LeadersTableSortKey[] = [
  'name',
  'title',
  'organization',
  'country',
  'type',
]
/** Table columns whose ascending order is exactly a page `?sort` value. */
const PAGE_SORT_EQUIVALENT: ReadonlySet<LeadersTableSortKey> = new Set(['name', 'country'])

const isTableSortKey = (v: string | null): v is LeadersTableSortKey =>
  v !== null && (TABLE_SORT_KEYS as readonly string[]).includes(v)

export const DEFAULT_LEADERS_TABLE_SORT: LeadersTableSort = { key: 'name', dir: 'asc' }

/** Unknown `tsort` values fall back to `?sort` (when it maps), then Name A→Z. */
export function readLeadersTableSort(params: URLSearchParams): LeadersTableSort {
  const tsort = params.get('tsort')
  if (isTableSortKey(tsort)) {
    return { key: tsort, dir: params.get('tdir') === 'desc' ? 'desc' : 'asc' }
  }
  const sort = params.get('sort')
  if (isTableSortKey(sort) && PAGE_SORT_EQUIVALENT.has(sort)) return { key: sort, dir: 'asc' }
  return DEFAULT_LEADERS_TABLE_SORT
}

/** Returns a new params object for the chosen table sort (write with replace). */
export function writeLeadersTableSort(
  params: URLSearchParams,
  { key, dir }: LeadersTableSort
): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('tsort')
  next.delete('tdir')
  if (dir === 'asc' && PAGE_SORT_EQUIVALENT.has(key)) {
    // Same meaning as the card sort — share it (name is the card default).
    if (key === 'name') next.delete('sort')
    else next.set('sort', key)
  } else {
    next.set('tsort', key)
    if (dir === 'desc') next.set('tdir', 'desc')
  }
  return next
}
