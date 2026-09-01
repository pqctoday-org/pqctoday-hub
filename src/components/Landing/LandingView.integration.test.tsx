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
import { PERSONA_JOURNEY_BOARD } from '@/data/personaConfig'
import {
  ALGORITHM_COUNT_ESTIMATE,
  TIMELINE_EVENT_COUNT_ESTIMATE,
  LIBRARY_COUNT_ESTIMATE,
} from '@/data/landingCounts.generated'
import { usePersonaStore } from '../../store/usePersonaStore'
import { NAV_PATH_LABELS } from '../../data/personaConfig'
import { getRailSections } from '../Layout/railNav'
import type { PersonaId } from '../../data/learningPersonas'
import '@testing-library/jest-dom'

vi.mock('../../vite-env.d.ts', () => ({
  __BUILD_TIMESTAMP__: 'Dec 6, 2024, 5:00 PM CST',
}))

// WhatsNewModal is React.lazy in MainLayout (precache-budget: its
// dataFingerprint dependency statically imports nine full datasets). This
// suite mounts the real MainLayout and relies on OTHER lazy chunks
// (MobileBottomBar) resolving within findBy*'s default window; evaluating
// WhatsNewModal's chunk concurrently — megabytes of synchronous CSV parsing
// — starves that window on a loaded CI runner (deterministic failure there,
// not locally). Irrelevant to what this file tests, so it's mocked out —
// same fix already applied to MainLayout.mobileShell.test.tsx for the
// identical reason.
vi.mock('../ui/WhatsNewModal', () => ({
  WhatsNewModal: () => null,
  getUnseenChangelogSections: () => [],
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

/** Accessible-name matcher per FOR YOU sub-group toggle — fixed literal
 *  regexes, not built from a dynamic string, so this stays lint-clean
 *  (mirrors MainLayout.test.tsx's identical helper). */
const FOR_YOU_GROUP_TOGGLE_NAME: Record<'Workflow' | 'Practice' | 'Reference', RegExp> = {
  Workflow: /(show|hide) workflow/i,
  Practice: /(show|hide) practice/i,
  Reference: /(show|hide) reference/i,
}

/** Expands every FOR YOU sub-group toggle that's currently collapsed.
 *  Workflow/Practice start expanded; Reference starts collapsed (2026-08-01
 *  per-group collapse follow-up) — clicking an already-expanded toggle would
 *  wrongly re-collapse it, so this only clicks ones reporting
 *  aria-expanded="false". */
function expandAllForYouGroups(rail: HTMLElement) {
  for (const label of ['Workflow', 'Practice', 'Reference'] as const) {
    const toggle = within(rail).queryByRole('button', {
      name: FOR_YOU_GROUP_TOGGLE_NAME[label],
    })
    if (toggle?.getAttribute('aria-expanded') === 'false') fireEvent.click(toggle)
  }
}

/** Every route in the given persona's FOR YOU set (railNav.ts's
 *  getRailSections — the same pure invariant railNav.test.ts pins) must have
 *  a clickable desktop rail row, run here against the actual rendered DOM
 *  after a real LandingView mount. Home/About/Learn/Timeline/Threats are
 *  always reachable regardless of persona (see MainLayout.tsx).
 *
 *  NOTE (2026-08-01 rail declutter follow-up: "remove more and revisions from
 *  the left bar"): this is deliberately narrower than the old
 *  `expectFullRailCoverage`, which asserted every route in NAV_PATH_LABELS —
 *  including MORE's routes — had a rail row. That invariant is no longer
 *  true: the desktop rail's MORE section was removed entirely, so a route
 *  outside the current persona's FOR YOU (e.g. developer's /leaders) now has
 *  NO desktop rail row at all, by design — only reachable via ⌘K search, a
 *  direct URL, or the (untouched) mobile "More" sheet. */
function expectDesktopRailCoversForYou(persona: PersonaId | null) {
  const rail = getRailNav()
  expandAllForYouGroups(rail)
  expect(within(rail).getByRole('link', { name: /home view/i })).toBeInTheDocument()
  expect(within(rail).getByRole('link', { name: /about view/i })).toBeInTheDocument()
  expect(within(rail).getByRole('link', { name: /learn view/i })).toBeInTheDocument()
  expect(within(rail).getByRole('link', { name: /timeline view/i })).toBeInTheDocument()
  expect(within(rail).getByRole('link', { name: /threats view/i })).toBeInTheDocument()

  const { forYou } = getRailSections(persona)
  for (const path of forYou) {
    // eslint-disable-next-line security/detect-object-injection -- path comes from getRailSections' own return value, not user input
    const label = NAV_PATH_LABELS[path]
    expect(within(rail).getByRole('link', { name: `${label} view` })).toBeInTheDocument()
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
    localStorage.removeItem('pqc-feature-mobile-shell')
  })

  it('no persona, not skipped: renders Role Home, and the rail still covers every FOR YOU route', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /who's asking/i })).toBeInTheDocument()
    expectDesktopRailCoversForYou(null)
  })

  it('"Show me everything" never shows Role Home again, and behaves like today\'s null-persona Landing', () => {
    usePersonaStore.setState({ hasSkippedPersonalization: true })
    renderApp()
    expect(screen.queryByRole('heading', { name: /who's asking/i })).not.toBeInTheDocument()
    expect(screen.getByText(/the quantum era is/i)).toBeInTheDocument()
    expectDesktopRailCoversForYou(null)
  })

  it('hero stats bar renders real numbers on first paint, never the "..." placeholder', () => {
    // REGRESSION (plan Track B4): algorithmCount/timelineEventCount/libraryCount
    // used to start as `null` (rendering '...') until an async CSV load resolved.
    // They're now seeded from src/data/landingCounts.generated.ts, so a number
    // must be present synchronously on the very first render — no `act`/await,
    // no waiting for the useEffect's dynamic imports to settle.
    usePersonaStore.setState({ hasSkippedPersonalization: true })
    renderApp()
    expect(screen.getByText('Timeline Events')).toBeInTheDocument()
    expect(screen.getByText(String(ALGORITHM_COUNT_ESTIMATE))).toBeInTheDocument()
    expect(screen.getByText(String(TIMELINE_EVENT_COUNT_ESTIMATE))).toBeInTheDocument()
    expect(screen.getByText(String(LIBRARY_COUNT_ESTIMATE))).toBeInTheDocument()
    expect(screen.queryByText('...')).not.toBeInTheDocument()
  })

  it('a selected persona renders PersonaBoardView (not the old hero), with full FOR YOU rail coverage', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    renderApp()
    expect(screen.queryByRole('heading', { name: /who's asking/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/the quantum era is/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /five minutes to a real ml-kem handshake/i })
    ).toBeInTheDocument()
    expectDesktopRailCoversForYou('developer')
    // Regression guard (2026-08-01 follow-up: "remove more and revisions from
    // the left bar") — /leaders ("Community") is NOT in developer's FOR YOU;
    // MORE used to carry it, that section is gone now, so it has no desktop
    // rail row at all.
    const rail = getRailNav()
    expect(within(rail).queryByRole('link', { name: /community view/i })).not.toBeInTheDocument()
  })

  it('curious on a desktop-width viewport gets PersonaBoardView, not CuriousMobileBoard', () => {
    mockViewport(false)
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderApp()
    // Read from the data, not a literal: which board curious OPENS on is a
    // ranking decision that has already moved once (2026-08-09, `break` ->
    // `short`), and this assertion is about which COMPONENT rendered.
    expect(
      screen.getByRole('heading', { name: PERSONA_JOURNEY_BOARD.curious.headline })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Curious mobile navigation')).not.toBeInTheDocument()
    expectDesktopRailCoversForYou('curious')
  })

  it("curious below the `lg` breakpoint on '/' gets CuriousMobileBoard, with MainLayout's own header/footer suppressed, WHEN the new mobile UX layer is explicitly opted out", () => {
    // The mobile-shell flag defaults ON as of 2026-08-23 (a deliberate
    // go-live decision — see featureFlags.ts), and LandingView's own
    // isMobileShell branch supersedes this legacy CuriousMobileBoard
    // treatment by priority ordering (Phase 4). CuriousMobileBoard itself
    // hasn't been deleted (physical removal is a later phase) and should
    // still work correctly for anyone who explicitly opts back out — that's
    // what this test verifies now; the new-default supersession case has
    // its own test right below.
    localStorage.setItem('pqc-feature-mobile-shell', '0')
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

  it("curious below the `lg` breakpoint on '/' gets the new mobile UX layer (default), NOT the legacy CuriousMobileBoard", async () => {
    // No localStorage set at all — exercises the real 2026-08-23 default.
    mockViewport(true)
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderApp()

    // The new mobile shell's bottom nav (MobileBottomBar) is React.lazy —
    // findBy* (async) is required for it to resolve, unlike the legacy
    // CuriousMobileBoard path other tests in this file exercise.
    expect(await screen.findByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Curious mobile navigation')).not.toBeInTheDocument()
  })

  it("curious below `lg` on a DIFFERENT route keeps MainLayout's normal chrome (takeover is '/'-only)", () => {
    mockViewport(true)
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderApp('/library')

    expect(screen.getByText('Library Page')).toBeInTheDocument()
    expect(screen.queryByLabelText('Curious mobile navigation')).not.toBeInTheDocument()
    // Year is computed via `new Date().getFullYear()` in MainLayout's footer
    // (Grade-A perf-infra fix — was a hardcoded literal), so assert against
    // the real current year, not a pinned one.
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} PQC Today`))
    ).toBeInTheDocument()
    expectDesktopRailCoversForYou('curious')
  })
})
