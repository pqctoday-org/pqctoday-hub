// SPDX-License-Identifier: GPL-3.0-only
import type { RevisionEntry } from '@/hooks/useRevisions'

/**
 * Stable partition for the /revisions feed: priority-domain entries first,
 * non-priority entries after. Within each partition the input order is
 * preserved (chronological, newest-first, as useRevisions delivers them).
 *
 * Used by GlobalRevisionsFeed to implement persona-aware ranking per the
 * trust-engine explainability doc §9.3. Extracted as a pure helper so the
 * sort behaviour can be unit-tested without React rendering, and so the
 * component file's fast-refresh contract (components-only exports) holds.
 */
export function applyPersonaSort(
  entries: RevisionEntry[],
  priorityDomains: readonly string[]
): RevisionEntry[] {
  if (priorityDomains.length === 0) return entries
  const priority = new Set(priorityDomains)
  const head: RevisionEntry[] = []
  const tail: RevisionEntry[] = []
  for (const r of entries) (priority.has(r.domain) ? head : tail).push(r)
  return [...head, ...tail]
}
