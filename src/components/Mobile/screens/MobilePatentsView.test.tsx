// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { MobilePatentsView } from './MobilePatentsView'
import { patentsData } from '@/data/patentsData'
import { isPqcPatent } from '@/components/Patents/patentColumns'
import { computePatentKpis } from '@/components/Patents/redesign/usePatentKpis'
import { PQC_ONLY_LS_KEY } from '@/data/patentsScope'
import { filterPatents, inferRegion } from '@/data/patentFilters'

// Real data throughout — patentsData is parsed synchronously from a bundled
// CSV at module load. Assertions are structural (derived at test time), not
// hardcoded counts, since the underlying corpus changes over time and the
// mockup's own "1,185"/"214"/"Huawei · 63" figures are already known-stale.
let lastSearch = ''
function LocationProbe() {
  const { search } = useLocation()
  useEffect(() => {
    lastSearch = search
  }, [search])
  return null
}

function renderView(initial = '/patents') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <MobilePatentsView />
      <LocationProbe />
    </MemoryRouter>
  )
}

describe('MobilePatentsView', () => {
  beforeEach(() => {
    localStorage.removeItem(PQC_ONLY_LS_KEY)
  })

  it('shows the real KPI figures from usePatentKpis(), not the stale mockup numbers', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const kpis = computePatentKpis(scoped)
    expect(screen.getByText(String(kpis.inScope))).toBeInTheDocument()
    expect(screen.getByText(String(kpis.highImpact.count))).toBeInTheDocument()
    expect(screen.queryByText('1,185')).not.toBeInTheDocument()
    expect(screen.queryByText('214')).not.toBeInTheDocument()
  })

  it('shows the real top assignee, not the stale "Huawei" mockup figure', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const kpis = computePatentKpis(scoped)
    expect(kpis.topAssignee).not.toBeNull()
    expect(
      screen.getByText(`${kpis.topAssignee!.name} · ${kpis.topAssignee!.count} patents`)
    ).toBeInTheDocument()
  })

  it('tapping High migration impact filters the list to only High-impact patents', () => {
    renderView()
    fireEvent.click(screen.getByText('High migration impact').closest('button')!)
    const scoped = patentsData.filter(isPqcPatent)
    const highImpactCount = scoped.filter((p) => p.impactLevel === 'High').length
    expect(screen.getByText(`${highImpactCount} patents`)).toBeInTheDocument()
  })

  it('every real crypto-agility class renders with a real, live-computed count', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const classicalCount = scoped.filter((p) => p.cryptoAgilityMode === 'classical_only').length
    expect(screen.getByText(`Classical only · ${classicalCount}`)).toBeInTheDocument()
  })

  it('typing a search query narrows the list', () => {
    renderView()
    const before = Number(screen.getByText(/^\d+ patents$/).textContent!.split(' ')[0])
    const scoped = patentsData.filter(isPqcPatent)
    const sample = scoped[0]
    fireEvent.change(screen.getByPlaceholderText(/Search assignee, algorithm or protocol/i), {
      target: { value: sample.assignee },
    })
    const after = Number(screen.getByText(/^\d+ patents$/).textContent!.split(' ')[0])
    expect(after).toBeLessThanOrEqual(before)
    expect(after).toBeGreaterThan(0)
  })

  it('keeps the real research/IP disclaimer verbatim', () => {
    renderView()
    expect(screen.getByText(/For research — not legal or IP advice/i)).toBeInTheDocument()
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(
      screen.getByText(/The full 25-dimension table\/grid, the all-crypto scope toggle/i)
    ).toBeInTheDocument()
  })

  it('tapping a patent card opens the real detail sheet with its summary, and Close dismisses it', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const first = scoped[0]
    fireEvent.click(screen.getByText(first.title).closest('button')!)
    expect(screen.getByTestId('patent-detail-sheet')).toBeInTheDocument()
    if (first.summary) {
      expect(screen.getByText(first.summary)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('patent-detail-sheet')).not.toBeInTheDocument()
  })

  it('opens the detail sheet from ?patent in the US-prefixed form', () => {
    const p = patentsData.filter(isPqcPatent)[0]
    renderView(`/patents?patent=${p.patentNumber}`)
    expect(screen.getByTestId('patent-detail-sheet')).toBeInTheDocument()
    expect(screen.getAllByText(p.title).length).toBeGreaterThan(1)
  })

  it('opens the detail sheet from a bare-number ?patent, even outside the PQC scope', () => {
    const p = patentsData.find((x) => !isPqcPatent(x))!
    renderView(`/patents?patent=${p.patentNumber.replace(/^US/, '')}`)
    expect(screen.getByTestId('patent-detail-sheet')).toBeInTheDocument()
    expect(screen.getByText(p.title)).toBeInTheDocument()
  })

  it('shows a not-found notice for an unknown ?patent', () => {
    renderView('/patents?patent=US00000000')
    expect(screen.getByTestId('deeplink-notice-not-found')).toBeInTheDocument()
    expect(screen.queryByTestId('patent-detail-sheet')).not.toBeInTheDocument()
  })

  it('writes ?patent on open and clears it on close', () => {
    renderView()
    const first = patentsData.filter(isPqcPatent)[0]
    fireEvent.click(screen.getByText(first.title).closest('button')!)
    expect(new URLSearchParams(lastSearch).get('patent')).toBe(first.patentNumber)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(new URLSearchParams(lastSearch).get('patent')).toBeNull()
  })

  it('honours ?scope=all over the saved PQC-only scope', () => {
    renderView('/patents?scope=all')
    expect(screen.getByText(`${patentsData.length} patents`)).toBeInTheDocument()
  })

  it('search matches a patent number', () => {
    renderView()
    const p = patentsData.filter(isPqcPatent)[0]
    fireEvent.change(screen.getByPlaceholderText(/Search assignee, algorithm or protocol/i), {
      target: { value: p.patentNumber.replace(/^US/, '') },
    })
    expect(screen.getByText(p.title)).toBeInTheDocument()
  })

  describe('desktop link filters (?inventor, ?patentIds)', () => {
    const count = () => Number(screen.getByText(/^\d+ patents$/).textContent!.split(' ')[0])
    const pqc = patentsData.filter(isPqcPatent)

    it('?patentIds narrows the list to those patents (US or bare form) with a removable chip', () => {
      const [a, b] = pqc
      renderView(`/patents?patentIds=${a.patentNumber},${b.patentNumber.replace(/^US/, '')}`)
      expect(count()).toBe(2)
      expect(screen.getByText(a.title)).toBeInTheDocument()
      expect(screen.getByTestId('patent-link-filters')).toHaveTextContent('Patents:2 selected')
      fireEvent.click(screen.getByRole('button', { name: 'Remove Patents filter' }))
      expect(new URLSearchParams(lastSearch).get('patentIds')).toBeNull()
      expect(count()).toBe(pqc.length)
      expect(screen.queryByTestId('patent-link-filters')).not.toBeInTheDocument()
    })

    it('?inventor filters by inventor name (desktop matching) and the chip clears it', () => {
      const withInventor = pqc.find((p) => /^[A-Za-z]+;\s*[A-Za-z]+/.test(p.inventors ?? ''))!
      const [surname, given] = withInventor.inventors
        .replace(/\bet\s+al\.?\s*$/i, '')
        .split(';')
        .map((s) => s.trim().split(/\s+/)[0])
      renderView(`/patents?inventor=${encodeURIComponent(`${given} ${surname}`)}&sq=keep`)
      expect(screen.getByTestId('patent-link-filters')).toHaveTextContent(
        `Inventor:${given} ${surname}`
      )
      fireEvent.click(screen.getByRole('button', { name: 'Remove Inventor filter' }))
      const sp = new URLSearchParams(lastSearch)
      expect(sp.get('inventor')).toBeNull()
      expect(sp.get('sq')).toBe('keep')
    })

    it('narrows the list to the inventor’s patents', () => {
      const withInventor = pqc.find((p) => /^[A-Za-z]+;\s*[A-Za-z]+/.test(p.inventors ?? ''))!
      renderView(`/patents?inventor=${encodeURIComponent(withInventor.inventors)}`)
      expect(screen.getByText(withInventor.title)).toBeInTheDocument()
      expect(count()).toBeLessThan(pqc.length)
    })

    it('keeps reading ?search into the search box', () => {
      renderView('/patents?search=lattice')
      expect(screen.getByPlaceholderText(/Search assignee, algorithm or protocol/i)).toHaveValue(
        'lattice'
      )
    })
  })

  describe('desktop Explore filters (parity with filterPatents)', () => {
    const count = () => Number(screen.getByText(/^\d+ patents$/).textContent!.split(' ')[0])
    const pqc = patentsData.filter(isPqcPatent)
    const expected = (qs: string) => filterPatents(pqc, new URLSearchParams(qs)).length

    it('?assignee narrows to the same patents desktop shows, with a removable chip', () => {
      const assignee = pqc[0].assignee
      const qs = `assignee=${encodeURIComponent(assignee)}`
      renderView(`/patents?${qs}`)
      expect(count()).toBe(expected(qs))
      expect(count()).toBeLessThan(pqc.length)
      expect(screen.getByTestId('patent-link-filters')).toHaveTextContent(`Assignee:${assignee}`)
      fireEvent.click(screen.getByRole('button', { name: 'Remove Assignee filter' }))
      expect(new URLSearchParams(lastSearch).get('assignee')).toBeNull()
      expect(count()).toBe(pqc.length)
    })

    it('?region and ?domain combine exactly as on desktop', () => {
      const region = inferRegion(pqc[0].assignee)
      const domain = pqc[0].applicationDomain[0]
      const qs = `region=${encodeURIComponent(region)}&domain=${encodeURIComponent(domain)}`
      renderView(`/patents?${qs}`)
      expect(count()).toBe(expected(qs))
      expect(count()).toBeGreaterThan(0)
      const chips = screen.getByTestId('patent-link-filters')
      expect(chips).toHaveTextContent(`Region:${region}`)
      expect(chips).toHaveTextContent(`Domain:${domain}`)
    })

    it('?agility selects the matching agility chip; tapping it clears the param', () => {
      renderView('/patents?agility=hybrid')
      const hybridCount = pqc.filter((p) => p.cryptoAgilityMode === 'hybrid').length
      expect(count()).toBe(hybridCount)
      const chip = screen.getByRole('button', { name: new RegExp(`· ${hybridCount}$`) })
      expect(chip).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(chip)
      expect(new URLSearchParams(lastSearch).get('agility')).toBeNull()
      expect(count()).toBe(pqc.length)
    })

    it('?impact=High presses the High-impact tile; tapping the tile writes ?impact', () => {
      renderView('/patents?impact=High')
      const tile = screen.getByText('High migration impact').closest('button')!
      expect(tile).toHaveAttribute('aria-pressed', 'true')
      expect(count()).toBe(expected('impact=High'))
      fireEvent.click(tile)
      expect(new URLSearchParams(lastSearch).get('impact')).toBeNull()
      fireEvent.click(tile)
      expect(new URLSearchParams(lastSearch).get('impact')).toBe('High')
    })

    it('an impact the tile cannot show (Medium) still filters, as a chip', () => {
      renderView('/patents?impact=Medium')
      expect(count()).toBe(expected('impact=Medium'))
      expect(screen.getByTestId('patent-link-filters')).toHaveTextContent('Impact:Medium')
    })
  })
})
