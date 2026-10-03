// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { PatentsViewRedesign } from './PatentsViewRedesign'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { patentsData } from '@/data/patentsData'
import { isPqcPatent } from '@/components/Patents/patentColumns'

let lastSearch = ''
function LocationProbe() {
  const { search } = useLocation()
  useEffect(() => {
    lastSearch = search
  }, [search])
  return null
}

/** Stands in for an in-app link to /patents while already on /patents. */
function SamePageLink({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <Button type="button" onClick={() => navigate(to)}>
      same-page link
    </Button>
  )
}

function renderView(initial = '/patents', linkTo?: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <PatentsViewRedesign />
      <LocationProbe />
      {linkTo && <SamePageLink to={linkTo} />}
    </MemoryRouter>
  )
}

const nonPqc = patentsData.find((p) => !isPqcPatent(p))!

beforeEach(() => {
  usePersonaStore.getState().setPersona(null)
  localStorage.clear()
})

describe('PatentsViewRedesign', () => {
  it('renders the scope control and the KPI strip', () => {
    renderView()
    expect(screen.getByRole('radiogroup', { name: /corpus scope/i })).toBeInTheDocument()
    expect(screen.getByText(/Patents in scope/i)).toBeInTheDocument()
  })

  it('a KPI drill-down switches to Explore filtered (drill-down handoff works)', () => {
    renderView()
    // Default tab is Insights; the drill banner should not be visible yet.
    expect(screen.queryByText(/Filtered from the/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText(/High migration impact/i))
    // Now on Explore: the drill banner + filter bar count appear.
    expect(screen.getByText(/Filtered from the/i)).toBeInTheDocument()
    // The Explore filter bar is now mounted (its search input is unique to it).
    expect(screen.getByPlaceholderText(/Search patents — title/i)).toBeInTheDocument()
  })

  it('opens the detail drawer from a ?patent deep link', () => {
    renderView('/patents?tab=explore&patent=US20260156001')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('the scope toggle is a labelled segmented control, not a hidden switch', () => {
    renderView()
    const group = screen.getByRole('radiogroup', { name: /corpus scope/i })
    expect(within(group).getByRole('radio', { name: /PQC & hybrid/i })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: /All crypto/i })).toBeInTheDocument()
  })

  it('opens the drawer from a bare-number ?patent and canonicalises the param', () => {
    const p = patentsData.filter(isPqcPatent)[0]
    renderView(`/patents?patent=${p.patentNumber.replace(/^US/, '')}`)
    expect(screen.getByRole('dialog', { name: p.title })).toBeInTheDocument()
    expect(new URLSearchParams(lastSearch).get('patent')).toBe(p.patentNumber)
  })

  it('lands on Explore (with the row tagged) when ?patent has no ?tab', () => {
    const p = patentsData.filter(isPqcPatent)[0]
    renderView(`/patents?patent=${p.patentNumber}`)
    expect(screen.getByRole('tab', { name: /Explore/ })).toHaveAttribute('data-state', 'active')
    // eslint-disable-next-line testing-library/no-node-access -- asserting the scroll-target hook's selector
    expect(document.querySelector(`[data-deeplink-id="${p.patentNumber}"]`)).not.toBeNull()
  })

  it('widens the PQC-only scope for an out-of-scope patent, and Undo restores it', () => {
    renderView(`/patents?patent=${nonPqc.patentNumber}`)
    expect(screen.getByRole('dialog', { name: nonPqc.title })).toBeInTheDocument()
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(
      `Showing all patents to include ${nonPqc.patentNumber}`
    )
    expect(new URLSearchParams(lastSearch).get('scope')).toBe('all')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    const after = new URLSearchParams(lastSearch)
    expect(after.get('scope')).toBeNull()
    expect(after.get('patent')).toBeNull()
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
  })

  it('also widens a saved (localStorage) PQC-only scope', () => {
    localStorage.setItem('pqc-patents-pqc-only', 'true')
    renderView(`/patents?patent=${nonPqc.patentNumber.replace(/^US/, '')}`)
    expect(screen.getByTestId('deeplink-notice-widened')).toBeInTheDocument()
    // The widening is temporary — it doesn't overwrite the saved preference.
    expect(localStorage.getItem('pqc-patents-pqc-only')).toBe('true')
  })

  it('shows a not-found notice for an unknown patent', () => {
    renderView('/patents?patent=US00000000')
    expect(screen.getByTestId('deeplink-notice-not-found')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('maps a legacy ?tab=patents to Explore instead of a blank body', () => {
    renderView('/patents?tab=patents')
    expect(screen.getByRole('tab', { name: /Explore/ })).toHaveAttribute('data-state', 'active')
    expect(screen.getByPlaceholderText(/Search patents — title/i)).toBeInTheDocument()
  })

  it('filter params without ?tab land on Explore', () => {
    renderView('/patents?impact=High')
    expect(screen.getByPlaceholderText(/Search patents — title/i)).toBeInTheDocument()
  })

  it('a same-page ?scope link takes effect without a remount', () => {
    renderView('/patents', '/patents?scope=all')
    const group = screen.getByRole('radiogroup', { name: /corpus scope/i })
    expect(within(group).getByRole('radio', { name: /PQC & hybrid/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    fireEvent.click(screen.getByRole('button', { name: 'same-page link' }))
    expect(within(group).getByRole('radio', { name: /All crypto/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    // The reader's own toggle still works afterwards (and writes the URL).
    fireEvent.click(within(group).getByRole('radio', { name: /PQC & hybrid/i }))
    expect(within(group).getByRole('radio', { name: /PQC & hybrid/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(new URLSearchParams(lastSearch).get('scope')).toBe('pqc')
  })

  it('a same-page ?columns link takes effect without a remount', () => {
    renderView('/patents?tab=explore', '/patents?tab=explore&columns=num,title,inventors')
    expect(screen.queryByRole('columnheader', { name: /Inventors/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'same-page link' }))
    expect(screen.getByRole('columnheader', { name: /Inventors/ })).toBeInTheDocument()
  })
})
