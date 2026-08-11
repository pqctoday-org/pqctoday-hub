// SPDX-License-Identifier: GPL-3.0-only
/**
 * "What changed since you last looked" — scoped to the reader's own obligations.
 *
 * Re-homes the `ContentUpdatesFeed` that used to sit in the About-this-page
 * strip. That feed listed the five most recent compliance data changes whether
 * or not any of them touched a row the reader cares about. Here the same
 * revisions are intersected with the register, so the line either names the
 * reader's affected obligations or says plainly that none were affected.
 *
 * Depends on `record_ids` resolving to catalogue ids. Verified 2026-08-10: the
 * compliance domain carries 8 distinct record ids and all 8 match the current
 * catalogue. That is not true of every domain — the timeline domain shipped
 * with 0/278 resolving — so `matched` being empty is a fact worth rendering,
 * never a reason to hide the line.
 */
import type { RevisionEntry } from '@/hooks/useRevisions'
import type { ObligationRow } from './obligationsModel'

export interface RecentChangeSummary {
  /** ISO timestamp of the most recent recorded compliance change. */
  changedAt: string | null
  /** Obligations in the reader's scope that those revisions touched. */
  matched: { id: string; label: string }[]
  /** True when a compliance revision exists at all. */
  hasHistory: boolean
}

export function summarizeRecentChanges(
  revisions: RevisionEntry[],
  rows: ObligationRow[]
): RecentChangeSummary {
  const compliance = revisions.filter((r) => r.domain === 'compliance')
  if (compliance.length === 0) {
    return { changedAt: null, matched: [], hasHistory: false }
  }

  // Newest first — the file is append-ordered, so sort rather than assume.
  const sorted = [...compliance].sort((a, b) => b.merge_timestamp.localeCompare(a.merge_timestamp))
  const changedAt = sorted[0]?.merge_timestamp ?? null

  const touched = new Set<string>()
  for (const revision of compliance) {
    for (const id of revision.record_ids ?? []) touched.add(id)
  }

  const seen = new Set<string>()
  const matched: { id: string; label: string }[] = []
  for (const row of rows) {
    if (!touched.has(row.framework.id) || seen.has(row.framework.id)) continue
    seen.add(row.framework.id)
    matched.push({ id: row.framework.id, label: row.framework.label })
  }

  return { changedAt, matched, hasHistory: true }
}

/** Renders the ISO timestamp as a plain date. Returns null for unusable input. */
export function formatChangeDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
