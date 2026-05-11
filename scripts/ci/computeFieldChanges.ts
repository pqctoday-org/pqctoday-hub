// SPDX-License-Identifier: GPL-3.0-only
/**
 * computeFieldChanges — pure function used by append-revision.ts to populate
 * the per-cell `field_changes` payload on a revision entry.
 *
 * Given two parsed CSV row sets (before / after) and a primary-key column,
 * produces one entry per changed cell. List-typed columns are emitted as
 * raw before/after strings — `RevisionDrilldownPanel` does the token-level
 * rendering via `src/utils/listDiff.ts`.
 *
 * Pure, no I/O. The caller is responsible for parsing CSVs and locating
 * the before-version (typically: previous dated file matched by domain prefix).
 */

export interface FieldChange {
  record_id: string
  field: string
  before: string | null
  after: string | null
}

/**
 * Maps revision `domain` → CSV primary-key column. Add new entries as new
 * domains gain revisions. Unmapped domains return no field_changes
 * (caller should treat as best-effort: omit the field rather than error).
 */
export const DOMAIN_TO_PK_COLUMN: Record<string, string> = {
  library: 'referenceId',
  compliance: 'id',
  threats: 'threat_id',
  timeline: 'Title',
  migrate: 'product_id',
  vendors: 'vendor_id',
  leaders: 'Name',
  algorithms: 'algorithmId',
}

/**
 * Maps revision `domain` → CSV filename prefix. Used by the CI script to
 * locate the before/after files via `git diff --name-only`.
 */
export const DOMAIN_TO_CSV_PREFIX: Record<string, string> = {
  library: 'library_',
  compliance: 'compliance_',
  threats: 'quantum_threats_hsm_industries_',
  timeline: 'timeline_',
  migrate: 'pqc_product_catalog_',
  vendors: 'vendors_',
  leaders: 'leaders_',
  algorithms: 'pqc_complete_algorithm_reference_',
}

export interface DiffOptions {
  /** Cap on emitted field_changes — keeps revisions.jsonl line size bounded. */
  maxChanges?: number
  /** Skip these columns even if their values differ (e.g. version-stamp cells). */
  skipFields?: ReadonlySet<string>
}

const DEFAULT_SKIP_FIELDS: ReadonlySet<string> = new Set([
  // Columns that vary every dated copy without representing a real change.
])

/**
 * Compute per-cell changes across two parsed-CSV row sets.
 *
 * Cells are compared as trimmed strings; whitespace-only differences are not
 * emitted. New rows (in `after` but not in `before`) emit one FieldChange per
 * non-empty cell with `before: null`. Removed rows (in `before` but not in
 * `after`) emit one FieldChange per cell with `after: null`.
 */
export function computeFieldChanges(
  before: ReadonlyArray<Record<string, string>>,
  after: ReadonlyArray<Record<string, string>>,
  pkColumn: string,
  opts: DiffOptions = {}
): FieldChange[] {
  const skip = opts.skipFields ?? DEFAULT_SKIP_FIELDS
  const cap = opts.maxChanges ?? 1000

  const beforeMap = new Map<string, Record<string, string>>()
  for (const row of before) {
    const id = (row[pkColumn] ?? '').trim()
    if (id) beforeMap.set(id, row)
  }
  const afterMap = new Map<string, Record<string, string>>()
  for (const row of after) {
    const id = (row[pkColumn] ?? '').trim()
    if (id) afterMap.set(id, row)
  }

  const changes: FieldChange[] = []
  const ids = new Set<string>([...beforeMap.keys(), ...afterMap.keys()])

  for (const id of ids) {
    if (changes.length >= cap) break
    const b = beforeMap.get(id)
    const a = afterMap.get(id)

    if (!b && a) {
      // Added row — emit one entry per non-empty cell
      for (const [field, value] of Object.entries(a)) {
        if (skip.has(field)) continue
        if (field === pkColumn) continue
        const trimmed = (value ?? '').trim()
        if (!trimmed) continue
        changes.push({ record_id: id, field, before: null, after: trimmed })
        if (changes.length >= cap) break
      }
      continue
    }

    if (b && !a) {
      // Removed row
      for (const [field, value] of Object.entries(b)) {
        if (skip.has(field)) continue
        if (field === pkColumn) continue
        const trimmed = (value ?? '').trim()
        if (!trimmed) continue
        changes.push({ record_id: id, field, before: trimmed, after: null })
        if (changes.length >= cap) break
      }
      continue
    }

    if (!b || !a) continue

    // Modified row — diff each cell
    const fields = new Set<string>([...Object.keys(b), ...Object.keys(a)])
    for (const field of fields) {
      if (skip.has(field)) continue
      if (field === pkColumn) continue
      const beforeVal = (b[field] ?? '').trim()
      const afterVal = (a[field] ?? '').trim()
      if (beforeVal === afterVal) continue
      changes.push({
        record_id: id,
        field,
        before: beforeVal === '' ? null : beforeVal,
        after: afterVal === '' ? null : afterVal,
      })
      if (changes.length >= cap) break
    }
  }

  return changes
}
