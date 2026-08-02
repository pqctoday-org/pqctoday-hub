// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, type ReactNode } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MainLayout } from './MainLayout'
import { getRailSections } from './railNav'
import { usePersonaStore } from '../../store/usePersonaStore'
import { usePageActionsStore } from '../../store/usePageActionsStore'
import '@testing-library/jest-dom'

// Mock the build timestamp
vi.mock('../../vite-env.d.ts', () => ({
  __BUILD_TIMESTAMP__: 'Dec 6, 2024, 5:00 PM CST',
}))

// Simple test components for routes
const TestTimeline = () => <div>Timeline Page</div>
const TestAbout = () => <div>About Page</div>
const TestMigrate = () => <div>Migrate Page</div>
const TestSimulation = () => <div>Simulation Page</div>
const TestOpenssl = () => <div>OpenSSL Page</div>
const TestBusinessTools = () => <div>Business Tools Page</div>
const TestExplore = () => <div>Explore Page</div>
const TestCompliance = () => <div>Compliance Page</div>

const TestReport = () => <div>Report Page</div>

function renderLayout(initialEntry = '/', reportElement: ReactNode = <TestReport />) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<TestTimeline />} />
          <Route path="/about" element={<TestAbout />} />
          <Route path="/migrate" element={<TestMigrate />} />
          <Route path="/simulation" element={<TestSimulation />} />
          <Route path="/openssl" element={<TestOpenssl />} />
          <Route path="/business/tools" element={<TestBusinessTools />} />
          <Route path="/timeline" element={<div>Real Timeline Page</div>} />
          <Route path="/explore" element={<TestExplore />} />
          <Route path="/compliance" element={<TestCompliance />} />
          <Route path="/report" element={reportElement} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

/** Accessible-name matcher per FOR YOU sub-group toggle — a fixed literal
 * regex per group (not built from a dynamic string) so this stays a plain,
 * lint-clean matcher rather than a non-literal RegExp construction. */
const FOR_YOU_GROUP_TOGGLE_NAME: Record<'Workflow' | 'Practice' | 'Reference', RegExp> = {
  Workflow: /(show|hide) workflow/i,
  Practice: /(show|hide) practice/i,
  Reference: /(show|hide) reference/i,
}

/** Clicks a FOR YOU sub-group's collapsible toggle — Workflow/Practice/
 * Reference (2026-08-01 rail declutter follow-up). The desktop rail's old
 * single MORE toggle was removed entirely; each sub-group now has its own
 * disclosure button instead. All three groups start expanded as of
 * 2026-08-02. Scoped to the rail landmark. */
function toggleForYouGroup(rail: HTMLElement, groupLabel: 'Workflow' | 'Practice' | 'Reference') {
  fireEvent.click(
    // eslint-disable-next-line security/detect-object-injection -- groupLabel is drawn from the typed literal union above, not user input
    within(rail).getByRole('button', { name: FOR_YOU_GROUP_TOGGLE_NAME[groupLabel] })
  )
}

/** The desktop rail's own nav landmark — distinct from the mobile row's
 * "Main navigation" landmark, both of which are always present in jsdom
 * (which does not evaluate the `hidden lg:flex` responsive CSS). */
function getRailNav() {
  return screen.getByRole('navigation', { name: /primary navigation/i })
}

function getMobileNav() {
  return screen.getByRole('navigation', { name: /main navigation/i })
}

