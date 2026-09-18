// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type {
  ForceClusterGraph,
  ForceClusterNode,
  ForceClusterNodeType,
} from '@/data/forceClusterGraph'
import {
  buildVisibleSubgraph,
  filterNodes,
  rankVisibleNodes,
  subCategoriesOf,
  subKey,
  type GraphFilters,
} from './graphFilters'

let seq = 0
const node = (type: ForceClusterNodeType, sub: string, degree: number): ForceClusterNode =>
  ({
    id: `${type}-${sub}-${degree}-${seq++}`,
    label: `${type} ${sub} ${degree}`,
    type,
    sub,
    degree,
  }) as ForceClusterNode

const graph = (nodes: ForceClusterNode[], edges: [string, string][] = []): ForceClusterGraph =>
  ({
    nodes,
    edges: edges.map(([from, to]) => ({ from, to, rel: 'test' })),
  }) as ForceClusterGraph

const filters = (over: Partial<GraphFilters> = {}): GraphFilters => ({
  enabledTypes: new Set<ForceClusterNodeType>(['standard', 'patent', 'glossary']),
  disabledSubs: new Set(),
  maxNodes: 100,
  ...over,
})

describe('rankVisibleNodes', () => {
  it('shares the budget round-robin across categories instead of letting one dominate', () => {
    // 10 high-degree patents vs 3 low-degree glossary terms: a global cut of 6 would be all patents.
    const patents = Array.from({ length: 10 }, (_, i) => node('patent', 'IoT', 100 - i))
    const glossary = Array.from({ length: 3 }, (_, i) => node('glossary', 'concept', 1 + i))
    const picked = rankVisibleNodes(graph([...patents, ...glossary]), filters({ maxNodes: 6 }))
    const byType = picked.reduce<Record<string, number>>((acc, n) => {
      acc[n.type] = (acc[n.type] ?? 0) + 1
      return acc
    }, {})
    expect(byType).toEqual({ patent: 3, glossary: 3 })
  })

  it('hands a small category’s unused share back to the others', () => {
    const patents = Array.from({ length: 10 }, (_, i) => node('patent', 'IoT', 100 - i))
    const glossary = [node('glossary', 'concept', 1)]
    const picked = rankVisibleNodes(graph([...patents, ...glossary]), filters({ maxNodes: 6 }))
    expect(picked.filter((n) => n.type === 'glossary')).toHaveLength(1)
    expect(picked.filter((n) => n.type === 'patent')).toHaveLength(5)
  })

  it('takes each category’s most-connected nodes first', () => {
    const nodes = [
      node('standard', 'RFC', 1),
      node('standard', 'RFC', 9),
      node('standard', 'RFC', 5),
    ]
    const picked = rankVisibleNodes(graph(nodes), filters({ maxNodes: 2 }))
    expect(picked.map((n) => n.degree)).toEqual([9, 5])
  })

  it('never returns more than maxNodes and never fewer than the filtered set when that is smaller', () => {
    const nodes = [node('standard', 'RFC', 1), node('patent', 'IoT', 2)]
    expect(rankVisibleNodes(graph(nodes), filters({ maxNodes: 1 }))).toHaveLength(1)
    expect(rankVisibleNodes(graph(nodes), filters({ maxNodes: 50 }))).toHaveLength(2)
  })

  it('is deterministic for equal degrees', () => {
    const nodes = Array.from({ length: 6 }, () => node('standard', 'RFC', 3))
    const a = rankVisibleNodes(graph(nodes), filters({ maxNodes: 3 })).map((n) => n.id)
    const b = rankVisibleNodes(graph([...nodes].reverse()), filters({ maxNodes: 3 })).map(
      (n) => n.id
    )
    expect(a).toEqual(b)
  })
})

describe('filterNodes / disabledSubs', () => {
  it('drops a disabled sub-category but keeps its siblings', () => {
    const nodes = [node('standard', 'RFC', 5), node('standard', 'Internet-Draft', 5)]
    const kept = filterNodes(
      graph(nodes),
      filters({ disabledSubs: new Set([subKey('standard', 'Internet-Draft')]) })
    )
    expect(kept.map((n) => n.sub)).toEqual(['RFC'])
  })

  it('a disabled sub of a different type does not affect a same-named sub elsewhere', () => {
    const nodes = [node('standard', 'Reference', 5), node('product', 'Reference', 5)]
    const kept = filterNodes(
      graph(nodes),
      filters({
        enabledTypes: new Set(['standard', 'product']),
        disabledSubs: new Set([subKey('product', 'Reference')]),
      })
    )
    expect(kept.map((n) => n.type)).toEqual(['standard'])
  })

  it('drops nodes of a disabled type regardless of sub', () => {
    const nodes = [node('standard', 'RFC', 5), node('vendor', 'Commercial Vendor', 50)]
    expect(filterNodes(graph(nodes), filters()).map((n) => n.type)).toEqual(['standard'])
  })
})

describe('buildVisibleSubgraph', () => {
  it('keeps only edges whose both endpoints survived', () => {
    const a = node('standard', 'RFC', 9)
    const b = node('standard', 'RFC', 8)
    const c = node('standard', 'RFC', 1)
    const g = graph(
      [a, b, c],
      [
        [a.id, b.id],
        [b.id, c.id],
      ]
    )
    const sub = buildVisibleSubgraph(g, filters({ maxNodes: 2 }))
    expect(sub.nodes.map((n) => n.id)).toEqual([a.id, b.id])
    expect(sub.edges).toHaveLength(1)
    expect(sub.edges[0]?.to).toBe(b.id)
  })
})

describe('subCategoriesOf', () => {
  it('lists a type’s subs with counts, largest first', () => {
    const nodes = [
      node('standard', 'RFC', 1),
      node('standard', 'RFC', 1),
      node('standard', 'Regulation', 1),
      node('patent', 'IoT', 1),
    ]
    expect(subCategoriesOf(graph(nodes), 'standard')).toEqual([
      { sub: 'RFC', count: 2 },
      { sub: 'Regulation', count: 1 },
    ])
  })
})
