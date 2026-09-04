// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildForceClusterGraph, type ForceClusterNodeType } from './forceClusterGraph'

describe('buildForceClusterGraph', () => {
  it('derives a real, non-trivial graph from live hub data', async () => {
    const graph = await buildForceClusterGraph()

    expect(graph.nodes.length).toBeGreaterThan(0)
    expect(graph.edges.length).toBeGreaterThan(0)

    // Every edge endpoint must resolve to a real node (no dangling refs after capping).
    const ids = new Set(graph.nodes.map((n) => n.id))
    for (const edge of graph.edges) {
      expect(ids.has(edge.from)).toBe(true)
      expect(ids.has(edge.to)).toBe(true)
    }

    // No duplicate node ids.
    expect(ids.size).toBe(graph.nodes.length)

    const byType: Record<ForceClusterNodeType, number> = {
      certbody: 0,
      mechanism: 0,
      industry: 0,
      usecase: 0,
      compliance: 0,
      standard: 0,
      glossary: 0,
      product: 0,
      protocol: 0,
      patent: 0,
      leader: 0,
      vendor: 0,
    }
    for (const n of graph.nodes) byType[n.type] += 1
    console.log('node counts by type:', byType)
    console.log('total nodes:', graph.nodes.length, 'total edges:', graph.edges.length)

    const relCounts = new Map<string, number>()
    for (const e of graph.edges) relCounts.set(e.rel, (relCounts.get(e.rel) ?? 0) + 1)
    console.log('edge counts by rel:', Object.fromEntries(relCounts))

    // Every one of the 12 categories should have at least one surviving node.
    const types = Object.keys(byType) as ForceClusterNodeType[]
    for (const type of types) {
      // eslint-disable-next-line security/detect-object-injection -- type is drawn from the typed ForceClusterNodeType union, not user input
      const count = byType[type]
      expect(count).toBeGreaterThan(0)
    }

    // §9c gap closures — regression guard: each of these edge sources produced
    // zero edges at least once during development (a real bug each time, not
    // an absence of data), so assert they stay wired up.
    const rels = new Set(graph.edges.map((e) => e.rel))
    expect(rels.has('intersects_with')).toBe(true) // concept_xwalk
    expect(rels.has('subset_of')).toBe(true) // concept_xwalk
    expect(rels.has('migrating-to')).toBe(true) // algorithms_transitions
    expect(rels.has('sells')).toBe(true) // vendor -> product, via vendor_id
  })
})
