// SPDX-License-Identifier: GPL-3.0-only
/**
 * useRevisions — loads and parses /data/revisions.jsonl at app startup.
 * Returns RevisionEntry[] sorted by merge_timestamp descending.
 * Cached in module scope (one fetch per app session).
 */

import { useState, useEffect } from 'react'

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
  reviewer_id: string
  reviewer_display: string
  approval_method: 'github' | 'offline'
  approved_via: string | null
  authored_by_llm: boolean
  confidence_delta: number | null
}

// Module-scope cache — shared across all hook consumers in the same session
let cachedRevisions: RevisionEntry[] | null = null
let fetchPromise: Promise<RevisionEntry[]> | null = null

async function loadRevisions(): Promise<RevisionEntry[]> {
  if (cachedRevisions !== null) return cachedRevisions
  if (fetchPromise) return fetchPromise

  fetchPromise = (async () => {
    try {
      const res = await fetch('/data/revisions.jsonl')
      if (!res.ok) {
        cachedRevisions = []
        return []
      }
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

      // Sort descending by merge_timestamp
      entries.sort((a, b) => b.merge_timestamp.localeCompare(a.merge_timestamp))

      cachedRevisions = entries
      return entries
    } catch {
      cachedRevisions = []
      return []
    }
  })()

  return fetchPromise
}

interface UseRevisionsResult {
  revisions: RevisionEntry[]
  isLoading: boolean
}

export function useRevisions(): UseRevisionsResult {
  const [revisions, setRevisions] = useState<RevisionEntry[]>(cachedRevisions ?? [])
  const [isLoading, setIsLoading] = useState(cachedRevisions === null)

  useEffect(() => {
    // Cache hit: initial state already holds the data — no setState needed
    if (cachedRevisions !== null) return

    let cancelled = false
    loadRevisions().then((entries) => {
      if (!cancelled) {
        setRevisions(entries)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { revisions, isLoading }
}
