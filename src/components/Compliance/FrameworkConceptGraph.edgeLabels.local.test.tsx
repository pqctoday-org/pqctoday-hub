// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { XwalkGraph } from '@/utils/conceptXwalkGraph'
import { FrameworkConceptGraph } from './FrameworkConceptGraph'

type CapturedEdge = {
  id: string
  data?: { label?: { lines: string[] } }
  markerEnd?: unknown
  ariaLabel?: string
}
type CapturedNode = { id: string; data: Record<string, unknown> }
const captured = vi.hoisted(() => ({
  edges: [] as CapturedEdge[],
  nodes: [] as CapturedNode[],
  nodeRenderer: null as ((props: { data: Record<string, unknown> }) => ReactNode) | null,
  graph: null as XwalkGraph | null,
}))
vi.mock('@/utils/conceptXwalkGraph', () => ({ buildConceptGraph: () => captured.graph }))
vi.mock('@xyflow/react', () => ({
  MarkerType: { ArrowClosed: 'arrowclosed' },
  ReactFlow: ({
    edges,
    nodes,
    nodeTypes,
    children,
  }: {
    edges: CapturedEdge[]
    nodes: CapturedNode[]
    nodeTypes: { concept: (props: { data: Record<string, unknown> }) => ReactNode }
    children: ReactNode
  }) => {
    captured.edges = edges
    captured.nodes = nodes
    captured.nodeRenderer = nodeTypes.concept
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
        edge('published', 'published_by', 'policy_reference'),
        edge('replaces', 'supersedes', 'policy_reference'),
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
      // Facts about a document, not a judgement of overlap: no "(basis)" line.
      published: 'Published by',
      replaces: 'Replaces an older edition',
      other: 'Some new type',
    })
    for (const e of captured.edges) expect(e.data?.label?.lines[0]).not.toMatch(/^[a-z]+_[a-z_]+/)
  })

  it('points the arrow for the directional link types, including published by and replaces', () => {
    captured.graph = {
      nodes: [
        { id: 'a', label: 'Sample scheme', sourceType: 'guidance', isCenter: false },
        { id: 'b', label: 'Sample umbrella', sourceType: 'guidance', isCenter: true },
      ],
      edges: [
        edge('scheme', 'scheme_under'),
        edge('series', 'part_of_series'),
        edge('published', 'published_by'),
        edge('replaces', 'supersedes'),
      ],
    }
    render(<FrameworkConceptGraph centerConceptId="sample-b" />)
    expect(captured.edges).toHaveLength(4)
    for (const e of captured.edges) expect(e.markerEnd).toEqual({ type: 'arrowclosed' })
  })

  it('names the link in plain words in the accessible name and the details list, never the stored identifier', () => {
    captured.graph = {
      nodes: [
        { id: 'new', label: 'Sample Edition 2', sourceType: 'standard', isCenter: true },
        { id: 'old', label: 'Sample Edition 1', sourceType: 'standard', isCenter: false },
      ],
      edges: [
        { ...edge('replaces', 'supersedes', 'policy_reference'), source: 'new', target: 'old' },
      ],
    }
    render(<FrameworkConceptGraph centerConceptId="new" />)
    expect(captured.edges[0].ariaLabel).toBe(
      'Recorded relationship from Sample Edition 2 to Sample Edition 1: Replaces an older edition'
    )
    const details = screen.getByRole('region', {
      name: 'Recorded relationships and generated context',
    })
    expect(within(details).getByText('Replaces an older edition')).toBeInTheDocument()
    expect(details).toHaveTextContent('Relationship: Replaces an older edition')
    expect(details).not.toHaveTextContent('supersedes')
  })
})

