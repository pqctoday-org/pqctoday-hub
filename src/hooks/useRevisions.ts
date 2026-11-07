// SPDX-License-Identifier: AGPL-3.0-only
/**
 * useRevisions — loads and parses /data/revisions.jsonl at app startup.
 * Returns RevisionEntry[] sorted by merge_timestamp descending.
 * Successful loads are cached in module scope; failed loads can be retried.
 */

import { useEffect, useSyncExternalStore } from 'react'
import { reviewerDisplay } from '@/data/reviewerDisplay'

/**
 * Per-record field-level change. Optional — populated for record-scoped revisions
 * (manual_data_correction, xref_edge_change). Bulk enrichment batches typically
 * carry no field_changes. Existing revisions predating this field have no entry.
 */
export interface FieldChange {
  /** Record ID — should appear in the parent revision's `record_ids` array. */
  record_id: string
  /** CSV column name. List-typed columns (LIST_COLUMNS in utils/listDiff) render token-by-token. */
  field: string
  before: string | null
  after: string | null
}

export interface RevisionEntry {
  pr_number: number
  merge_sha: string
  merge_timestamp: string
  change_type: string
  domain: string
  scope_summary: string
  rows_affected: number | null
  module_id: string | null
  tool_id: string | null
  /** Explicit list of affected record IDs — populated by maintenance/emit_revision.py. */
  record_ids?: string[]
  /** Per-cell before/after diff for record-scoped changes. Optional. */
  field_changes?: FieldChange[]
  reviewer_id: string
  reviewer_display: string
  approval_method: 'github' | 'offline'
  approved_via: string | null
  proxy_github_handle: string | null
  authored_by_llm: boolean
  confidence_delta: number | null
  sample_size?: number
}

// Share successful records and loading/retry transitions across mounted consumers.
let cachedRevisions: RevisionEntry[] | null = null
let fetchPromise: Promise<RevisionEntry[]> | null = null
interface RevisionLoadState {
  revisions: RevisionEntry[]
  isLoading: boolean
  error: string | null
}
let loadState: RevisionLoadState = { revisions: [], isLoading: true, error: null }
const listeners = new Set<() => void>()
const getLoadState = () => loadState
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function publish(next: RevisionLoadState) {
  loadState = next
  for (const listener of listeners) listener()
}

function loadRevisions(): Promise<RevisionEntry[]> {
  if (cachedRevisions !== null) return Promise.resolve(cachedRevisions)
  if (fetchPromise) return fetchPromise
  publish({ ...loadState, isLoading: true, error: null })
  // Defer the request so even a synchronous fetch failure releases the same
  // shared in-flight promise; no failed request becomes a successful empty cache.
  fetchPromise = Promise.resolve()
    .then(async () => {
      try {
        const res = await fetch('/data/revisions.jsonl')
        if (!res.ok) throw new Error('Revision request failed')
        const text = await res.text()
        const entries: RevisionEntry[] = text
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => {
            try {
              return JSON.parse(line) as RevisionEntry
            } catch {
              return null
            }
          })
          .filter((e): e is RevisionEntry => e !== null)
          .map((e) => ({ ...e, reviewer_display: reviewerDisplay(e.reviewer_display) }))

        // Sort descending by merge_timestamp
        entries.sort((a, b) => b.merge_timestamp.localeCompare(a.merge_timestamp))

        cachedRevisions = entries
        publish({ revisions: entries, isLoading: false, error: null })
        return entries
      } catch {
        publish({ revisions: [], isLoading: false, error: 'Revision history could not be loaded.' })
        return []
      }
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

// ── Pure filter helpers (usable outside React) ───────────────────────────────

/** Filter revisions to a specific domain. */
export function byDomain(revisions: RevisionEntry[], domain: string): RevisionEntry[] {
  return revisions.filter((r) => r.domain === domain)
}

/**
 * Filter revisions to a specific record within a domain.
 * Uses `record_ids` array when present; falls back to scope_summary substring match.
 * For module/tool domains, matches on `module_id`/`tool_id` fields.
 */
export function byRecord(
  revisions: RevisionEntry[],
  domain: string,
  recordId: string
): RevisionEntry[] {
  return revisions.filter((r) => {
    if (r.domain !== domain) return false
    // Preferred: explicit record_ids array
    if (r.record_ids && r.record_ids.length > 0) return r.record_ids.includes(recordId)
    // Module / tool domain: dedicated ID fields
    if (domain === 'module' && r.module_id) return r.module_id === recordId
    if (domain === 'tool' && r.tool_id) return r.tool_id === recordId
    // Fallback: substring match in scope_summary (brittle, but works until record_ids ships)
    return r.scope_summary.includes(recordId)
  })
}

// ── React hook ───────────────────────────────────────────────────────────────

interface UseRevisionsResult {
  revisions: RevisionEntry[]
  isLoading: boolean
  error: string | null
  retry: () => void
  /** Convenience: filter by domain */
  byDomain: (domain: string) => RevisionEntry[]
  /** Convenience: filter by domain + record ID */
  byRecord: (domain: string, recordId: string) => RevisionEntry[]
}

export function useRevisions(): UseRevisionsResult {
  const state = useSyncExternalStore(subscribe, getLoadState, getLoadState)
  useEffect(() => {
    if (cachedRevisions === null && !getLoadState().error) void loadRevisions()
  }, [])
  return {
    revisions: state.revisions,
    isLoading: state.isLoading,
    error: state.error,
    retry: () => {
      void loadRevisions()
    },
    byDomain: (domain: string) => byDomain(state.revisions, domain),
    byRecord: (domain: string, recordId: string) => byRecord(state.revisions, domain, recordId),
  }
}
