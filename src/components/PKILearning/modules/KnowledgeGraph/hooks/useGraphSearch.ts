// SPDX-License-Identifier: GPL-3.0-only

import { useState, useMemo } from 'react'
import type MiniSearch from 'minisearch'
import { searchGraph, type SearchResult } from '../data/searchIndex'
import type { GraphNode } from '../data/graphTypes'

interface UseGraphSearchResult {
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
}

export function useGraphSearch(searchIndex: MiniSearch<GraphNode> | null): UseGraphSearchResult {
  const [query, setQuery] = useState('')

  // MiniSearch on ~1500 nodes is sub-millisecond — compute synchronously via
  // useMemo rather than deferring to a debounced effect.
  const results = useMemo<SearchResult[]>(() => {
    if (!searchIndex || !query.trim()) return []
    return searchGraph(searchIndex, query, 20)
  }, [searchIndex, query])

  return { query, setQuery, results }
}
