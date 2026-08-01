// SPDX-License-Identifier: GPL-3.0-only
/**
 * End-to-end integration coverage for the persona-journeys A-grade redesign's
 * wiring (IMPLEMENTATION-PLAN-2026-08-01.md §7 "Full pass" / §8 "Testing
 * impact"): mounts the REAL `MainLayout` wrapping the REAL `LandingView` at
 * '/' — the exact composition `App.tsx` uses in production — rather than a
 * stub route component. This is deliberately a level up from:
 *   - `railNav.test.ts` (pure-function reachability invariant, no DOM)
 *   - `MainLayout.test.tsx` (mounts MainLayout, but with stub route content)
 *   - `PersonaBoardView.test.tsx` / `RoleHomeView.test.tsx` (mount those
 *     components directly, never nested under MainLayout)
 *
 * so it catches wiring bugs none of those can see: a wrong prop name between
 * LandingView and RoleHomeView/PersonaBoardView, or MainLayout's own rail
 * losing route coverage once LandingView starts rendering something other
 * than the old hero.
 *
 * Covers the reachability invariant end-to-end for three real LandingView
 * states (no persona/no skip → Role Home; a gated persona → PersonaBoardView;
 * "show me everything" → the unchanged original Landing), plus the one
 * deliberate exception (Curious + below-`lg` viewport → CuriousMobileBoard,
 * where MainLayout suppresses its own header/footer chrome so the two don't
 * double up — see MainLayout.tsx's `isCuriousMobileTakeover`).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MainLayout } from '../Layout/MainLayout'
import { LandingView } from './LandingView'
import { usePersonaStore } from '../../store/usePersonaStore'
import { NAV_PATH_LABELS, RAIL_HIDDEN_PATHS } from '../../data/personaConfig'
import '@testing-library/jest-dom'

vi.mock('../../vite-env.d.ts', () => ({
  __BUILD_TIMESTAMP__: 'Dec 6, 2024, 5:00 PM CST',
}))

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingView />} />
          <Route path="/library" element={<div>Library Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

function getRailNav() {
  return screen.getByRole('navigation', { name: /primary navigation/i })
}

/** Every real route (minus RAIL_HIDDEN_PATHS, which deliberately never gets
 *  its own rail row — see personaConfig.ts) must have a clickable rail row,
 *  regardless of what LandingView renders in the main content area. This is
 *  the same invariant railNav.test.ts pins at the pure-function level, run
 *  here against the actual rendered DOM after a real LandingView mount. */
function expectFullRailCoverage() {
  const rail = getRailNav()
  // MORE is collapsed by default (2026-08-01 rail declutter follow-up) —
  // expand it first so this full-coverage check still sees every row, not
  // just FOR YOU + the 5 always-visible paths. If the active route already
  // auto-expanded it (see MainLayout's isMoreSectionActive), the toggle's
  // accessible name is already "Hide more pages…" and this is a no-op.
  const moreToggle = within(rail).queryByRole('button', { name: /show more pages/i })
  if (moreToggle) fireEvent.click(moreToggle)
  const universe = Object.keys(NAV_PATH_LABELS).filter((p) => !RAIL_HIDDEN_PATHS.includes(p))
  for (const path of universe) {
    // eslint-disable-next-line security/detect-object-injection -- path comes from Object.keys(NAV_PATH_LABELS) itself
    const label = NAV_PATH_LABELS[path]
    expect(within(rail).getByRole('button', { name: `${label} view` })).toBeInTheDocument()
  }
}

/** Mocks `window.matchMedia` for the one query `useIsBelowLgViewport` issues,
 *  mirroring the hook's own test double. */
function mockViewport(isBelowLg: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: isBelowLg,
      media: '(max-width: 1023px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
}

describe('LandingView wired end-to-end under the real MainLayout', () => {
  beforeEach(() => {
    // Full reset, bypassing action side effects (setPersona also touches
    // viewAccess/niceTier) — this test cares only about these two fields.
    usePersonaStore.setState({ selectedPersona: null, hasSkippedPersonalization: false })
  })

  afterEach(() => {
    usePersonaStore.setState({ selectedPersona: null, hasSkippedPersonalization: false })
    vi.unstubAllGlobals()
  })

  it('no persona, not skipped: renders Role Home, and the rail still covers every route', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /who's asking/i })).toBeInTheDocument()
    expectFullRailCoverage()
  })

  it('"Show me everything" never shows Role Home again, and behaves like today\'s null-persona Landing', () => {
    usePersonaStore.setState({ hasSkippedPersonalization: true })
    renderApp()
    expect(screen.queryByRole('heading', { name: /who's asking/i })).not.toBeInTheDocument()
    expect(screen.getByText(/the quantum era is/i)).toBeInTheDocument()
    expectFullRailCoverage()
  })

  it('a selected persona renders PersonaBoardView (not the old hero), with full rail coverage', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    renderApp()
    expect(screen.queryByRole('heading', { name: /who's asking/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/the quantum era is/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /five minutes to a real ml-kem handshake/i })
    ).toBeInTheDocument()
    expectFullRailCoverage()
  })

  it('curious on a desktop-width viewport gets PersonaBoardView, not CuriousMobileBoard', () => {
    mockViewport(false)
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderApp()
    expect(
      screen.getByRole('heading', { name: /what actually breaks, and when/i })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Curious mobile navigation')).not.toBeInTheDocument()
    expectFullRailCoverage()
  })

  it("curious below the `lg` breakpoint on '/' gets CuriousMobileBoard, with MainLayout's own header/footer suppressed", () => {
    mockViewport(true)
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderApp()

    // CuriousMobileBoard's own persistent bottom tab bar is present.
    expect(screen.getByLabelText('Curious mobile navigation')).toBeInTheDocument()

    // Exactly one `banner` landmark exists — CuriousMobileBoard's own header,
    // not a duplicate stacked on top of MainLayout's.
    expect(screen.getAllByRole('banner')).toHaveLength(1)

    // MainLayout's own mobile nav row ("Main navigation" — nested inside the
    // now-suppressed <header>, distinct from the desktop rail's "Primary
    // navigation" landmark, which jsdom keeps in the DOM regardless since it
    // does not evaluate `hidden lg:flex` — see MainLayout.test.tsx's own note)
    // is gone for this screen.
    expect(screen.queryByRole('navigation', { name: /main navigation/i })).not.toBeInTheDocument()

    // The site footer (Terms/Editorial Independence/Sponsor) is suppressed
    // too — it would otherwise render underneath CuriousMobileBoard's fixed
    // bottom nav.
    expect(screen.queryByText(/© 2025 PQC Today/)).not.toBeInTheDocument()
  })

  it("curious below `lg` on a DIFFERENT route keeps MainLayout's normal chrome (takeover is '/'-only)", () => {
    mockViewport(true)
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderApp('/library')

    expect(screen.getByText('Library Page')).toBeInTheDocument()
    expect(screen.queryByLabelText('Curious mobile navigation')).not.toBeInTheDocument()
    expect(screen.getByText(/© 2025 PQC Today/)).toBeInTheDocument()
    expectFullRailCoverage()
  })
})
