// SPDX-License-Identifier: GPL-3.0-only
/**
 * usePatentResults — the shared Explore filter + sort pipeline.
 *
 * Lifted verbatim from PatentsTable so it is the single source of truth for BOTH
 * the table render and the redesign orchestrator (which needs the same ordered
 * list for the live "N of M" count and the detail drawer's prev/next nav). The
 * `pqc` and `fips` filters are additive (used by the redesign's leaderboard / KPI
 * drill-downs); legacy never sets them, so legacy behaviour is unchanged.
 */
import { useMemo } from 'react'
import type { PatentItem } from '@/types/PatentTypes'
import type { SortKey, SortDir } from './PatentsTable'
import { filterPatents } from '@/data/patentFilters'

// Moved verbatim to the pure data/patentFilters module (shared with the phone
// screen); re-exported so existing callers keep importing it from here.
export { filterPatents }

export function sortPatents(
  patents: PatentItem[],
  sortKey: SortKey,
  sortDir: SortDir
): PatentItem[] {
  return [...patents].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'issueDate') cmp = a.issueDate.localeCompare(b.issueDate)
    else if (sortKey === 'priorityDate') cmp = a.priorityDate.localeCompare(b.priorityDate)
    else if (sortKey === 'impactScore') cmp = a.impactScore - b.impactScore
    else if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
    return sortDir === 'asc' ? cmp : -cmp
  })
}

/** Filtered + sorted patents for the active URL filters/sort. Length === count. */
export function usePatentResults(
  patents: PatentItem[],
  params: URLSearchParams,
  sortKey: SortKey,
  sortDir: SortDir
): PatentItem[] {
  return useMemo(
    () => sortPatents(filterPatents(patents, params), sortKey, sortDir),
    [patents, params, sortKey, sortDir]
  )
}
