// SPDX-License-Identifier: GPL-3.0-only

import { useState, useEffect } from 'react'
import type MiniSearch from 'minisearch'
import { buildKnowledgeGraph } from '../data/graphBuilder'
import { buildSearchIndex } from '../data/searchIndex'
import type { KnowledgeGraph, GraphNode } from '../data/graphTypes'

interface UseGraphDataResult {
  graph: KnowledgeGraph | null
  searchIndex: MiniSearch<GraphNode> | null
  loading: boolean
  error: string | null
}

export function useGraphData(): UseGraphDataResult {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null)
  const [searchIndex, setSearchIndex] = useState<MiniSearch<GraphNode> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Defer to next tick so the panel renders first, then build asynchronously.
    // No initialized guard — React Strict Mode mounts twice; the cleanup cancels
    // the first timer and the second invocation fires correctly.
    const timer = setTimeout(async () => {
      try {
        const g = await buildKnowledgeGraph()
        const idx = buildSearchIndex(g.nodes)
        setGraph(g)
        setSearchIndex(idx)
        setLoading(false)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to build knowledge graph'
        setError(message)
        setLoading(false)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  return { graph, searchIndex, loading, error }
}
