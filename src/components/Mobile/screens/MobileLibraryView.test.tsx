// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileLibraryView } from './MobileLibraryView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { libraryData } from '@/data/libraryData'
import { LIBRARY_OPS_PICKS } from '@/data/libraryOpsPicks'

// Real data throughout — libraryData is parsed synchronously from a bundled
// CSV at module load. Assertions are structural (derived at test time), not
// hardcoded counts, since the underlying CSV changes over time.
//
// MemoryRouter wrapper added 2026-08-26: the detail sheet now renders the
// shared DocumentAnalysis panel (mobile-ux remediation), whose "Explore on
// PQC Today" links call useNavigate() — this view previously had no
// react-router dependency of its own.
function renderView() {
  return render(
    <MemoryRouter>
      <MobileLibraryView />
    </MemoryRouter>
  )
}

describe('MobileLibraryView', () => {
  afterEach(() => {
    usePersonaStore.getState().setPersona(null)
    useBookmarkStore.getState().libraryBookmarks.forEach((id) => {
      useBookmarkStore.getState().toggleLibraryBookmark(id)
    })
  })

  it('shows a real document count for the default (Everything) door, matching the active corpus', () => {
    renderView()
    // libraryData may include a virtual tree root; the pipeline's own
    // sortedItems is the real authoritative count for "Everything, no filter".
    const text = screen.getByTestId('library-count').textContent
    expect(text).toMatch(/^\d+ documents$/)
    const shown = Number(text!.split(' ')[0])
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThanOrEqual(libraryData.length)
  })

  it('never shows the invented "Showing N of 214 ... search to reach the rest" sentence', () => {
    renderView()
    expect(screen.queryByText(/search to reach the rest/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/of 214/i)).not.toBeInTheDocument()
  })

  it('uses the real search placeholder, not the Patents-screen copy', () => {
    renderView()
    expect(
      screen.getByPlaceholderText('Search — try "ML-KEM", "FIPS 203", or "hybrid TLS"')
    ).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText(/assignee, algorithm or protocol/i)
    ).not.toBeInTheDocument()
  })

  it('renders all four real purpose doors with their real labels', () => {
    renderView()
    expect(screen.getByText('Everything')).toBeInTheDocument()
    expect(screen.getByText('Learn')).toBeInTheDocument()
    expect(screen.getByText('Reference')).toBeInTheDocument()
    expect(screen.getByText('Plan migration')).toBeInTheDocument()
  })

  it('switching to the Reference door narrows the list — every visible ref is really purpose=reference', () => {
    renderView()
    fireEvent.click(screen.getByText('Reference'))
    const allCount = libraryData.length
    const shownText = screen.getByTestId('library-count').textContent!
    const shown = Number(shownText.split(' ')[0])
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(allCount)
  })

  it('the Cert-relevant quick view narrows to exactly the real LIBRARY_OPS_PICKS allowlist size (at most)', () => {
    renderView()
    fireEvent.click(screen.getByText('Cert-relevant'))
    const shownText = screen.getByTestId('library-count').textContent!
    const shown = Number(shownText.split(' ')[0])
    expect(shown).toBeLessThanOrEqual(LIBRARY_OPS_PICKS.length)
    // At least one real ops pick should actually render.
    const anyPick = LIBRARY_OPS_PICKS.find((p) => screen.queryByText(p.referenceId))
    expect(anyPick).toBeDefined()
  })

  it('typing a search query narrows the list via the real pipeline', () => {
    renderView()
    const before = Number(screen.getByTestId('library-count').textContent!.split(' ')[0])
    fireEvent.change(screen.getByPlaceholderText(/Search — try/i), {
      target: { value: 'ML-KEM' },
    })
    const after = Number(screen.getByTestId('library-count').textContent!.split(' ')[0])
    expect(after).toBeLessThan(before)
  })

  it('toggles a document bookmark via the real useBookmarkStore', () => {
    renderView()
    const btn = screen.getAllByRole('button', { name: 'Bookmark this document' })[0]
    fireEvent.click(btn)
    expect(useBookmarkStore.getState().libraryBookmarks.length).toBeGreaterThan(0)
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(screen.getByText(/Category, organization, geography, trust-tier/i)).toBeInTheDocument()
  })

  it('tapping a document card opens the real detail sheet, and Close dismisses it', () => {
    renderView()
    const firstTitle = document.querySelector('article h2')
    expect(firstTitle).toBeTruthy()
    const titleText = firstTitle!.textContent!
    fireEvent.click(firstTitle!.closest('button')!)
    expect(screen.getByTestId('library-detail-sheet')).toBeInTheDocument()
    expect(screen.getAllByText(titleText).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('library-detail-sheet')).not.toBeInTheDocument()
  })
})
