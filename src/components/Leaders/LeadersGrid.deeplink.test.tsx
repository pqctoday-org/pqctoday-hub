// SPDX-License-Identifier: GPL-3.0-only
/**
 * ?leader= deep links through a real router (deep-link remediation PR 1):
 * hidden targets widen filters in ONE navigation (incl. all=1 for stubs), the
 * notice offers Undo, unknown names say so, and table rows are scroll targets.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { LeadersGrid } from './LeadersGrid'
import type { Leader } from '../../data/leadersData'

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))
vi.mock('../../utils/analytics', () => ({ logEvent: vi.fn(), personaLabel: (s: string) => s }))
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)
vi.mock('../../data/leadersData', () => ({
  leadersData: [
    {
      id: 'alice-1',
      leaderId: 'alice-1',
      name: 'Alice Quant',
      country: 'USA',
      title: 'Chief Scientist',
      organizations: ['Quantum Corp'],
      type: 'Private',
      category: 'Research',
      bio: 'Leading PQC research.',
      sourceKind: 'curated',
    },
    {
      id: 'bob-2',
      leaderId: 'bob-2',
      name: 'Bob Cyber',
      country: 'UK',
      title: 'Director',
      organizations: ['NCSC'],
      type: 'Public',
      category: 'Government',
      bio: 'Securing national infrastructure.',
      sourceKind: 'curated',
    },
    {
      id: 'aaron-3',
      leaderId: 'aaron-3',
      name: 'Aaron Voisine',
      country: 'France',
      title: 'Author / Contributor',
      organizations: [],
      type: 'Private',
      category: 'Standards',
      bio: 'Author or contributor on 1 PQC reference in the Library.',
      sourceKind: 'auto-imported',
    },
  ] as Leader[],
  leadersMetadata: { filename: 'leaders_test.csv', lastUpdate: new Date('2025-02-01') },
}))

const probe = { search: '' }
function LocationProbe() {
  const { search } = useLocation()
  useEffect(() => {
    probe.search = search
  }, [search])
  return null
}
const renderAt = (qs: string) =>
  render(
    <MemoryRouter initialEntries={[`/leaders${qs}`]}>
      <LeadersGrid />
      <LocationProbe />
    </MemoryRouter>
  )
const param = (k: string) => new URLSearchParams(probe.search).get(k)

describe('LeadersGrid ?leader= deep links', () => {
  const scrollIntoView = vi.fn()
  beforeEach(() => {
    scrollIntoView.mockReset()
    Element.prototype.scrollIntoView = scrollIntoView
    // jsdom has no layout; pretend every element has a box so the scroll hook fires.
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
      {} as DOMRect,
    ] as unknown as DOMRectList)
  })
  afterEach(() => vi.restoreAllMocks())

  it('reveals a %20-encoded stub contributor and keeps the reveal (all=1 in the URL)', async () => {
    renderAt('?leader=Aaron%20Voisine&cat=Government')
    await waitFor(() => expect(param('all')).toBe('1'))
    expect(param('cat')).toBeNull()
    expect(param('leader')).toBe('Aaron Voisine')
    expect(screen.getAllByText('Aaron Voisine').length).toBeGreaterThan(0)
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent('Aaron Voisine')
  })

  it('Undo restores the previous filters and closes the person', async () => {
    renderAt('?leader=Alice%20Quant&q=zzzz&sector=Private')
    await waitFor(() => expect(param('q')).toBeNull())
    expect(param('sector')).toBe('Private') // non-excluding filter kept
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(param('q')).toBe('zzzz'))
    expect(param('leader')).toBeNull()
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
  })

  it('matches names tolerantly (case, Dr. prefix)', async () => {
    renderAt('?leader=dr.%20bob%20cyber')
    await waitFor(() =>
      expect(
        (scrollIntoView.mock.contexts as HTMLElement[]).some(
          (el) => el.getAttribute('data-deeplink-id') === 'bob-2'
        )
      ).toBe(true)
    )
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
  })

  it('shows a not-found notice for an unknown name', async () => {
    renderAt('?leader=Nobody%20Here')
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent('Nobody Here')
  })

  it('scrolls to the table row in table view', async () => {
    renderAt('?leader=Bob%20Cyber&mode=table')
    // (the opened detail section scrolls itself too — look for the row call)
    await waitFor(() =>
      expect(
        (scrollIntoView.mock.contexts as HTMLElement[]).find((el) => el.tagName === 'TR')
      ).toBeDefined()
    )
    const row = (scrollIntoView.mock.contexts as HTMLElement[]).find((el) => el.tagName === 'TR')!
    expect(row.getAttribute('data-deeplink-id')).toBe('bob-2')
  })

  it("opens the leader's sector layer in stack view so the card renders", async () => {
    renderAt('?leader=Bob%20Cyber&mode=stack')
    await waitFor(() => expect(document.querySelector('[data-deeplink-id="bob-2"]')).not.toBeNull())
    expect(document.querySelector('[data-deeplink-id="alice-1"]')).toBeNull()
    expect(param('layer')).toBe('Public') // written, so the stack view link is shareable
  })

  it('writes the layer together with any widening (one navigation)', async () => {
    renderAt('?leader=bob-2&mode=stack&cat=Research')
    await waitFor(() => expect(param('layer')).toBe('Public'))
    expect(param('cat')).toBeNull()
  })
})

describe('LeadersGrid PR 2 params (leader_id, layer, table sort)', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterEach(() => vi.restoreAllMocks())

  it('?leader=<leader_id> expands that person without a notice', async () => {
    renderAt('?leader=alice-1')
    expect(
      await screen.findByRole('button', { name: 'Collapse details for Alice Quant' })
    ).toBeInTheDocument()
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
  })

  it('opening a card writes the leader_id (push) and closing removes it', async () => {
    renderAt('')
    fireEvent.click(screen.getByRole('button', { name: 'Expand details for Alice Quant' }))
    await waitFor(() => expect(param('leader')).toBe('alice-1'))
    fireEvent.click(screen.getByRole('button', { name: 'Collapse details for Alice Quant' }))
    await waitFor(() => expect(param('leader')).toBeNull())
  })

  it('?layer= opens that stack layer on load; clicking a layer writes it; unknown = All', async () => {
    renderAt('?mode=stack&layer=Private')
    await waitFor(() =>
      expect(document.querySelector('[data-deeplink-id="alice-1"]')).not.toBeNull()
    )
    expect(document.querySelector('[data-deeplink-id="bob-2"]')).toBeNull()
    fireEvent.click(
      screen.getByText('Public', { selector: 'h3, h4, span, div' }).closest('button')!
    )
    await waitFor(() => expect(param('layer')).toBe('Public'))
  })

  it('an unknown ?layer renders no layer as open (graceful)', () => {
    renderAt('?mode=stack&layer=Bogus')
    expect(document.querySelector('[data-deeplink-id]')).toBeNull()
    expect(screen.getAllByText(/Click to filter/).length).toBeGreaterThan(0)
  })

  it('leaving stack view drops ?layer', async () => {
    renderAt('?mode=stack&layer=Private')
    fireEvent.click(screen.getByRole('radio', { name: /Table/ }))
    await waitFor(() => expect(param('mode')).toBe('table'))
    expect(param('layer')).toBeNull()
  })

  it('Clear all clears ?layer', async () => {
    renderAt('?mode=stack&layer=Private&sector=Private')
    fireEvent.click(screen.getByRole('button', { name: /Clear all/ }))
    await waitFor(() => expect(param('layer')).toBeNull())
  })

  const rowOrder = () =>
    Array.from(document.querySelectorAll('tr[data-deeplink-id]')).map((r) =>
      r.getAttribute('data-deeplink-id')
    )

  it('table sort reads ?sort=country, and ?tsort/tdir for other columns', () => {
    const { unmount } = renderAt('?mode=table&all=1&sort=country')
    expect(rowOrder()).toEqual(['aaron-3', 'bob-2', 'alice-1']) // France, UK, USA
    unmount()
    renderAt('?mode=table&all=1&tsort=country&tdir=desc')
    expect(rowOrder()).toEqual(['alice-1', 'bob-2', 'aaron-3'])
  })

  it('clicking a column writes ?sort when it maps, else ?tsort (+tdir=desc)', async () => {
    renderAt('?mode=table&all=1')
    const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(name) })
    fireEvent.click(header('Country'))
    await waitFor(() => expect(param('sort')).toBe('country'))
    expect(param('tsort')).toBeNull()
    fireEvent.click(header('Country'))
    await waitFor(() => expect(param('tsort')).toBe('country'))
    expect(param('tdir')).toBe('desc')
    fireEvent.click(header('Sector'))
    await waitFor(() => expect(param('tsort')).toBe('type'))
    expect(param('tdir')).toBeNull()
  })

  it('an unknown ?tsort falls back to Name A-Z', () => {
    renderAt('?mode=table&tsort=bogus')
    expect(rowOrder()).toEqual(['alice-1', 'bob-2'])
  })
})
