// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { conceptRegistry } from '@/data/conceptRegistry'
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  edgeLabelLines,
  edgePathThroughLabel,
  estimateLabelSize,
  layoutConceptGraph,
} from './conceptGraphLayout'
import { buildConceptGraph, hasGraphEdges, type XwalkGraphEdge } from './conceptXwalkGraph'

interface Box {
  l: number
  t: number
  r: number
  b: number
}

const overlaps = (a: Box, c: Box) => !(a.r <= c.l || c.r <= a.l || a.b <= c.t || c.b <= a.t)

type PlacedLabel = ReturnType<typeof layoutConceptGraph>['edges'][number]

/** The box a label needs, from its text, not from whatever size the layout says it reserved. */
function labelBox(e: PlacedLabel): Box {
  const size = estimateLabelSize(e.lines)
  return {
    l: e.labelX - size.width / 2,
    t: e.labelY - size.height / 2,
    r: e.labelX + size.width / 2,
    b: e.labelY + size.height / 2,
  }
}

function edge(over: Partial<XwalkGraphEdge> & Pick<XwalkGraphEdge, 'id' | 'source' | 'target'>) {
  return {
    relationshipType: 'intersects_with',
    rationaleType: 'policy_reference',
    isSynthetic: false,
    ...over,
  } satisfies XwalkGraphEdge
}

function node(id: string) {
  return { id, label: id, sourceType: 'framework' as const, isCenter: false }
}

describe('edgeLabelLines', () => {
  it('shows the relationship and its basis as plain words', () => {
    expect(
      edgeLabelLines({
        isSynthetic: false,
        relationshipType: 'intersects_with',
        rationaleType: 'policy_reference',
      })
    ).toEqual(['Relates to', '(policy reference)'])
  })

  it('shows a single line for an implements link and for a link with no basis', () => {
    expect(
      edgeLabelLines({
        isSynthetic: true,
        relationshipType: 'implements',
        rationaleType: undefined,
      })
    ).toEqual(['implements'])
    expect(
      edgeLabelLines({
        isSynthetic: false,
        relationshipType: 'equivalent',
        rationaleType: undefined,
      })
    ).toEqual(['Equivalent to'])
  })
})

describe('estimateLabelSize', () => {
  it('grows with the longest line and with the number of lines', () => {
    const short = estimateLabelSize(['implements'])
    const long = estimateLabelSize(['intersects with', '(implementation guidance)'])
    expect(long.width).toBeGreaterThan(short.width)
    expect(long.height).toBeGreaterThan(short.height)
  })
})

describe('layoutConceptGraph', () => {
  it('keeps every label clear of the node columns it connects', () => {
    const nodes = [node('a'), node('b'), node('hub'), node('c')]
    const edges = [
      edge({ id: 'ab', source: 'a', target: 'hub' }),
      edge({ id: 'bb', source: 'b', target: 'hub', rationaleType: 'implementation_guidance' }),
      edge({ id: 'hc', source: 'hub', target: 'c' }),
    ]
    const layout = layoutConceptGraph(nodes, edges)
    const boxes: Box[] = layout.nodes.map((n) => ({
      l: n.x,
      t: n.y,
      r: n.x + NODE_WIDTH,
      b: n.y + NODE_HEIGHT,
    }))
    expect(layout.edges).toHaveLength(3)
    for (const e of layout.edges) {
      const label = labelBox(e)
      expect(e.labelWidth).toBeGreaterThanOrEqual(estimateLabelSize(e.lines).width)
      for (const b of boxes) expect(overlaps(label, b), `label ${e.id}`).toBe(false)
    }
  })

  it('gives parallel edges between the same two concepts separate label slots', () => {
    const layout = layoutConceptGraph(
      [node('a'), node('b')],
      [
        edge({ id: 'one', source: 'a', target: 'b' }),
        edge({ id: 'two', source: 'a', target: 'b', rationaleType: 'timeline_anchor' }),
      ]
    )
    const [one, two] = layout.edges
    expect(overlaps(labelBox(one), labelBox(two))).toBe(false)
  })

  it('drops an edge whose far end is not drawn, instead of failing', () => {
    const layout = layoutConceptGraph([node('a')], [edge({ id: 'x', source: 'a', target: 'gone' })])
    expect(layout.nodes).toHaveLength(1)
    expect(layout.edges).toHaveLength(0)
  })

  it('has no label on a node or on another label in any shipped concept graph', () => {
    const centres = conceptRegistry.map((r) => r.conceptId).filter((id) => hasGraphEdges(id))
    // The shipped registry carries many graphs; if this empties the test proves nothing.
    expect(centres.length).toBeGreaterThan(20)
    let checkedLabels = 0
    for (const id of centres) {
      const graph = buildConceptGraph(id)
      const layout = layoutConceptGraph(graph.nodes, graph.edges)
      const nodeBoxes = layout.nodes.map((n) => ({
        id: n.id,
        l: n.x,
        t: n.y,
        r: n.x + NODE_WIDTH,
        b: n.y + NODE_HEIGHT,
      }))
      const labelBoxes = layout.edges.map((e) => ({ id: e.id, ...labelBox(e) }))
      checkedLabels += labelBoxes.length
      for (const lb of labelBoxes) {
        for (const nb of nodeBoxes) {
          expect(overlaps(lb, nb), `${id}: label ${lb.id} covers node ${nb.id}`).toBe(false)
        }
      }
      labelBoxes.forEach((a, i) => {
        for (const b of labelBoxes.slice(i + 1)) {
          expect(overlaps(a, b), `${id}: labels ${a.id} and ${b.id} overlap`).toBe(false)
        }
      })
    }
    expect(checkedLabels).toBeGreaterThan(100)
  })
})

describe('edgePathThroughLabel', () => {
  it('passes through the label centre, level there, and ends on both handles', () => {
    const d = edgePathThroughLabel(0, 0, 100, 40, 200, 100)
    expect(d).toBe('M 0,0 C 50,0 50,40 100,40 C 150,40 150,100 200,100')
  })
})
