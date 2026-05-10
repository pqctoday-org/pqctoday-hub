// SPDX-License-Identifier: GPL-3.0-only
/**
 * useSemanticSearch — Phase 3 user-facing semantic search hook.
 *
 * Wraps the Phase 1 `cosineSearch` primitive for in-page search inputs
 * across the hub. Each consumer page passes its collection (e.g.
 * `'library'`) and the current query; the hook returns a ranked list of
 * resource IDs the page can use to re-rank or supplement its existing
 * lexical filter.
 *
 * Design choices:
 *   - Debounced (250 ms) so we don't re-encode on every keystroke.
 *   - Lexical fallback: when the embedding runtime is unavailable (still
 *     loading, missing artifact, init failed) the hook returns
 *     `mode: 'lexical'`. Callers should keep their existing substring
 *     filter as the floor — semantic is an enhancement, not a
 *     replacement.
 *   - Empty query → `mode: 'idle'`. No work performed.
 *   - The hook does not load the corpus itself — it reads the chunk-pool
 *     from `UnifiedSearchService` (one corpus per session, shared with
 *     ⌘K and the Assistant).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { cosineSearch, isEmbeddingRuntimeReady, initEmbeddingRuntime } from './embeddingRetrieval'
import { chunkToResource } from './chunkToResource'
import { UnifiedSearchService } from './UnifiedSearchService'
import type { RAGChunk } from '@/types/ChatTypes'

export type SemanticSearchMode = 'semantic' | 'lexical' | 'idle' | 'loading'

export type SemanticCollection =
  | 'library'
  | 'migrate'
  | 'compliance'
  | 'threats'
  | 'timeline'
  | 'leaders'
  | 'patents'
  | 'algorithms'
  | 'assessment'

export interface SemanticHit {
  /** Resource ID per chunkToResource — page-specific key (referenceId, threatId, etc.) */
  id: string
  /** Cosine similarity in [0, 1]; higher is more relevant. */
  score: number
}

export interface UseSemanticSearchResult {
  hits: SemanticHit[]
  mode: SemanticSearchMode
  loading: boolean
}

export interface UseSemanticSearchOptions {
  /** Top-K to return. Default 50 — enough to re-rank a visible page. */
  limit?: number
  /** Override debounce in ms (default 250). */
  debounceMs?: number
  /** Disable semantic search entirely (forces 'lexical' mode). */
  disabled?: boolean
}

/** Map a collection name to the chunk `source` values that contribute. */
function chunkSourcesFor(collection: SemanticCollection): Set<string> {
  // Most collections map 1:1, but a few combine related corpora so a
  // search in /library can find related enrichment chunks too.
  switch (collection) {
    case 'library':
      return new Set(['library', 'document-enrichment'])
    case 'migrate':
      return new Set(['migrate'])
    case 'compliance':
      return new Set(['compliance', 'certifications'])
    case 'threats':
      return new Set(['threats'])
    case 'timeline':
      return new Set(['timeline'])
    case 'leaders':
      return new Set(['leaders'])
    case 'patents':
      return new Set(['patents'])
    case 'algorithms':
      return new Set(['algorithms'])
    case 'assessment':
      return new Set(['assessment'])
  }
}

/** Read chunk IDs by source from UnifiedSearchService (no extra fetch). */
function candidateChunkIds(sources: Set<string>): string[] {
  const svc = UnifiedSearchService.getInstance()
  if (!svc.isReady) return []
  const ids: string[] = []
  for (const c of svc.corpus) {
    if (sources.has(c.source)) ids.push(c.id)
  }
  return ids
}

/**
 * Resolve a chunk → page-level resource ID. For collections where the
 * resource ID is the chunk's own metadata (library.referenceId, etc.)
 * we use `chunkToResource`. For pages that key by chunk title or other
 * field, callers can supply their own mapping by calling
 * `mapHitToResourceId` on the results — but the default covers all
 * Phase 3 collections.
 */
function hitToResourceId(chunk: RAGChunk | undefined): string | null {
  if (!chunk) return null
  // chunkToResource handles all the Phase 3 collections (library,
  // migrate, compliance, threats, timeline, leaders, algorithms,
  // document-enrichment) — see chunkToResource.ts.
  const ref = chunkToResource(chunk)
  if (ref) return ref.resourceId
  // Patents aren't a scored resource type — fall back to chunk title.
  if (chunk.source === 'patents') {
    const v = (chunk.metadata as { patentNumber?: string } | undefined)?.patentNumber
    return v ?? chunk.title
  }
  return null
}

/**
 * Phase 3 — semantic search hook.
 *
 * Returns ranked hits filtered by collection. Consumers should treat the
 * return value as an *enhancement* over their existing lexical filter:
 * - When `mode === 'semantic'`, re-rank or supplement the lexical
 *   results by these IDs.
 * - When `mode === 'lexical' | 'idle' | 'loading'`, ignore `hits` and
 *   render the page's existing lexical filter unchanged.
 */
export function useSemanticSearch(
  collection: SemanticCollection,
  query: string,
  opts: UseSemanticSearchOptions = {}
): UseSemanticSearchResult {
  const { limit = 50, debounceMs = 250, disabled = false } = opts
  const [hits, setHits] = useState<SemanticHit[]>([])
  const [mode, setMode] = useState<SemanticSearchMode>('idle')
  const [loading, setLoading] = useState(false)
  const runId = useRef(0)

  // Pre-compute the chunk source set once per collection.
  const sources = useMemo(() => chunkSourcesFor(collection), [collection])

  useEffect(() => {
    if (disabled) {
      setMode('lexical')
      setHits([])
      return
    }
    const trimmed = query.trim()
    if (trimmed.length === 0) {
      setMode('idle')
      setHits([])
      setLoading(false)
      return
    }

    let cancelled = false
    const myRun = ++runId.current
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        // Kick off runtime init lazily if not ready (no-op if already ready).
        // initEmbeddingRuntime throws/rejects on failure → we catch below
        // and fall back to 'lexical'.
        if (!isEmbeddingRuntimeReady()) {
          await initEmbeddingRuntime()
        }
        if (cancelled || myRun !== runId.current) return
        const candidateIds = candidateChunkIds(sources)
        if (candidateIds.length === 0) {
          setMode('lexical')
          setHits([])
          return
        }
        const cosineHits = await cosineSearch(trimmed, {
          candidateIds,
          k: limit,
        })
        if (cancelled || myRun !== runId.current) return
        const svc = UnifiedSearchService.getInstance()
        const ranked: SemanticHit[] = []
        const seen = new Set<string>()
        for (const h of cosineHits) {
          const chunk = svc.corpusById.get(h.chunkId)
          const id = hitToResourceId(chunk)
          if (!id || seen.has(id)) continue
          seen.add(id)
          ranked.push({ id, score: h.score })
        }
        setHits(ranked)
        setMode('semantic')
      } catch {
        // Runtime init or cosine search failed — caller falls back to lexical.
        if (!cancelled && myRun === runId.current) {
          setMode('lexical')
          setHits([])
        }
      } finally {
        if (!cancelled && myRun === runId.current) {
          setLoading(false)
        }
      }
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, sources, limit, debounceMs, disabled])

  return { hits, mode, loading }
}
