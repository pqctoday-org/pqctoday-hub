// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'

/**
 * The curated per-module topic keywords (e.g. "Purdue model" for IoT & OT), loaded on demand.
 *
 * The ~100 KB keyword text stays out of the initial Learn bundle: pass `enabled` once the reader
 * starts a search and the keywords load then. Until they arrive (or if loading fails) the result
 * is null, and searches keep matching on title and description. Shared by the desktop and the
 * phone Browse all catalogues.
 */
export function useModuleTopicKeywords(enabled: boolean): Record<string, string> | null {
  const [keywords, setKeywords] = useState<Record<string, string> | null>(null)
  useEffect(() => {
    if (!enabled || keywords) return
    let cancelled = false
    import('@/data/moduleTopicSummaries')
      .then((m) => {
        if (!cancelled) setKeywords(m.MODULE_TOPIC_KEYWORDS)
      })
      .catch(() => {
        // Keyword enrichment is best-effort; search keeps working on title + description.
      })
    return () => {
      cancelled = true
    }
  }, [enabled, keywords])
  return keywords
}
