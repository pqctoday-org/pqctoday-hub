// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { ForceClusterNode, ForceClusterNodeType } from '@/data/forceClusterGraph'
import { NODE_TYPES } from './graphVisuals'
import { buildItinerary, skippedCategories } from './tourItinerary'

function node(id: string, type: ForceClusterNodeType, degree: number): ForceClusterNode {
  return { id, label: id, type, sub: 'sub', description: '', degree }
}

describe('buildItinerary', () => {
  it('emits a category beat followed by its top-N nodes by degree, per category, in NODE_TYPES order', () => {
    const nodes = [
      node('standard-lo', 'standard', 2),
      node('standard-hi', 'standard', 9),
      node('standard-mid', 'standard', 5),
      node('mechanism-a', 'mechanism', 3),
    ]

    const stops = buildItinerary(nodes, 10)

    const standardIdx = NODE_TYPES.indexOf('standard')
    const mechanismIdx = NODE_TYPES.indexOf('mechanism')
    expect(mechanismIdx).toBeLessThan(standardIdx) // sanity on the fixture assumption below (NODE_TYPES order)

    expect(stops[0]).toEqual({ kind: 'category', type: 'mechanism' })
    expect(stops[1]).toMatchObject({ kind: 'node', node: { id: 'mechanism-a' } })
    expect(stops[2]).toEqual({ kind: 'category', type: 'standard' })
    expect(stops.slice(3, 6).map((s) => (s.kind === 'node' ? s.node.id : null))).toEqual([
      'standard-hi',
      'standard-mid',
      'standard-lo',
    ])
    expect(stops).toHaveLength(6)
  })

  it('caps each category at topN nodes', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => node(`n${i}`, 'standard', i))
    const stops = buildItinerary(nodes, 10)
    const nodeStops = stops.filter((s) => s.kind === 'node')
    expect(nodeStops).toHaveLength(10)
    expect(nodeStops.map((s) => (s.kind === 'node' ? s.node.id : null))).toEqual([
      'n19',
      'n18',
      'n17',
      'n16',
      'n15',
      'n14',
      'n13',
      'n12',
      'n11',
      'n10',
    ])
  })

  it('degrades gracefully when topN exceeds the available node count', () => {
    const nodes = [node('a', 'protocol', 5), node('b', 'protocol', 1)]
    const stops = buildItinerary(nodes, 10)
    expect(stops).toHaveLength(3) // 1 category beat + 2 nodes, not padded to 10
  })

  it('skips a category with zero visible nodes rather than emitting an empty beat', () => {
    const nodes = [node('a', 'protocol', 5)]
    const stops = buildItinerary(nodes, 10)
    expect(stops.some((s) => s.type === 'glossary')).toBe(false)
    expect(stops).toEqual([
      { kind: 'category', type: 'protocol' },
      { kind: 'node', type: 'protocol', node: nodes[0] },
    ])
  })

  it('returns no stops for an empty graph', () => {
    expect(buildItinerary([], 10)).toEqual([])
  })
})

describe('skippedCategories', () => {
  it('reports an enabled category that has zero visible nodes', () => {
    const visible = [node('a', 'standard', 5)]
    const enabled = new Set<ForceClusterNodeType>(['standard', 'glossary'])
    expect(skippedCategories(visible, enabled)).toEqual(['glossary'])
  })

  it('does not report a category the user disabled themselves', () => {
    const visible = [node('a', 'standard', 5)]
    const enabled = new Set<ForceClusterNodeType>(['standard']) // glossary deliberately off, not "enabled"
    expect(skippedCategories(visible, enabled)).toEqual([])
  })

  it('reports nothing when every enabled category has visible nodes', () => {
    const visible = [node('a', 'standard', 5), node('b', 'glossary', 1)]
    const enabled = new Set<ForceClusterNodeType>(['standard', 'glossary'])
    expect(skippedCategories(visible, enabled)).toEqual([])
  })
})
