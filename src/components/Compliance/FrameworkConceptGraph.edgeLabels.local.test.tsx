// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { XwalkGraph } from '@/utils/conceptXwalkGraph'
import { FrameworkConceptGraph } from './FrameworkConceptGraph'

type CapturedEdge = {
  id: string
  data?: { label?: { lines: string[] } }
  markerEnd?: unknown
}
const captured = vi.hoisted(() => ({
  edges: [] as CapturedEdge[],
  graph: null as XwalkGraph | null,
}))
vi.mock('@/utils/conceptXwalkGraph', () => ({ buildConceptGraph: () => captured.graph }))
vi.mock('@xyflow/react', () => ({
  MarkerType: { ArrowClosed: 'arrowclosed' },
  ReactFlow: ({ edges, children }: { edges: CapturedEdge[]; children: ReactNode }) => {
    captured.edges = edges
    return <div data-testid="edge-label-canvas">{children}</div>
  },
  Background: () => null,
  Controls: () => null,
  BaseEdge: () => null,
  EdgeLabelRenderer: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

const edge = (id: string, relationshipType: string, rationaleType?: string) => ({
  id,
  source: 'a',
  target: 'b',
  relationshipType,
  rationaleType,
  isSynthetic: false,
})

describe('edge labels on the concept graph use plain words', () => {
  it('shows a sentence-style label instead of the stored relationship identifier', () => {
    captured.graph = {
      nodes: [
        { id: 'a', label: 'Sample scheme', sourceType: 'guidance', isCenter: false },
        { id: 'b', label: 'Sample umbrella', sourceType: 'guidance', isCenter: true },
      ],
      edges: [
        edge('subset', 'subset_of'),
        edge('superset', 'superset_of'),
        edge('equal', 'equivalent'),
        edge('overlap', 'intersects_with'),
        edge('scheme', 'scheme_under', 'policy_reference'),
        edge('series', 'part_of_series'),
        edge('other', 'some_new_type'),
      ],
    }
    render(<FrameworkConceptGraph centerConceptId="sample-b" />)
    const labels = Object.fromEntries(
      captured.edges.map((e) => [e.id, e.data?.label?.lines.join('\n')])
    )
    expect(labels).toEqual({
      subset: 'Subset of',
      superset: 'Superset of',
      equal: 'Equivalent to',
      overlap: 'Relates to',
      scheme: 'National scheme under\n(policy reference)',
      series: 'Part of series with',
      other: 'Some new type',
    })
    for (const e of captured.edges) expect(e.data?.label?.lines[0]).not.toMatch(/^[a-z]+_[a-z_]+/)
  })

  it('points the arrow for the two directional link types', () => {
    captured.graph = {
      nodes: [
        { id: 'a', label: 'Sample scheme', sourceType: 'guidance', isCenter: false },
        { id: 'b', label: 'Sample umbrella', sourceType: 'guidance', isCenter: true },
      ],
      edges: [edge('scheme', 'scheme_under'), edge('series', 'part_of_series')],
    }
    render(<FrameworkConceptGraph centerConceptId="sample-b" />)
    for (const e of captured.edges) expect(e.markerEnd).toEqual({ type: 'arrowclosed' })
  })
})
