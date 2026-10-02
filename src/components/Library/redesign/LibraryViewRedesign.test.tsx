// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, within, fireEvent } from '@testing-library/react'
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

function renderView(initial = '/library') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
    </MemoryRouter>
  )
}

beforeEach(() => usePersonaStore.getState().setPersona(null))

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

// Every test here renders the whole Library view over the real corpus (2-10 s alone, 20-40 s on a
// loaded machine); the default 30 s limit failed pr-test (1) on #797 ("forwards a retired ref"),
// and 8b's loaded local run. Same allowance as libraryTableDrawerParams.test.tsx (#782).
describe('LibraryViewRedesign', { timeout: 60_000 }, () => {
  it('renders a populated results grid and does not render its own persona picker', () => {
    renderView()
    // At least one document card opens the drawer (role=button with the refId).
    expect(screen.getAllByText(/document/i).length).toBeGreaterThan(0)
    // The shared top-bar role switcher is the app's single global persona/role
    // control (design program cross-cutting rule) — LibraryRoleLens was removed,
    // so the page must not render a second one.
    expect(
      screen.queryByRole('radiogroup', { name: /viewing the library as/i })
    ).not.toBeInTheDocument()
  })

  it('opens the detail drawer when a result card is clicked (?ref deep-link seam)', () => {
    // Seed a known ref so the drawer is open on first render.
    renderView('/library?ref=FIPS%20203')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('surfaces all prior revisions of a multi-revision document in the drawer', () => {
    // NIST-FIPS140-3-IG-PQC collapses an earlier edition into priorRevisions.
    renderView('/library?ref=NIST-FIPS140-3-IG-PQC')
    const drawer = screen.getByRole('dialog')
    expect(within(drawer).getByText(/Previous revisions/i)).toBeInTheDocument()
    expect(within(drawer).getByText('NIST-FIPS-140-3-IG-Sep-2025-PQC')).toBeInTheDocument()
  })

  // Explicit timeout: this is the heaviest test in the file — it renders the
  // whole Library view over the full document corpus, then forces a complete
  // re-filter and re-render by changing persona. It takes ~2.5s on a dev
  // machine, and the GitHub runner is roughly 8x slower on this suite (565s
  // there vs ~70s locally), which puts it over vitest's 5s default. It timed
  // out in CI on 2026-08-02 while passing locally and in earlier CI runs —
  // borderline, not broken. Measured with and without that day's setup.ts
  // cleanup() change: 2.5s either way, so the timeout is about runner speed,
  // not about anything the test or the harness is doing wrong.
  it('a persona set globally (top-bar control) narrows the grid to its focus areas (architect ≠ all docs)', () => {
    renderView()
    const allCount = screen.getByText(/^\d+ documents?$/i).textContent
    // The page only reads selectedPersona now — persona changes come from the
    // shared top-bar role switcher, so drive the store directly here rather
    // than clicking a local control (LibraryRoleLens was removed).
    act(() => {
      usePersonaStore.getState().setPersona('architect')
    })
    const narrowedCount = screen.getByText(/^\d+ documents?$/i).textContent
    expect(narrowedCount).not.toBeNull()
    // Architect has a non-empty preferred-category set, so the grid changes.
    expect(narrowedCount).not.toBe(allCount)
  }, 60_000)

  // Mobile UX layer (Phase 7). LibraryEmbed.tsx renders this same component
  // inside the simulation at whatever viewport the player is on (simEmbed
  // prop) — O-3 (IMPLEMENTATION-PLAN.md) keeps /simulation entirely outside
  // the mobile shell, so simEmbed must win over isMobileShell regardless of
  // viewport width.
  describe('mobile shell guard', () => {
    afterEach(() => {
      mockUseIsMobileShell.mockReturnValue(false)
    })

    it('renders the mobile screen when isMobileShell is true and not sim-embedded', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      renderView()
      expect(screen.getByText('Library')).toBeInTheDocument()
      expect(screen.queryByText('PQC Library')).not.toBeInTheDocument()
    })

    it('still renders the full desktop view when simEmbed is true, even if isMobileShell is true', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <LibraryViewRedesign simEmbed />
        </MemoryRouter>
      )
      expect(screen.queryByText('Library')).not.toBeInTheDocument()
    })
  })

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
