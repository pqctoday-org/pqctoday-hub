// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'

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

describe('LibraryViewRedesign', () => {
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
    const allCount = screen.getByText(/\d+ documents?/i).textContent
    // The page only reads selectedPersona now — persona changes come from the
    // shared top-bar role switcher, so drive the store directly here rather
    // than clicking a local control (LibraryRoleLens was removed).
    act(() => {
      usePersonaStore.getState().setPersona('architect')
    })
    const narrowedCount = screen.getByText(/\d+ documents?/i).textContent
    expect(narrowedCount).not.toBeNull()
    // Architect has a non-empty preferred-category set, so the grid changes.
    expect(narrowedCount).not.toBe(allCount)
  }, 30_000)

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
})
