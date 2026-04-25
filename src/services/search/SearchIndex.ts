// SPDX-License-Identifier: GPL-3.0-only
/**
 * SearchIndex — ⌘K palette facade over UnifiedSearchService.
 *
 * Backwards-compatible export surface (`getSearchIndex`, `search`,
 * `invalidateSearchCache`, types) is preserved; all heavy lifting now lives
 * in UnifiedSearchService so ⌘K and the PQC Assistant share one MiniSearch
 * instance, one entityIndex, and one cached corpus load.
 */
import type MiniSearch from 'minisearch'
import { UnifiedSearchService } from './UnifiedSearchService'
import type { RAGChunk } from '@/types/ChatTypes'

export interface SearchChunk {
  id: string
  source: string
  title: string
  content: string
  category?: string
  deepLink?: string
  priority?: number
  metadata?: Record<string, unknown>
}

export interface SearchResult extends SearchChunk {
  score: number
  match: Record<string, string[]>
}

let buildPromise: Promise<void> | null = null

/** Pre-load the index on first ⌘K open. Subsequent calls resolve immediately. */
export function getSearchIndex(): Promise<MiniSearch<RAGChunk>> {
  if (UnifiedSearchService.getInstance().isReady && UnifiedSearchService.getInstance().index) {
    return Promise.resolve(UnifiedSearchService.getInstance().index)
  }
  if (!buildPromise) {
    buildPromise = UnifiedSearchService.getInstance()
      .loadCached()
      .finally(() => {
        buildPromise = null
      })
  }
  return buildPromise.then(() => {
    if (!UnifiedSearchService.getInstance().index) {
      throw new Error('SearchIndex: failed to initialize')
    }
    return UnifiedSearchService.getInstance().index
  })
}

/** Invalidate cache + force rebuild (e.g., after corpus update). */
export async function invalidateSearchCache(): Promise<void> {
  await UnifiedSearchService.getInstance().invalidateCache()
  buildPromise = null
}

export async function search(
  query: string,
  opts?: { limit?: number; sources?: string[] }
): Promise<SearchResult[]> {
  await getSearchIndex()
  return UnifiedSearchService.getInstance().searchPalette(query, opts) as SearchResult[]
}
