// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeAll, describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import {
  buildForceClusterGraph,
  type ForceClusterEdge,
  type ForceClusterGraph,
  type ForceClusterNode,
} from '@/data/forceClusterGraph'
import { NavigateDetailPanel } from './NavigateDetailPanel'

type Connection = {
  edge: ForceClusterEdge
  node: ForceClusterNode
  direction: 'outgoing' | 'incoming'
}

const HEADING = 'Products whose catalogue entry cites this source'
const NOTE = 'A link records a reference in the dataset, not a validation.'

let graph: ForceClusterGraph

beforeAll(async () => {
  graph = await buildForceClusterGraph()
})

function connectionsOf(node: ForceClusterNode): Connection[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const result: Connection[] = []
  for (const edge of graph.edges) {
    if (edge.from === node.id) {
      const other = byId.get(edge.to)
      if (other) result.push({ edge, node: other, direction: 'outgoing' })
    }
    if (edge.to === node.id) {
      const other = byId.get(edge.from)
      if (other) result.push({ edge, node: other, direction: 'incoming' })
    }
  }
  return result
}

function renderPanel(node: ForceClusterNode) {
  return render(
    <MemoryRouter>
      <NavigateDetailPanel
        node={node}
        connections={connectionsOf(node)}
        onSelectNode={() => {}}
        onSelectCategory={() => {}}
        onSelectSub={() => {}}
        onClose={() => {}}
      />
    </MemoryRouter>
  )
}

describe('NavigateDetailPanel — products listed under a trusted source', () => {
  it('names the CMVP products as catalogue entries that cite the source, with the not-a-validation sentence', () => {
    const cmvp = graph.nodes.find((n) => n.id === 'cb-cmvp')
    expect(cmvp?.type).toBe('certbody')
    const products = connectionsOf(cmvp!).filter(
      (c) => c.direction === 'outgoing' && c.edge.rel === 'references' && c.node.type === 'product'
    )
    expect(products.length).toBeGreaterThan(0)

    renderPanel(cmvp!)
    const heading = screen.getByRole('heading', { name: new RegExp(`^${HEADING}`) })
    expect(heading).toHaveTextContent(`${HEADING} · ${products.length}`)
    expect(heading).not.toHaveTextContent(/\((to|from)\)/i)
    expect(heading.parentElement).toHaveTextContent(NOTE)
    // The note sits with the product list, once.
    expect(screen.getAllByText(NOTE)).toHaveLength(1)
    expect(
      within(heading.parentElement as HTMLElement).getAllByRole('button').length
    ).toBeGreaterThan(0)
  })

  it('leaves a non-source node alone: its references group keeps the plain heading and has no note', () => {
    const usecase = graph.nodes.find(
      (n) =>
        graph.edges.some((e) => e.from === n.id && e.rel === 'references') && n.type === 'usecase'
    )
    expect(usecase).toBeDefined()
    renderPanel(usecase!)
    expect(screen.getByRole('heading', { name: /^References/ })).toBeInTheDocument()
    expect(screen.queryByText(HEADING)).not.toBeInTheDocument()
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument()
  })
})

describe('NavigateDetailPanel — connection headings read in the direction a reader means', () => {
  const headingTexts = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

  it('the FIPS 140-3 record lists the industries it applies to, not industries that "govern" it', () => {
    const fips = graph.nodes.find((n) => n.type === 'compliance' && n.label.includes('FIPS 140-3'))
    expect(fips).toBeDefined()
    const industries = connectionsOf(fips!).filter((c) => c.node.type === 'industry')
    expect(industries.length).toBeGreaterThan(0)
    // The industry links point from the framework to the industry.
    for (const c of industries) {
      expect(c.direction).toBe('outgoing')
      expect(c.edge.rel).toBe('applies_to')
    }

    renderPanel(fips!)
    const applies = screen.getByRole('heading', { level: 3, name: /^Applies to these industries/ })
    for (const c of industries.slice(0, 3)) {
      expect(
        within(applies.parentElement as HTMLElement).getByText(c.node.label)
      ).toBeInTheDocument()
    }
    // No heading shows a raw relation name or a (to)/(from) suffix, and no industry sits under
    // "Governed by".
    for (const text of headingTexts()) expect(text).not.toMatch(/\((to|from)\)|_/)
    const governedBy = screen.queryByRole('heading', { level: 3, name: /^Governed by/ })
    if (governedBy) {
      for (const c of industries) {
        expect(
          within(governedBy.parentElement as HTMLElement).queryByText(c.node.label)
        ).not.toBeInTheDocument()
      }
    }
  })

  it('an industry lists the frameworks that apply to it', () => {
    const industry = graph.nodes.find(
      (n) =>
        n.type === 'industry' && graph.edges.some((e) => e.to === n.id && e.rel === 'applies_to')
    )
    expect(industry).toBeDefined()
    renderPanel(industry!)
    const heading = screen.getByRole('heading', { level: 3, name: /^Frameworks that apply/ })
    const frameworks = connectionsOf(industry!).filter(
      (c) => c.direction === 'incoming' && c.edge.rel === 'applies_to'
    )
    expect(heading).toHaveTextContent(`Frameworks that apply · ${frameworks.length}`)
    for (const text of headingTexts()) expect(text).not.toMatch(/\((to|from)\)|_/)
  })

  it('a trusted source that governs a framework says "Governs", and the framework says "Governed by"', () => {
    const governing = graph.edges.find((e) => e.rel === 'governs')
    expect(governing).toBeDefined()
    const source = graph.nodes.find((n) => n.id === governing!.from)!
    const framework = graph.nodes.find((n) => n.id === governing!.to)!
    expect(source.type).toBe('certbody')
    expect(framework.type).toBe('compliance')

    const view = renderPanel(source)
    expect(screen.getByRole('heading', { level: 3, name: /^Governs/ })).toBeInTheDocument()
    view.unmount()
    renderPanel(framework)
    expect(screen.getByRole('heading', { level: 3, name: /^Governed by/ })).toBeInTheDocument()
  })

  it('a relation that reads the same from both ends is one group with each neighbour listed once', () => {
    const node = graph.nodes.find((n) => {
      const related = connectionsOf(n).filter((c) => c.edge.rel === 'related')
      return (
        related.some((c) => c.direction === 'outgoing') &&
        related.some((c) => c.direction === 'incoming')
      )
    })
    expect(node).toBeDefined()
    renderPanel(node!)
    expect(screen.getAllByRole('heading', { level: 3, name: /^Related to/ })).toHaveLength(1)
    const neighbours = new Set(
      connectionsOf(node!)
        .filter((c) => c.edge.rel === 'related')
        .map((c) => c.node.id)
    )
    expect(screen.getByRole('heading', { level: 3, name: /^Related to/ })).toHaveTextContent(
      `Related to · ${neighbours.size}`
    )
  })
})
