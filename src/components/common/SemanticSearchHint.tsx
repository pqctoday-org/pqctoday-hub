// SPDX-License-Identifier: GPL-3.0-only
import { Sparkles } from 'lucide-react'
import type { SemanticSearchMode } from '@/services/search/useSemanticSearch'

/**
 * SemanticSearchHint — small Phase 3 UX affordance.
 *
 * Renders one of three short hints above a search result list, telling
 * the user whether the current results are pure-lexical, semantically
 * supplemented, or whether the embedding runtime is still warming up.
 * Renders nothing when no query is in play.
 */
export function SemanticSearchHint(props: {
  mode: SemanticSearchMode
  loading: boolean
  query: string
  semanticHitCount: number
  /** Optional override for the "results" noun ("frameworks", "products", ...). */
  noun?: string
}) {
  const { mode, loading, query, semanticHitCount, noun = 'related' } = props
  if (!query.trim()) return null

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles size={12} className="animate-pulse text-primary/60" aria-hidden="true" />
        <span>Loading semantic search…</span>
      </div>
    )
  }

  if (mode === 'semantic' && semanticHitCount > 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles size={12} className="text-primary" aria-hidden="true" />
        <span>
          Expanded with semantically <strong className="text-foreground">{noun}</strong> matches
          beyond exact-text hits.
        </span>
      </div>
    )
  }

  // mode === 'lexical' or 'idle' or semantic-but-no-extra-hits.
  return null
}
