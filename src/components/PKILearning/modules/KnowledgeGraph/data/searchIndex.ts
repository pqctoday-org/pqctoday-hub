// SPDX-License-Identifier: GPL-3.0-only

import MiniSearch from 'minisearch'
import type { GraphNode } from './graphTypes'

export interface SearchResult {
  id: string
  label: string
  entityType: string
  description?: string
  connectionCount: number
  score: number
}

export function buildSearchIndex(nodes: Map<string, GraphNode>): MiniSearch<GraphNode> {
  const index = new MiniSearch<GraphNode>({
    fields: ['label', 'description', 'entityType'],
    storeFields: ['id', 'label', 'entityType', 'description', 'connectionCount'],
    idField: 'id',
  })

  const items = Array.from(nodes.values()).map((node) => ({
    ...node,
    description: node.description ?? '',
  }))

  index.addAll(items)
  return index
}

export function searchGraph(
  index: MiniSearch<GraphNode>,
  query: string,
  limit: number = 20
): SearchResult[] {
  if (!query.trim()) return []

  const results = index
    .search(query, {
      boost: { label: 3, description: 1, entityType: 0.5 },
      prefix: true,
      fuzzy: 0.2,
    })
    .slice(0, limit)
  return results.map((r) => ({
    id: r.id,
    label: r.label as string,
    entityType: r.entityType as string,
    description: r.description as string | undefined,
    connectionCount: r.connectionCount as number,
    score: r.score,
  }))
}
