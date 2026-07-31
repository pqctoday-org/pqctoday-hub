// SPDX-License-Identifier: GPL-3.0-only
import { Building2 } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { FilterDropdown } from './FilterDropdown'
import type { FilterDropdownItem } from './FilterDropdown'

export interface SectorOption {
  code: string
  label: string
}

interface SectorFilterProps {
  options?: SectorOption[]
  className?: string
  /** Optional URL-param source override (for the sim embed). Defaults to useSearchParams. */
  params?: URLSearchParams
  setParams?: ReturnType<typeof useSearchParams>[1]
}

/**
 * NAICS 2-digit group labels.
 *
 * DERIVED from src/data/sector_vocabulary_*.csv since 2026-07-31 (WP-0.2) —
 * this used to be a hardcoded object literal, which is why adding a sector was
 * a code change and why four CSWP-39 anchors (Chemical, Critical
 * Manufacturing, Food & Agriculture, Transportation Systems) had no filter at
 * all. Re-exported here so existing importers keep working unchanged.
 */
export { NAICS_LABELS, industryLabel, resolveToNaicsSet } from '@/data/sectorVocabularyData'
import { resolveToNaicsSet, SECTOR_ALIASES_BY_KEY } from '@/data/sectorVocabularyData'

// Only sectors that actually match ≥1 library document. The previously-listed
// '56' Administrative & Support Services and the three PQC-SECTOR-* vendor codes
// matched zero rows (the matcher looks for the code string inside freeform
// industry text, which never contains it) and were removed. SectorFilter.test.ts
// guards against re-introducing a dead option.
export const DEFAULT_SECTOR_OPTIONS: FilterDropdownItem[] = [
  { id: '52', label: 'Finance & Insurance' },
  { id: '92', label: 'Public Administration' },
  { id: '54', label: 'Professional & Technical Services' },
  { id: '51', label: 'Information Technology' },
  { id: '62', label: 'Healthcare & Life Sciences' },
  { id: '22', label: 'Energy & Utilities' },
  { id: '48', label: 'Transportation' },
  { id: '91', label: 'Government & Defense' },
]

/**
 * REMOVED 2026-07-31 (WP-1.1). This hardcoded alias map is now the `aliases`
 * column of src/data/sector_vocabulary_*.csv, reachable via resolveToNaicsSet.
 *
 * It had a real defect worth recording: 'Technology' appeared under BOTH '54'
 * and '51', and the old single-value resolveToNaics returned whichever
 * Object.entries yielded first — so what a deep link meant depended on key
 * order in this literal. The vocabulary now maps 'technology' to both codes
 * explicitly and the resolver returns a set.
 */

export function SectorFilter({
  options,
  className,
  params: paramsProp,
  setParams: setParamsProp,
}: SectorFilterProps) {
  const [urlParams, setUrlParams] = useSearchParams()
  const searchParams = paramsProp ?? urlParams
  const setSearchParams = setParamsProp ?? setUrlParams
  const selected = searchParams.getAll('sector')

  function handleChange(codes: string[]) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('sector')
        for (const c of codes) next.append('sector', c)
        return next
      },
      { replace: true }
    )
  }

  const items: FilterDropdownItem[] = options
    ? options.map((o) => ({ id: o.code, label: o.label }))
    : DEFAULT_SECTOR_OPTIONS

  return (
    <FilterDropdown
      items={items}
      selectedId=""
      onSelect={() => {}}
      multiSelectedIds={selected}
      onMultiSelect={handleChange}
      defaultLabel="All Sectors"
      defaultIcon={<Building2 size={14} className="text-primary" />}
      className={className}
    />
  )
}

/**
 * Resolve a freeform industry string to a single NAICS code.
 *
 * @deprecated 2026-07-31 (WP-1.1) — use `resolveToNaicsSet`, re-exported above.
 *
 * Kept only so nothing breaks mid-migration. Returning ONE code is not a
 * simplification, it is the bug: six aliases legitimately resolve to more than
 * one code, so this collapses a set to whichever element happens to come
 * first. That is what made `?ind=Finance%20%26%20Banking` resolve to '52' and
 * then exact-match to zero rows, none of which were the 12 rows literally
 * tagged "Finance & Banking".
 */
export function resolveToNaics(value: string): string {
  if (!value || value === 'All') return value
  const set = resolveToNaicsSet(value)
  return set.length > 0 ? set[0] : value
}

/** Read sector filter state — returns empty array when unset. Accepts an optional
 *  URLSearchParams override (for the sim embed). */
export function useSectorFilter(paramsOverride?: URLSearchParams): string[] {
  const [urlParams] = useSearchParams()
  return (paramsOverride ?? urlParams).getAll('sector')
}

/** Returns true when value matches any selected sector code (or no sectors selected) */
export function matchesSectorFilter(sectorFilter: string[], values: string | string[]): boolean {
  if (sectorFilter.length === 0) return true
  const arr = Array.isArray(values) ? values : [values]
  return sectorFilter.some((code) => {
    if (code.startsWith('PQC-')) {
      return arr.some((v) => v.toLowerCase().includes(code.toLowerCase()))
    }
    // Match a NAICS 2-digit code against freeform industry strings.
    // Aliases come from the sector vocabulary CSV since 2026-07-31 (WP-1.1);
    // this used to read the hardcoded INDUSTRY_TO_NAICS literal.
    //
    // NOTE this is substring matching, deliberately looser than the compliance
    // facet's exact set match — it serves the LIBRARY page, whose industry
    // fields are still freeform prose rather than a migrated key column.
    const aliases = SECTOR_ALIASES_BY_KEY[code] ?? []
    return arr.some(
      (v) =>
        v === code || aliases.some((alias: string) => v.toLowerCase().includes(alias.toLowerCase()))
    )
  })
}
