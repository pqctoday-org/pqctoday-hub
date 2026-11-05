// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { XwalkGraph } from '@/utils/conceptXwalkGraph'
import { FrameworkConceptGraph } from './FrameworkConceptGraph'

const captured = vi.hoisted(() => ({
  edges: [] as Array<{
    id: string
    source: string
    target: string
    markerEnd?: unknown
    ariaLabel?: string
  }>,
  graph: null as XwalkGraph | null,
}))
vi.mock('@/utils/conceptXwalkGraph', () => ({ buildConceptGraph: () => captured.graph }))
vi.mock('@xyflow/react', () => ({
  MarkerType: { ArrowClosed: 'arrowclosed' },
  ReactFlow: ({ edges, children }: { edges: typeof captured.edges; children: ReactNode }) => {
    captured.edges = edges
    return <div data-testid="existing-graph-canvas">{children}</div>
  },
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

beforeEach(() => {
  captured.graph = {
    nodes: [
      { id: 'a', label: 'Framework A', sourceType: 'framework', isCenter: true },
      { id: 'b', label: 'Standard B', sourceType: 'standard', isCenter: false },
      { id: 'c', label: 'Algorithm C', sourceType: 'algorithm', isCenter: false },
    ],
    edges: [
      {
        id: 'subset',
        source: 'a',
        target: 'b',
        relationshipType: 'subset_of',
        rationaleType: 'semantic',
        evidence: 'Sample reference <img src=x onerror=alert(1)>',
        confidenceScore: 30,
        isSynthetic: false,
      },
      {
        id: 'superset',
        source: 'b',
        target: 'a',
        relationshipType: 'superset_of',
        evidence: 'Same reference',
        confidenceScore: 85,
        isSynthetic: false,
      },
      {
        id: 'equivalent',
        source: 'a',
        target: 'b',
        relationshipType: 'equivalent',
        evidence: 'Same reference',
        confidenceScore: 0,
        isSynthetic: false,
      },
      {
        id: 'intersection',
        source: 'a',
        target: 'b',
        relationshipType: 'intersects_with',
        isSynthetic: false,
      },
      {
        id: 'unrelated',
        source: 'a',
        target: 'b',
        relationshipType: 'not_related',
        confidenceScore: Number.NaN,
        isSynthetic: false,
      },
      {
        id: 'context',
        source: 'b',
        target: 'c',
        relationshipType: 'implements',
        evidence: 'invented-synthetic-evidence',
        confidenceScore: 99,
        isSynthetic: true,
      },
    ],
  }
})

describe('existing graph assertions and derived confidence are inspectable', () => {
  it('keeps exact edge direction and only adds direction markers for asymmetric/context relations', () => {
    const { rerender } = render(<FrameworkConceptGraph centerConceptId="sample-a" />)
    expect(captured.edges.find((edge) => edge.id === 'subset')).toMatchObject({
      source: 'a',
      target: 'b',
      markerEnd: { type: 'arrowclosed' },
    })
    expect(captured.edges.find((edge) => edge.id === 'superset')).toMatchObject({
      source: 'b',
      target: 'a',
      markerEnd: { type: 'arrowclosed' },
    })
    for (const id of ['equivalent', 'intersection', 'unrelated'])
      expect(captured.edges.find((edge) => edge.id === id)?.markerEnd).toBeUndefined()
    expect(captured.edges.find((edge) => edge.id === 'context')?.markerEnd).toEqual({
      type: 'arrowclosed',
    })
    captured.graph = {
      ...captured.graph!,
      edges: [{ ...captured.graph!.edges[0], source: 'b', target: 'a' }],
    }
    rerender(<FrameworkConceptGraph centerConceptId="sample-reversed" />)
    expect(captured.edges[0]).toMatchObject({ id: 'subset', source: 'b', target: 'a' })
    expect(captured.edges[0].ariaLabel).toContain('from b to a: subset_of')
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/From:\s*Standard B/)
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/To:\s*Framework A/)
  })

  it('distinguishes derived low/high/zero from unavailable and generated context without inventing review', () => {
    render(<FrameworkConceptGraph centerConceptId="sample-a" />)
    expect(screen.getByText('30/100', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('85/100', { exact: false })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('0/100')
    expect(screen.getAllByText('Not assessed', { exact: false })).toHaveLength(2)
    expect(screen.getAllByRole('listitem')[3]).toHaveTextContent(
      'Recorded evidence/reference: Not recorded'
    )
    expect(screen.getAllByRole('listitem')[4]).toHaveTextContent(
      'Recorded evidence/reference: Not recorded'
    )
    expect(screen.queryByText(/99\/100|invented-synthetic-evidence/)).not.toBeInTheDocument()
    expect(screen.getByText(/Generated standard–algorithm context link/)).toHaveTextContent(
      'No crosswalk evidence or confidence'
    )
    expect(screen.getByText(/These are recorded Hub mappings/)).toHaveTextContent(
      'does not establish legal equivalence'
    )
    expect(screen.getAllByText(/category-derived index may include defaults/)[0]).toHaveTextContent(
      'not a measured probability or evidence of independent review'
    )
  })

  it('preserves reference text as text and provides a bounded keyboard-scroll region', () => {
    render(<FrameworkConceptGraph centerConceptId="sample-a" height={320} />)
    expect(screen.getByText(/Sample reference <img/)).toHaveTextContent(
      '<img src=x onerror=alert(1)>'
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Concept graph and relationship details' })
    ).toHaveAttribute('tabindex', '0')
    expect(
      screen.getByRole('region', { name: 'Concept graph and relationship details' })
    ).toHaveStyle({ height: '320px' })
    expect(
      screen.getByRole('region', { name: 'Recorded relationships and generated context' })
    ).toBeInTheDocument()
  })
})
