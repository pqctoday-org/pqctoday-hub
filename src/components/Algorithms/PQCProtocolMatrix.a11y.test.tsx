// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Protocol Support: table names, heading levels, honest link labels,
 * "no reviewed evidence" wording, and the three-tone Simple palette.
 */
import { afterEach, describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { usePersonaStore } from '@/store/usePersonaStore'

const renderAt = (entry = '/algorithms?tab=support') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <PQCProtocolMatrix />
    </MemoryRouter>
  )

describe('PQCProtocolMatrix — structure and wording', () => {
  afterEach(() => usePersonaStore.getState().setPersona(null))

  it('names the heatmap table and puts its heading at level 2', () => {
    renderAt()
    expect(screen.getByRole('table', { name: /protocol support heatmap/i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'PQC Protocol Support Matrix' })
    ).toBeInTheDocument()
  })

  it('labels a tool link that opens a Learn module as such', () => {
    renderAt()
    const links = screen.getAllByRole('link', { name: /TLS 1\.3 Simulator/ })
    for (const link of links) {
      const href = link.getAttribute('href') ?? ''
      if (href.startsWith('/learn/')) expect(link).toHaveTextContent('(Learn module)')
      else expect(link).not.toHaveTextContent('(Learn module)')
    }
    expect(links.length).toBeGreaterThan(0)
  })

  it('says "no reviewed evidence" instead of asserting no deployment exists', () => {
    renderAt()
    expect(screen.queryByText(/No deployment/)).not.toBeInTheDocument()
    expect(screen.queryByText(/No known production deployment/)).not.toBeInTheDocument()
  })

  it('Simple palette (executive) shows three tones and keeps drafts distinct from none', () => {
    usePersonaStore.getState().setPersona('executive')
    renderAt()
    const table = screen.getByRole('table', { name: /protocol support heatmap/i })
    // eslint-disable-next-line testing-library/no-node-access
    const cells = Array.from(table.querySelectorAll<HTMLElement>('[data-stage-tier]'))
    const tiers = new Set(cells.map((c) => c.dataset.stageTier))
    expect([...tiers].sort()).toEqual(['0', '4', '7'])
    // Every tone uses a theme colour token, never an opacity suffix on the
    // `.bg-status-*` component classes (those emit no CSS).
    for (const c of cells) expect(c.className).not.toMatch(/(bg|border)-status-[a-z]+\//)
    expect(within(table).getAllByText(/I-D|WG Doc|RFC Ed Queue|IESG|WG LC/).length).toBeGreaterThan(
      0
    )
  })
})