describe('a graph without a "published by" or "replaces" link looks exactly as before', () => {
  it('shows no legend, and keeps the stored identifier in the details list and accessible name', () => {
    captured.graph = {
      nodes: [
        { id: 'a', label: 'Sample A', sourceType: 'standard', isCenter: true },
        { id: 'b', label: 'Sample B', sourceType: 'standard', isCenter: false },
      ],
      edges: [
        edge('subset', 'subset_of', 'semantic'),
        edge('scheme', 'scheme_under', 'policy_reference'),
      ],
    }
    render(<FrameworkConceptGraph centerConceptId="a" />)
    expect(screen.queryByRole('region', { name: 'What the links mean' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('legend-list')).not.toBeInTheDocument()
    expect(captured.edges[0].ariaLabel).toBe('Recorded relationship from a to b: subset_of')
    const details = screen.getByRole('region', {
      name: 'Recorded relationships and generated context',
    })
    expect(details).toHaveTextContent('Relationship: subset_of')
    expect(details).toHaveTextContent('Relationship: scheme_under')
  })
})

describe('legend: what the links mean', () => {
  it('explains each link type present, in plain words, and only those', () => {
    captured.graph = {
      nodes: [
        { id: 'doc', label: 'Sample Edition 2', sourceType: 'standard', isCenter: true },
        { id: 'old', label: 'Sample Edition 1', sourceType: 'standard', isCenter: false },
        {
          id: 'org',
          label: 'Sample Org',
          sourceType: 'concept_only',
          isCenter: false,
          isPublisher: true,
        },
      ],
      edges: [
        { ...edge('replaces', 'supersedes'), source: 'doc', target: 'old' },
        { ...edge('published', 'published_by'), source: 'doc', target: 'org' },
      ],
    }
    render(<FrameworkConceptGraph centerConceptId="doc" />)
    const legend = screen.getByRole('region', { name: 'What the links mean' })
    const terms = within(legend)
      .getAllByRole('term')
      .map((t) => t.textContent)
    expect(terms).toEqual(['Published by', 'Replaces an older edition'])
    const defs = within(legend)
      .getAllByRole('definition')
      .map((d) => d.textContent)
    expect(defs[0]).toMatch(/comes from the organisation the arrow points to/)
    expect(defs[1]).toMatch(/newer edition replaces the older edition the arrow points to/)
    expect(defs[1]).toMatch(/draft is never shown as replacing anything/)
    // The line samples are decoration; the names carry the meaning.
    for (const svg of within(legend).getAllByTestId('legend-line-sample'))
      expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('wraps to one column on a phone: the term sits above its definition', () => {
    captured.graph = {
      nodes: [
        { id: 'a', label: 'A', sourceType: 'standard', isCenter: true },
        { id: 'b', label: 'B', sourceType: 'standard', isCenter: false },
      ],
      edges: [{ ...edge('replaces', 'supersedes'), source: 'a', target: 'b' }],
    }
    render(<FrameworkConceptGraph centerConceptId="a" />)
    const list = screen.getByTestId('legend-list')
    expect(list.className).toMatch(/grid-cols-1/)
    expect(list.className).toMatch(/sm:grid-cols-\[/)
    // Each entry stacks its term above its definition, then goes side by side from the sm breakpoint.
    const term = within(list).getByRole('term')
    expect(term.className).toMatch(/flex/)
    expect(list).toHaveTextContent('Replaces an older edition')
  })
})

describe('legend placement and naming', () => {
  const graphWithBoth = (): XwalkGraph => ({
    nodes: [
      { id: 'a', label: 'Sample A', sourceType: 'standard', isCenter: true },
      { id: 'b', label: 'Sample B', sourceType: 'standard', isCenter: false },
      { id: 'c', label: 'Sample C', sourceType: 'standard', isCenter: false },
    ],
    edges: [
      { ...edge('replaces', 'supersedes'), source: 'a', target: 'b' },
      { ...edge('overlap', 'intersects_with', 'technical_dependency'), source: 'a', target: 'c' },
    ],
  })

  it('is above the canvas, so it is in view without scrolling the graph region', () => {
    captured.graph = graphWithBoth()
    render(<FrameworkConceptGraph centerConceptId="a" />)
    const legend = screen.getByRole('region', { name: 'What the links mean' })
    const canvas = screen.getByTestId('edge-label-canvas')
    expect(legend.compareDocumentPosition(canvas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is a native disclosure named by its own visible heading', () => {
    captured.graph = graphWithBoth()
    render(<FrameworkConceptGraph centerConceptId="a" />)
    const heading = screen.getByText('What the links mean')
    expect(heading.tagName).toBe('SUMMARY')
    expect(screen.getByRole('region', { name: 'What the links mean' })).toBeInTheDocument()
  })

  it('names every link in plain words once the legend is shown, so one screen uses one name per link', () => {
    captured.graph = graphWithBoth()
    render(<FrameworkConceptGraph centerConceptId="a" />)
    const details = screen.getByRole('region', {
      name: 'Recorded relationships and generated context',
    })
    expect(details).toHaveTextContent('Relationship: Relates to')
    expect(details).toHaveTextContent('Relationship: Replaces an older edition')
    expect(details).not.toHaveTextContent('intersects_with')
    expect(captured.edges.map((e) => e.ariaLabel)).toEqual([
      'Recorded relationship from Sample A to Sample B: Replaces an older edition',
      'Recorded relationship from Sample A to Sample C: Relates to',
    ])
  })
})

describe('publisher nodes on the concept graph', () => {
  it('a publishing organisation is captioned "publisher", not by its registry record type', () => {
    captured.graph = {
      nodes: [
        { id: 'doc', label: 'Sample Edition 2', sourceType: 'standard', isCenter: true },
        {
          id: 'org',
          label: 'Sample Org',
          sourceType: 'concept_only',
          isCenter: false,
          isPublisher: true,
        },
      ],
      edges: [{ ...edge('published', 'published_by'), source: 'doc', target: 'org' }],
    }
    render(<FrameworkConceptGraph centerConceptId="doc" />)
    const org = captured.nodes.find((n) => n.id === 'org')!
    const Node = captured.nodeRenderer!
    render(<Node data={org.data} />)
    expect(screen.getByTitle('publisher: Sample Org')).toBeInTheDocument()
    expect(screen.queryByText('concept_only')).not.toBeInTheDocument()
  })
})
