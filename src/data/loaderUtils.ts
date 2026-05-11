// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared loader utilities for the DS01 status-column schema.
 *
 * See: pqctoday-priv/docs/platform/data/csv-status-schema.md
 *
 * Every record-bearing CSV in src/data/ adds three columns:
 *   - status: 'active' | 'deprecated' | 'obsolete'
 *   - deprecated_at: ISO date or empty
 *   - deprecated_reason: free text or empty
 *
 * Loaders consume rows via filterActive() so deprecated/obsolete records
 * are excluded from normal use. Cross-reference resolvers and audit views
 * use partitionByStatus() to access both sets.
 *
 * Backwards-compatible: rows without a status column are treated as active.
 */

export interface RowWithStatus {
  status?: 'active' | 'deprecated' | 'obsolete' | string
  deprecated_at?: string
  deprecated_reason?: string
}

/** Return only rows with status='active' (or no status column = pre-DS01). */
export function filterActive<T extends RowWithStatus>(rows: T[]): T[] {
  return rows.filter((r) => !r.status || r.status === 'active')
}

/** Partition rows into active vs (deprecated + obsolete). */
export function partitionByStatus<T extends RowWithStatus>(
  rows: T[]
): { active: T[]; deprecated: T[] } {
  const active: T[] = []
  const deprecated: T[] = []
  for (const r of rows) {
    if (!r.status || r.status === 'active') active.push(r)
    else deprecated.push(r)
  }
  return { active, deprecated }
}

/** True iff a row has a status indicating it is no longer active. */
export function isDeprecated(r: RowWithStatus): boolean {
  return !!r.status && r.status !== 'active'
}
