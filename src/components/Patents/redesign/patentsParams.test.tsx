// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link PR 2 (Patents): the Search tab's `?sq`, drawer prev/next from the
 * active tab, prior-art citations pushing history, `inventor`/`patentIds`
 * chips, Insights drills (quantum relevance) vs read-only leaderboards, and
 * inventor → Community links. Real data throughout.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import { PatentsViewRedesign } from './PatentsViewRedesign'
import { PatentsInsightsRedesign } from './PatentsInsightsRedesign'
import { PatentDetail } from '@/components/Patents/PatentDetail'
import { inventorLeadersFor } from '@/components/Patents/patentInventorLeaders'
import { resolvePatentTab } from '@/components/Patents/patentDeepLink'
import { MobilePatentsView } from '@/components/Mobile/screens/MobilePatentsView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { patentsData } from '@/data/patentsData'
import { leadersData } from '@/data/leadersData'
import { normalizePatentNumber } from '@/data/patentsScope'

// A stable idle result: a fresh `hits: []` per render would re-run the search
// memo every render and loop through onResults → setSearchResults.
const IDLE_SEMANTIC = vi.hoisted(() => ({ hits: [], mode: 'idle' as const, loading: false }))
vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof import('@/services/search/useSemanticSearch')>(
    '@/services/search/useSemanticSearch'
  )
  return { ...actual, useSemanticSearch: vi.fn(() => IDLE_SEMANTIC) }
})

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

function LocationProbe() {
  const loc = useLocation()
  const type = useNavigationType()
  return (
    <output data-testid="loc" data-nav={type}>
      {loc.search}
    </output>
  )
}

function renderView(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <PatentsViewRedesign />
      <LocationProbe />
    </MemoryRouter>
  )
}

const params = () => new URLSearchParams(screen.getByTestId('loc').textContent ?? '')
const navType = () => screen.getByTestId('loc').getAttribute('data-nav')
const searchBox = () => screen.getByRole('textbox', { name: 'Patent natural-language search' })

beforeEach(() => {
  usePersonaStore.getState().setPersona(null)
  localStorage.clear()
})

describe('Patents Search tab ?sq', () => {
  it('a bare ?sq lands on the Search tab', () => {
    expect(resolvePatentTab(new URLSearchParams('sq=lattice'), [])).toBe('search')
    expect(resolvePatentTab(new URLSearchParams('sq=lattice&tab=explore'), [])).toBe('explore')
  })

  it('reads ?sq on load and shows its results', () => {
    renderView('/patents?tab=search&sq=lattice')
    expect(searchBox()).toHaveValue('lattice')
    expect(screen.getByText(/results? for/)).toBeInTheDocument()
  })

  it('Enter writes ?sq with replace, and the clear button removes it', () => {
    renderView('/patents?tab=search')
    fireEvent.change(searchBox(), { target: { value: 'hybrid TLS' } })
    fireEvent.keyDown(searchBox(), { key: 'Enter' })
    expect(params().get('sq')).toBe('hybrid TLS')
    expect(navType()).toBe('REPLACE')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(params().get('sq')).toBeNull()
  })

  it('writes the settled query after the debounce', () => {
    vi.useFakeTimers()
    try {
      renderView('/patents?tab=search')
      fireEvent.change(searchBox(), { target: { value: 'kyber' } })
      expect(params().get('sq')).toBeNull()
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(params().get('sq')).toBe('kyber')
    } finally {
      vi.useRealTimers()
    }
  })

  it('after a reload the drawer steps through the Search hits, not the Explore list', () => {
    renderView('/patents?tab=search&sq=lattice')
    const cards = screen.getAllByRole('button', { name: /View details for patent/ })
    expect(cards.length).toBeGreaterThan(1)
    const first = cards[0].getAttribute('aria-label')!.replace('View details for patent ', '')
    fireEvent.click(cards[0])
    expect(params().get('patent')).toBe(first)
    expect(navType()).toBe('PUSH')
    const drawer = screen.getByRole('dialog')
    expect(within(drawer).getByText(`1 / ${cards.length}`)).toBeInTheDocument()
  })
})

