// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'
import { libraryData } from '@/data/libraryData'
import { PERSONA_LIBRARY_CATEGORIES } from '@/data/personaConfig'

// Exposes the current URL + how we got there, for the deep-link tests below.
function LocationProbe() {
  const loc = useLocation()
  const type = useNavigationType()
  return (
    <output data-testid="loc" data-nav={type}>
      {loc.search}
    </output>
  )
}

function renderWithProbe(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
      <LocationProbe />
    </MemoryRouter>
  )
}

function currentParams() {
  return new URLSearchParams(screen.getByTestId('loc').textContent ?? '')
}

beforeEach(() => usePersonaStore.getState().setPersona(null))

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

// Split from LibraryViewRedesign.test.tsx (2026-10-03): each test renders the whole Library view over
// the real corpus and the heap grows ~120 MB per test, so the full file reached ~4 GB and a CI worker
// hit the V8 heap limit. Running the deep-link tests in their own file gives each its own worker heap.
// Every test here renders the whole Library view over the real corpus (2-10 s alone, 20-40 s on a
// loaded machine); the default 30 s limit failed pr-test (1) on #797 ("forwards a retired ref"),
// and 8b's loaded local run. Same allowance as libraryTableDrawerParams.test.tsx (#782).
describe('LibraryViewRedesign deep links', { timeout: 60_000 }, () => {
  describe('deep-link arrival (?ref)', () => {
    it('closing the drawer replaces history (Back must not reopen it)', () => {
      renderWithProbe('/library?ref=FIPS%20203')
      fireEvent.click(
        within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Close' })[0]
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(currentParams().get('ref')).toBeNull()
      expect(screen.getByTestId('loc').dataset.nav).toBe('REPLACE')
    })

    it('forwards a retired ref to its successor and says so', () => {
      renderWithProbe('/library?ref=PKCS11-V32-OASIS')
      expect(currentParams().get('ref')).toBe('PKCS11-V32-OS-OASIS')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('deeplink-notice-moved')).toHaveTextContent(
        /PKCS11-V32-OASIS.*superseded by PKCS11-V32-OS-OASIS/
      )
    })

    it('shows a not-found notice for an unknown ref, and dismissing drops the ref', () => {
      renderWithProbe('/library?ref=NO-SUCH-DOC-XYZ')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      const notice = screen.getByTestId('deeplink-notice-not-found')
      expect(notice).toHaveTextContent('NO-SUCH-DOC-XYZ')
      fireEvent.click(within(notice).getByRole('button', { name: 'Dismiss notice' }))
      expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
      expect(currentParams().get('ref')).toBeNull()
    })

    it('widens only the filters hiding the linked doc, and Undo restores them', () => {
      const target = libraryData.find((i) => i.referenceId === 'FIPS 203')!
      const otherCat = ['Protocols', 'KEM', 'Digital Signature'].find(
        (c) => !target.categories.includes(c)
      )!
      renderWithProbe(
        `/library?cat=${encodeURIComponent(otherCat)}&org=NIST&ref=${encodeURIComponent('FIPS 203')}`
      )
      const p = currentParams()
      expect(p.get('cat')).toBeNull()
      expect(p.get('org')).toBe('NIST') // did not hide it — kept
      expect(p.get('ref')).toBe('FIPS 203')
      const notice = screen.getByTestId('deeplink-notice-widened')
      expect(notice).toHaveTextContent('Filters widened to show FIPS 203')
      fireEvent.click(within(notice).getByRole('button', { name: 'Undo' }))
      expect(currentParams().get('cat')).toBe(otherCat)
      expect(currentParams().get('ref')).toBe('FIPS 203')
      expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
    }, 30_000)

    it('turns role narrowing off (prefs=off) when it hides the linked doc', () => {
      const persona = (
        Object.keys(PERSONA_LIBRARY_CATEGORIES) as (keyof typeof PERSONA_LIBRARY_CATEGORIES)[]
      ).find((k) => (PERSONA_LIBRARY_CATEGORIES[k] ?? []).length > 0)!
      const preferred = PERSONA_LIBRARY_CATEGORIES[persona] ?? []
      const hidden = libraryData.find((i) => !i.categories.some((c) => preferred.includes(c)))!
      usePersonaStore.getState().setPersona(persona)
      renderWithProbe(`/library?ref=${encodeURIComponent(hidden.referenceId)}`)
      expect(currentParams().get('prefs')).toBe('off')
      expect(screen.getByTestId('deeplink-notice-widened')).toBeInTheDocument()
      // The card is now in the list, tagged for scroll-to/highlight.
      expect(
        document.querySelector(`[data-deeplink-id="${CSS.escape(hidden.referenceId)}"]`)
      ).not.toBeNull()
    }, 30_000)
  })
})
