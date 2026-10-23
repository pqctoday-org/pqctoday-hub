// SPDX-License-Identifier: AGPL-3.0-only
//
// Filtering the workbench's result rows by status and by evidence class. A run produces
// hundreds of rows; a reader checking one thing (the failures, or only the rows backed by a
// NIST reference sample) should not have to scroll through the rest.
import type { TestResult } from '../../../hsm/acvp/useAcvpSuite'
import type { EvidenceClassId } from '@/data/validation/evidenceClasses'

export type StatusFilter = 'all' | 'pass' | 'fail' | 'skip'
/** An evidence class, 'none' for rows that carry no evidence badge (skips, errors), null = any. */
export type ClassFilter = EvidenceClassId | 'none' | null

export interface ResultFilter {
  status: StatusFilter
  evidenceClass: ClassFilter
}

export const NO_FILTER: ResultFilter = { status: 'all', evidenceClass: null }

export function isFiltered(f: ResultFilter): boolean {
  return f.status !== 'all' || f.evidenceClass !== null
}

/** Row id → the evidence classes its records name ([] = no badge). */
export type RowClasses = ReadonlyMap<string, readonly EvidenceClassId[]>

export function classesByRow(
  results: readonly TestResult[],
  classesOf: (rowId: string) => readonly EvidenceClassId[]
): Map<string, EvidenceClassId[]> {
  const out = new Map<string, EvidenceClassId[]>()
  for (const r of results) out.set(r.id, [...new Set(classesOf(r.id))])
  return out
}

/** How many rows each class covers ('none' = rows without a badge). A row can count under more than one class. */
export function countByClass(rowClasses: RowClasses): Map<EvidenceClassId | 'none', number> {
  const out = new Map<EvidenceClassId | 'none', number>()
  for (const classes of rowClasses.values()) {
    for (const c of classes.length > 0 ? classes : (['none'] as const)) {
      out.set(c, (out.get(c) ?? 0) + 1)
    }
  }
  return out
}

/**
 * The rows to show. With no filter this is the same array (no copy while rows stream in).
 * `rowClasses` is null while a run is still streaming: the class filter is then not applied.
 */
export function applyResultFilter(
  results: readonly TestResult[],
  filter: ResultFilter,
  rowClasses: RowClasses | null
): readonly TestResult[] {
  if (!isFiltered(filter)) return results
  const wantClass = filter.evidenceClass
  return results.filter((r) => {
    if (filter.status !== 'all' && r.status !== filter.status) return false
    if (wantClass === null || rowClasses === null) return true
    const classes = rowClasses.get(r.id) ?? []
    return wantClass === 'none' ? classes.length === 0 : classes.includes(wantClass)
  })
}