describe('MainLayout', () => {
  afterEach(() => {
    usePersonaStore.getState().setPersona(null)
    // Full reset — a couple of tests below call setRegion()/setState() directly
    // to exercise the live-vs-persona-default pill logic, which setPersona(null)
    // alone does not undo.
    usePersonaStore.setState({
      selectedRegion: 'global',
      selectedIndustries: [],
      hasSkippedPersonalization: false,
    })
  })

  describe('Structure', () => {
    it('renders the banner, rail nav, mobile nav, and main content landmarks', () => {
      renderLayout()

      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(getRailNav()).toBeInTheDocument()
      expect(getMobileNav()).toBeInTheDocument()
    })

    it('displays the brand wordmark and build timestamp', () => {
      renderLayout()
      expect(screen.getByText('PQC Today')).toBeInTheDocument()
      // The "Last Updated:" label prefix was dropped (2026-08-01) — the rail
      // now shows the bare build timestamp string. __BUILD_TIMESTAMP__ is a
      // vite `define`-injected global (see vite-env.d.ts), not an importable
      // module export, so mocking vite-env.d.ts above has no runtime effect —
      // match the real "Mon D, YYYY" format instead of a fixed mocked string.
      expect(screen.getByText(/\w{3} \d{1,2}, \d{4}/)).toBeInTheDocument()
    })

    it('renders the outlet content', () => {
      renderLayout()
      expect(screen.getByText('Timeline Page')).toBeInTheDocument()
    })

    it('displays footer', () => {
      renderLayout()
      // Year is computed via `new Date().getFullYear()` (Grade-A perf-infra
      // fix — was a hardcoded literal that would silently go stale every
      // January), so assert against the real current year, not a pinned one.
      const year = new Date().getFullYear()
      expect(screen.getByText(new RegExp(`© ${year} PQC Today`))).toBeInTheDocument()
    })
  })

  describe('Rail — no persona selected (null)', () => {
    it('shows no "For You" label (removed 2026-08-01), the "Everything, unfiltered" fallback with Learn/Timeline/Threats as plain rows, and every other route reachable via the restored MORE fallback', () => {
      renderLayout()
      const rail = getRailNav()
      // The "For You" section label was removed entirely (2026-08-01) — only
      // the Workflow/Practice/Reference sub-group headers remain, and those
      // only render when FOR YOU has rows to group in the first place.
      expect(within(rail).queryByText('For You')).not.toBeInTheDocument()
      expect(within(rail).getByText('Everything, unfiltered')).toBeInTheDocument()
      // forYou.length === 0 (no persona) means there's no 'reference' group to
      // carry Learn/Timeline/Threats — they fall back to plain rows right
      // after the "Everything, unfiltered" text instead.
      expect(within(rail).getByRole('button', { name: /learn view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /timeline view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /threats view/i })).toBeInTheDocument()
      // Reachability fix (Grade-A remediation Phase 2, 2026-08-02): the
      // desktop rail's MORE section was removed entirely in the 2026-08-01
      // declutter follow-up ("remove more and revisions from the left bar"),
      // which silently orphaned every route for exactly this persona — the
      // one whose FOR YOU is legitimately empty. MainLayout now renders
      // `more` unconditionally (no collapse toggle — there's nothing else to
      // navigate with, so nothing to hide it behind) whenever FOR YOU is
      // empty, restoring a real desktop rail row for all 13 previously
      // orphaned routes, including the core funnel (/assess, /report).
      expect(within(rail).getByText('More')).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /compliance view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /assess view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /report view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /command center view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /business tools view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /simulation view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /playground view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /explore view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /algorithms view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /library view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /community view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /patents view/i })).toBeInTheDocument()
      // /revisions stays excluded from this restored fallback — that specific
      // 2026-08-01 decision is unrelated to the reachability bug and is
      // deliberately preserved (still reachable via ⌘K search, direct URL, or
      // the mobile "More" sheet, same as for every other persona).
      expect(
        within(rail).queryByRole('button', { name: /revisions view/i })
      ).not.toBeInTheDocument()
    })

    it('always-visible pages (Home/Learn/Timeline/Threats/About) render outside FOR YOU/MORE', () => {
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByRole('button', { name: /home view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /learn view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /timeline view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /threats view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /about view/i })).toBeInTheDocument()
    })

    it('never renders /openssl as its own rail row', () => {
      renderLayout()
      const rail = getRailNav()
      expect(
        within(rail).queryByRole('button', { name: /openssl studio view/i })
      ).not.toBeInTheDocument()
    })

    it('does not show the WIP chip', () => {
      renderLayout()
      expect(screen.queryByText('WIP')).not.toBeInTheDocument()
    })

    it('does not add the architect-only CACP shortcut', () => {
      renderLayout()
      expect(screen.queryByRole('button', { name: /cacp view/i })).not.toBeInTheDocument()
    })
  })

  describe('Rail — developer persona', () => {
    beforeEach(() => {
      usePersonaStore.getState().setPersona('developer')
    })

    it('places persona nav paths under FOR YOU (Workflow); MORE is gone entirely so out-of-FOR-YOU paths have no desktop rail row at all', () => {
      renderLayout()
      const rail = getRailNav()
      // /migrate is in developer's PERSONA_NAV_PATHS, under the Workflow group.
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
      // /leaders ("Community") is NOT in developer's PERSONA_NAV_PATHS. It used
      // to live in the collapsible MORE section; that section was removed
      // entirely (2026-08-01 follow-up: "remove more and revisions from the
      // left bar"), so Community has no desktop rail row for developer now —
      // only reachable via ⌘K search, direct URL, or the (untouched) mobile
      // "More" sheet.
      expect(
        within(rail).queryByRole('button', { name: /show more pages/i })
      ).not.toBeInTheDocument()
      expect(
        within(rail).queryByRole('button', { name: /community view/i })
      ).not.toBeInTheDocument()
    })

    // 2026-08-01 final self-review correction: developer's '/simulation' row
    // used to get the dashed "marked" treatment, justified by an "exit-
    // affordance fix pending" claim that turned out to be false — the general
    // console's "Exit to hub" link (SimulationView.tsx) already shipped well
    // before this branch existed (commits 691eb55a0 / 6ee1e91f3). It now
    // renders like any other real, reachable route — see
    // personaConfig.ts's PERSONA_MARKED_NAV_PATHS doc comment.
    it('gives /simulation the plain/active treatment, NOT dashed (exit-affordance dependency already shipped)', () => {
      renderLayout('/simulation')
      const rail = getRailNav()
      const button = within(rail).getByRole('button', { name: /simulation view/i })
      expect(button.className).not.toMatch(/border-dashed/)
      expect(button.className).toMatch(/border-l-primary/)
    })

    it('does not show the WIP chip (developer has no marked rows post-correction)', () => {
      renderLayout()
      expect(screen.queryByText('WIP')).not.toBeInTheDocument()
    })
  })

  describe('Rail — executive persona', () => {
    beforeEach(() => {
      usePersonaStore.getState().setPersona('executive')
    })

    it('gives /simulation the featured (accent) treatment, not dashed', () => {
      renderLayout()
      const rail = getRailNav()
      const button = within(rail).getByRole('button', { name: /simulation view/i })
      expect(button.className).toMatch(/border-l-accent/)
      expect(button.className).not.toMatch(/border-dashed/)
      expect(button).toHaveAttribute('title', expect.stringContaining('Executive Overview'))
    })

    it('gives /playground the dashed "marked" treatment', () => {
      renderLayout()
      const rail = getRailNav()
      const button = within(rail).getByRole('button', { name: /playground view/i })
      expect(button.className).toMatch(/border-dashed/)
    })

    it('shows the WIP chip (executive has a marked row: /playground)', () => {
      renderLayout()
      expect(screen.getByText('WIP')).toBeInTheDocument()
    })
  })

  describe('Rail — architect persona', () => {
    beforeEach(() => {
      usePersonaStore.getState().setPersona('architect')
    })

    it('does NOT add a direct CACP shortcut row (removed 2026-08-01: "CACP is fold in playground no direct access")', () => {
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).queryByRole('button', { name: /cacp view/i })).not.toBeInTheDocument()
      expect(within(rail).queryByRole('link', { name: 'CACP' })).not.toBeInTheDocument()
      // CACP is reachable via the Playground grid's own featured card only —
      // /playground itself is still a real row for architect.
      expect(within(rail).getByRole('button', { name: /playground view/i })).toBeInTheDocument()
    })
  })

  describe('Rail — curious and researcher personas keep every route reachable', () => {
    it('curious: /business (Command Center) has no desktop rail row at all now — MORE was removed entirely, not just collapsed', () => {
      usePersonaStore.getState().setPersona('curious')
      renderLayout()
      const rail = getRailNav()
      // /business is NOT in curious's PERSONA_NAV_PATHS (railNav.ts's pure
      // getRailSections still puts it in `more` — see railNav.test.ts's
      // "curious: /business" membership check), but MainLayout no longer
      // renders `more` on the desktop rail at all (2026-08-01 follow-up), so
      // Command Center has no row here. Still reachable via ⌘K search, direct
      // URL, or the (untouched) mobile "More" sheet.
      expect(
        within(rail).queryByRole('button', { name: /show more pages/i })
      ).not.toBeInTheDocument()
      expect(
        within(rail).queryByRole('button', { name: /command center view/i })
      ).not.toBeInTheDocument()
    })

    it('researcher: gets the STANDARD grouped rail (Workflow/Practice/Reference), not the flat no-persona fallback, and every route stays reachable', () => {
      usePersonaStore.getState().setPersona('researcher')
      renderLayout()
      const rail = getRailNav()
      // 2026-08-02: researcher previously shared the no-persona flat fallback
      // ("Everything, unfiltered" + a MORE dump). It is an explicit choice, not
      // an absence of one, so it now renders the same grouped rail as every
      // other persona. PERSONA_NAV_PATHS.researcher stays null — ReportContent
      // and GuidedTour branch on that null to mean "sees everything" — so only
      // getRailSections' presentation changed.
      expect(within(rail).queryByText('Everything, unfiltered')).not.toBeInTheDocument()
      expect(within(rail).queryByText('More')).not.toBeInTheDocument()
      expect(within(rail).getByText(/workflow/i)).toBeInTheDocument()
      expect(within(rail).getByText(/reference/i)).toBeInTheDocument()
      // Learn/Timeline/Threats live inside Reference, which is COLLAPSED by
      // default for every persona (2026-08-01 "collapse reference by default").
      // Their header is present; the rows appear on expand, same as elsewhere.
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /compliance view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /assess view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /report view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /command center view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /business tools view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /simulation view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /playground view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /explore view/i })).toBeInTheDocument()
      // Reference members (Algorithms, Library, Community, Patents, plus the
      // render-added Learn/Timeline/Threats) are inside the collapsed group —
      // asserted against getRailSections directly instead, so this test checks
      // reachability rather than the default collapse state.
      const { forYou } = getRailSections('researcher')
      for (const path of ['/algorithms', '/library', '/leaders', '/patents']) {
        expect(forYou).toContain(path)
      }
      // /revisions stays excluded — same deliberate 2026-08-01 decision as the
      // no-persona case above, unrelated to this reachability fix.
      expect(
        within(rail).queryByRole('button', { name: /revisions view/i })
      ).not.toBeInTheDocument()
      expect(forYou).not.toContain('/revisions')
    })
  })

  // 2026-08-01 rail declutter follow-up: live-review feedback called the rail
  // "too cluttered" and asked for "collapsible [sections] and better
  // organization" — MORE now defaults collapsed, and FOR YOU is chunked into
  // fixed Workflow/Practice/Reference sub-groups (railNav.ts's
  // getForYouGroups).
  describe('Rail — MORE section removed entirely (declutter follow-up, 2026-08-01: "remove more and revisions from the left bar")', () => {
    it('renders no MORE toggle and no MORE rows for any persona, even one with a non-empty MORE set', () => {
      usePersonaStore.getState().setPersona('developer')
      renderLayout()
      const rail = getRailNav()
      expect(
        within(rail).queryByRole('button', { name: /(show|hide) more pages/i })
      ).not.toBeInTheDocument()
      // developer's MORE (railNav.ts) = /explore, /leaders — neither renders
      // anywhere in the desktop rail now.
      expect(within(rail).queryByRole('button', { name: /explore view/i })).not.toBeInTheDocument()
      expect(
        within(rail).queryByRole('button', { name: /community view/i })
      ).not.toBeInTheDocument()
    })

    it('/revisions has no desktop rail row for any persona (dropped from every PERSONA_NAV_PATHS array, and MORE — which would have carried it — is gone)', () => {
      for (const persona of ['executive', 'developer', 'architect', 'ops', 'curious'] as const) {
        usePersonaStore.getState().setPersona(persona)
        const { unmount } = renderLayout()
        expect(screen.queryByRole('button', { name: /revisions view/i })).not.toBeInTheDocument()
        unmount()
      }
    })
  })

  describe('Rail — FOR YOU sub-groups are independently collapsible (declutter follow-up, 2026-08-01: "collapse is per section not just a more at the end")', () => {
    // Learn was promoted out of Reference to its own row directly under Home
    // (2026-08-02). Reference starts collapsed, so Learn used to be one expand
    // away from being visible at all — for a primary destination, not standing
    // lookup material. These three lock in the move; nothing previously
    // asserted Learn's position (the collapse tests probe Reference via
    // /library view/), so the old placement could have regressed silently.
    it('Learn is the second rail row, directly after Home', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      const rail = getRailNav()
      const rows = within(rail)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label') ?? '')
        .filter((n) => /view$/i.test(n))
      expect(rows[0]).toMatch(/home view/i)
      expect(rows[1]).toMatch(/learn view/i)
    })

    it('Learn stays visible while Reference is collapsed', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      const rail = getRailNav()
      // Every group now starts EXPANDED (2026-08-02), so collapse Reference
      // explicitly — the property under test is that Learn survives it, which
      // is independent of what the default happens to be.
      toggleForYouGroup(rail, 'Reference')
      expect(within(rail).queryByRole('button', { name: /library view/i })).not.toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /learn view/i })).toBeInTheDocument()
    })

    it('renders exactly one Learn row once Reference is expanded', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      const rail = getRailNav()
      // Reference is expanded by default as of 2026-08-02, so no toggle needed.
      // The regression this guards: leaving '/learn' in the Reference display
      // list as well as the new unconditional row would render it twice.
      expect(within(rail).getAllByRole('button', { name: /learn view/i })).toHaveLength(1)
    })

    it('Workflow, Practice AND Reference all start expanded (2026-08-02)', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByRole('button', { name: /hide workflow/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      )
      expect(within(rail).getByRole('button', { name: /hide practice/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      )
      // Reference collapsed by default from 2026-08-01 until 2026-08-02, when
      // it was reopened — collapsing it hid Algorithms, Library, Leaders,
      // Patents, Timeline and Threats on a fresh visit.
      expect(within(rail).getByRole('button', { name: /hide reference/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      )
      // All three groups' rows are therefore visible without any interaction.
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /simulation view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /library view/i })).toBeInTheDocument()
    })

    it('clicking the Reference toggle reveals its rows and flips aria-expanded/its label; clicking again re-collapses', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      const rail = getRailNav()
      const toggle = () => within(rail).getByRole('button', { name: /(show|hide) reference/i })

      // Starts EXPANDED as of 2026-08-02, so the round-trip runs the other way.
      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
      expect(within(rail).getByRole('button', { name: /library view/i })).toBeInTheDocument()

      fireEvent.click(toggle())
      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(toggle()).toHaveAccessibleName(/show reference/i)
      expect(within(rail).queryByRole('button', { name: /library view/i })).not.toBeInTheDocument()

      fireEvent.click(toggle())
      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
      expect(toggle()).toHaveAccessibleName(/hide reference/i)
      expect(within(rail).getByRole('button', { name: /library view/i })).toBeInTheDocument()
    })

    it('auto-expands Reference when the CURRENT route lives in it, so active-route highlighting is never hidden behind a collapsed section', () => {
      usePersonaStore.getState().setPersona('executive')
      // Reference's displayPaths include /timeline appended at render time
      // (MainLayout.tsx) even though /timeline itself isn't PERSONA_NAV_PATHS-
      // gated; Reference starts collapsed by default. /timeline is used here
      // (rather than e.g. /library) because it's one of the few routes this
      // test file's <Routes> actually registers a page for.
      renderLayout('/timeline')
      const rail = getRailNav()
      expect(within(rail).getByRole('button', { name: /hide reference/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      )
      const timelineButton = within(rail).getByRole('button', { name: /timeline view/i })
      expect(timelineButton).toHaveAttribute('aria-current', 'page')
    })

    it('manually collapsing Workflow (which starts expanded) works when no active route lives in it', () => {
      usePersonaStore.getState().setPersona('executive')
      // /simulation is Practice, not Workflow — Workflow has no active route.
      renderLayout('/simulation')
      const rail = getRailNav()
      const toggle = () => within(rail).getByRole('button', { name: /(show|hide) workflow/i })
      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
      fireEvent.click(toggle())
      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(within(rail).queryByRole('button', { name: /migrate view/i })).not.toBeInTheDocument()
    })
  })

  describe('Rail — FOR YOU is chunked into Workflow/Practice/Reference sub-groups', () => {
    it('renders all three sub-group headers for a persona whose rows span all three (executive)', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByText('Workflow')).toBeInTheDocument()
      expect(within(rail).getByText('Practice')).toBeInTheDocument()
      expect(within(rail).getByText('Reference')).toBeInTheDocument()
      // Grouping is presentational only — every row is still reachable.
      // All three groups start expanded (2026-08-02), so every row is visible
      // without interaction.
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /simulation view/i })).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /library view/i })).toBeInTheDocument()
    })

    it('renders the standard sub-group headers for researcher (2026-08-02)', () => {
      usePersonaStore.getState().setPersona('researcher')
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByText('Workflow')).toBeInTheDocument()
      expect(within(rail).getByText('Practice')).toBeInTheDocument()
      expect(within(rail).getByText('Reference')).toBeInTheDocument()
    })

    it('renders no sub-group headers when FOR YOU is genuinely empty (no persona)', () => {
      usePersonaStore.getState().setPersona(null)
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).queryByText('Workflow')).not.toBeInTheDocument()
      expect(within(rail).queryByText('Practice')).not.toBeInTheDocument()
      expect(within(rail).queryByText('Reference')).not.toBeInTheDocument()
    })
  })

  describe('Top bar', () => {
    // The standalone RegionIndustryPill was merged into the persona/role
    // switcher button (2026-08-01 follow-up: "merge the persona filtering in
    // one drop down" / "become a persona dropdown") — RegionIndustryPill.tsx
    // and its test file were deleted entirely. The same live-vs-persona-
    // default region/industry fallback logic now drives the ONE button's
    // visible `roleLabel`, and clicking it opens PersonaSwitchModal, which now
    // also contains the region/industry FilterDropdown pickers.
    it('shows a region/industry summary falling back to the persona default when the store is untouched', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      const button = screen.getByRole('button', { name: /switch role/i })
      expect(button).toHaveTextContent('Americas')
    })

    it('shows "Global" with no persona selected and no custom region/industry set', () => {
      renderLayout()
      expect(screen.getByRole('button', { name: /switch role/i })).toHaveTextContent('Global')
    })

    it('reads a LIVE selectedRegion from the store instead of the persona default', () => {
      usePersonaStore.getState().setPersona('executive')
      usePersonaStore.getState().setRegion('apac')
      renderLayout()
      expect(screen.getByRole('button', { name: /switch role/i })).toHaveTextContent('APAC')
    })

    it('opens the persona-switch modal (which now carries the folded-in region/industry pickers) on click', () => {
      renderLayout()
      fireEvent.click(screen.getByRole('button', { name: /switch role/i }))
      const dialog = screen.getByRole('dialog', { name: /switch your role/i })
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByText('Region')).toBeInTheDocument()
      expect(within(dialog).getByText('Industry')).toBeInTheDocument()
    })

    it('shows the role switcher with the active persona label', () => {
      usePersonaStore.getState().setPersona('developer')
      renderLayout()
      expect(screen.getByRole('button', { name: /switch role/i })).toHaveTextContent(
        'Developer / Engineer'
      )
    })

    it('falls back to "Everyone" with no persona selected', () => {
      renderLayout()
      expect(screen.getByRole('button', { name: /switch role/i })).toHaveTextContent('Everyone')
    })

    it('renders the ⌘K search chip', () => {
      renderLayout()
      expect(screen.getByRole('button', { name: /search \(⌘k\)/i })).toBeInTheDocument()
    })

    it('renders Sources on a route with a registered ViewType, omits it elsewhere', () => {
      renderLayout('/migrate')
      expect(
        screen.getByRole('button', { name: /view authoritative sources/i })
      ).toBeInTheDocument()
    })

    // Final self-review finding (2026-08-01): ux-standard.md P10 has a MUST
    // NOT rule against rendering SourcesButton on /compliance (its own
    // provenance comes from inline TrustPathPopover, not the generic
    // authoritative-sources list) — ComplianceView's own (now-removed)
    // PageHeader call enforced this with `suppressSources`, but the global
    // top bar's ROUTE_VIEW_TYPE map (introduced by the nav rebuild, before
    // this fixup session) never modeled that suppression at all. Fixed by
    // omitting '/compliance' from ROUTE_VIEW_TYPE.
    it('omits Sources on /compliance (ux-standard.md P10 MUST NOT — provenance is inline via TrustPathPopover, not the generic Sources list)', () => {
      renderLayout('/compliance')
      expect(
        screen.queryByRole('button', { name: /view authoritative sources/i })
      ).not.toBeInTheDocument()
    })

    // PageHeader-consolidation follow-up (2026-08-01): /openssl's own PageHeader
    // call (now removed) passed viewType="Library" — ROUTE_VIEW_TYPE must keep
    // covering it so the global Sources button doesn't regress on this route.
    it('renders Sources on /openssl (viewType carried over from its removed PageHeader call)', () => {
      renderLayout('/openssl')
      expect(
        screen.getByRole('button', { name: /view authoritative sources for library/i })
      ).toBeInTheDocument()
    })

    // Same follow-up: BusinessToolsGrid ('/business/tools') passed
    // pageId="business-center" on its own removed PageHeader call — a nested
    // route distinct from '/business' (BusinessCenterView), so it needs its
    // own ROUTE_PAGE_ID entry rather than inheriting '/business''s.
    it('renders the Guide button on /business/tools (pageId carried over from its removed PageHeader call)', () => {
      renderLayout('/business/tools')
      expect(screen.getByRole('button', { name: /open page guide/i })).toBeInTheDocument()
    })

    // PageHeader-consolidation follow-up: bespoke shareTitle strings that used
    // to live on each page's own (now-removed) PageHeader call must survive on
    // the global ShareButton instead of falling back to the generic
    // "{route label} — PQC Today" title.
    it("uses the bespoke share title preserved from /timeline's removed PageHeader call", () => {
      renderLayout('/timeline')
      expect(
        screen.getByRole('button', {
          name: /share pqc migration timeline — global post-quantum cryptography roadmap/i,
        })
      ).toBeInTheDocument()
    })

    it('falls back to the generic share title on a route with no bespoke shareTitle (e.g. /migrate)', () => {
      renderLayout('/migrate')
      expect(screen.getByRole('button', { name: /share migrate — pqc today/i })).toBeInTheDocument()
    })

    // BUG FIX (Grade-A remediation Phase 2, top-bar Share correctness —
    // pqctoday-priv/grade-a-remediation/PLAN-00-TOP-CONNECTING-PLAN.md §6,
    // PLAN-02-CORE-FUNNEL.md): the top-bar ShareButton used to always share
    // `window.location.href`, which on /report is the bare `/report` path —
    // a recipient with no local assessment state lands on "No Report Yet"
    // even though the sender got a success toast. /report now registers a
    // real, self-contained token URL via `usePageActionsStore` (see
    // ReportView.tsx), and the top bar must actually use it instead of its
    // generic fallback.
    describe('top-bar Share URL uses a page-registered pageActions.url when present', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: vi.fn().mockResolvedValue(undefined) },
          writable: true,
          configurable: true,
        })
      })

      afterEach(() => {
        usePageActionsStore.getState().clearPageActions()
      })

      it("copies the page-registered share URL (e.g. /report's token link), not window.location.href", async () => {
        const registeredUrl = 'https://pqctoday.example/report?share=eyJ2IjoyLCJyZXN1bHQiOnt9fQ'
        const TestReportWithShareUrl = () => {
          useEffect(() => {
            usePageActionsStore
              .getState()
              .setPageActions({ title: 'PQC Assessment Report', url: registeredUrl })
            return () => usePageActionsStore.getState().clearPageActions()
          }, [])
          return <div>Report Page</div>
        }
        renderLayout('/report', <TestReportWithShareUrl />)

        fireEvent.click(screen.getByRole('button', { name: /share pqc assessment report/i }))
        fireEvent.click(screen.getByText('Copy link'))

        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(registeredUrl)
        })
      })

      it('falls back to window.location.href on a route with no registered pageActions.url (e.g. /migrate)', async () => {
        renderLayout('/migrate')

        fireEvent.click(screen.getByRole('button', { name: /share migrate — pqc today/i }))
        fireEvent.click(screen.getByText('Copy link'))

        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href)
        })
        const copied = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock
          .calls[0][0] as string
        expect(copied).not.toContain('share=')
      })
    })
  })

  describe('Active route highlighting', () => {
    it('marks the active route with aria-current in the rail', () => {
      renderLayout('/about')
      const rail = getRailNav()
      const button = within(rail).getByRole('button', { name: /about view/i })
      expect(button).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Mobile "More" sheet', () => {
    it('opens on click and lists overflow destinations', () => {
      renderLayout()
      const mobileNav = getMobileNav()
      const moreButton = within(mobileNav).getByRole('button', { name: /more navigation options/i })
      fireEvent.click(moreButton)
      expect(screen.getByRole('dialog', { name: /more navigation/i })).toBeInTheDocument()
    })
  })

  // "Update your profile" deep link — PQC101Module's two links (repointed
  // 2026-08-01 from `?scroll=persona`) and AboutNextStepCTA's fallback both
  // land on `/?picker=open` now that PersonalizationSection (which used to
  // handle both param names itself) is retired.
  describe('"?picker=open" deep link', () => {
    it('opens the persona-switch modal when a persona is already selected', () => {
      usePersonaStore.getState().setPersona('developer')
      renderLayout('/?picker=open')
      expect(screen.getByRole('dialog', { name: /switch your role/i })).toBeInTheDocument()
    })

    it('opens the persona-switch modal for a "show me everything" visitor (no persona, but skipped)', () => {
      usePersonaStore.setState({ hasSkippedPersonalization: true })
      renderLayout('/?picker=open')
      expect(screen.getByRole('dialog', { name: /switch your role/i })).toBeInTheDocument()
    })

    it('no-ops when Role Home would already cover it (no persona, not skipped)', () => {
      renderLayout('/?picker=open')
      expect(screen.queryByRole('dialog', { name: /switch your role/i })).not.toBeInTheDocument()
    })
  })
})
