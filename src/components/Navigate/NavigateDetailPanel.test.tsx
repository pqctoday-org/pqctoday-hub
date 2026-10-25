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
    expect(heading).not.toHaveTextContent(/references \(to\)/i)
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
    expect(screen.getByRole('heading', { name: /^references \(to\)/ })).toBeInTheDocument()
    expect(screen.queryByText(HEADING)).not.toBeInTheDocument()
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument()
  })
})