describe('Patents drawer history', () => {
  const byId = new Set(patentsData.map((p) => p.patentNumber))
  const citing = patentsData.find((p) => p.citationGraph.some((c) => byId.has(c)))!
  const cited = citing.citationGraph.find((c) => byId.has(c))!

  it('a prior-art citation click pushes ?patent (Back returns to the citing patent)', () => {
    renderView(`/patents?scope=all&tab=explore&patent=${citing.patentNumber}`)
    const drawer = screen.getByRole('dialog', { name: citing.title })
    fireEvent.click(within(drawer).getByRole('button', { name: cited }))
    expect(params().get('patent')).toBe(cited)
    expect(navType()).toBe('PUSH')
  })

  it('"Explore related" links leave without closing the drawer first', () => {
    const p = patentsData.find((x) => x.standardsReferenced.length > 0)!
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <PatentDetail patent={p} inCorpusIds={byId} onClose={onClose} onNavigate={vi.fn()} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('link', { name: /Library/ }))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('Patents inventor / patentIds chips', () => {
  it('shows labelled chips and "Clear all" removes them', () => {
    renderView('/patents?tab=explore&inventor=Lyubashevsky&patentIds=US1,US2')
    expect(screen.getByText('Inventor:')).toBeInTheDocument()
    expect(screen.getByText('Lyubashevsky')).toBeInTheDocument()
    expect(screen.getByText('Patents:')).toBeInTheDocument()
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(params().get('inventor')).toBeNull()
    expect(params().get('patentIds')).toBeNull()
  })
})

describe('Patents Insights drills', () => {
  it('the quantum-relevance donut drills via ?quantumRelevance', () => {
    const onFilter = vi.fn()
    render(<PatentsInsightsRedesign patents={patentsData} onFilter={onFilter} />)
    fireEvent.click(screen.getByRole('button', { name: /Core invention/ }))
    expect(onFilter).toHaveBeenCalledWith({ quantumRelevance: 'core_invention' })
  })

  it('leaderboards with no Explore filter are not clickable', () => {
    render(<PatentsInsightsRedesign patents={patentsData} onFilter={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /More breakdowns/ }))
    for (const title of ['Threat models', 'Standards referenced', 'Migration strategy']) {
      const card = screen.getByRole('heading', { name: title }).parentElement!
      expect(within(card).queryAllByRole('button')).toHaveLength(0)
    }
    const protocols = screen.getByRole('heading', { name: 'Protocol coverage' }).parentElement!
    expect(within(protocols).queryAllByRole('button').length).toBeGreaterThan(0)
  })
})

describe('Patent inventors → Community', () => {
  const leader = leadersData.find((l) => (l.patentRefs ?? []).length > 0)!
  const patent = patentsData.find(
    (p) => p.patentNumber === normalizePatentNumber(leader.patentRefs![0])
  )!

  it("matches a leader through PatentRefs and the first inventor's name", () => {
    const res = inventorLeadersFor(patent)
    expect([res.primary, ...res.others].map((l) => l?.id)).toContain(leader.id)
  })

  it('matches "Surname; Given et al." by name when no PatentRefs link them', () => {
    const res = inventorLeadersFor(
      { patentNumber: 'US00000001', inventors: 'Lyubashevsky; Vadim et al.' },
      leadersData
    )
    expect(res.primary?.name).toMatch(/Lyubashevsky/)
    expect(res.firstInventor).toBe('Lyubashevsky; Vadim')
    expect(res.suffix).toBe(' et al.')
    expect(
      inventorLeadersFor({ patentNumber: 'US00000001', inventors: 'Nobody; Noone' }).primary
    ).toBeNull()
  })

  it('PatentDetail links a leader inventor to /leaders?leader=<leader_id>', () => {
    render(
      <MemoryRouter>
        <PatentDetail
          patent={patent}
          inCorpusIds={new Set()}
          onClose={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>
    )
    const link = screen
      .getAllByRole('link')
      .find(
        (a) =>
          a.getAttribute('href') ===
          `/leaders?leader=${encodeURIComponent(leader.leaderId || leader.name)}`
      )
    expect(link).toBeDefined()
  })
})

describe('MobilePatentsView ?sq', () => {
  it('seeds the search box from ?sq and writes it back with replace', () => {
    render(
      <MemoryRouter initialEntries={['/patents?sq=lattice']}>
        <MobilePatentsView />
        <LocationProbe />
      </MemoryRouter>
    )
    const box = screen.getByDisplayValue('lattice')
    fireEvent.change(box, { target: { value: 'kyber' } })
    expect(params().get('sq')).toBe('kyber')
    expect(navType()).toBe('REPLACE')
    fireEvent.change(box, { target: { value: '' } })
    expect(params().get('sq')).toBeNull()
  })
})
