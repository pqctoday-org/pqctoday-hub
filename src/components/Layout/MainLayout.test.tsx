// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MainLayout } from './MainLayout'
import { usePersonaStore } from '../../store/usePersonaStore'
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

function renderLayout(initialEntry = '/') {
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
        </Route>
      </Routes>
    </MemoryRouter>
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
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument()
    })

    it('renders the outlet content', () => {
      renderLayout()
      expect(screen.getByText('Timeline Page')).toBeInTheDocument()
    })

    it('displays footer', () => {
      renderLayout()
      expect(screen.getByText(/© 2025 PQC Today/)).toBeInTheDocument()
    })
  })

  describe('Rail — no persona selected (null)', () => {
    it('shows a collapsed "For You" header with no rows, and MORE holds the full universe', () => {
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByText('For You')).toBeInTheDocument()
      expect(within(rail).getByText('Everything, unfiltered')).toBeInTheDocument()
      expect(within(rail).getByText('More')).toBeInTheDocument()
      // Migrate has no persona-specific gating reason to hide — it must show up in MORE.
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
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

    it('places persona nav paths under FOR YOU and leaves the rest in MORE', () => {
      renderLayout()
      const rail = getRailNav()
      // /migrate is in developer's PERSONA_NAV_PATHS
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
      // /leaders ("Community") is NOT in developer's PERSONA_NAV_PATHS — still
      // reachable, just in MORE.
      expect(within(rail).getByRole('button', { name: /community view/i })).toBeInTheDocument()
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

    it('adds a direct CACP shortcut row', () => {
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByRole('button', { name: /cacp view/i })).toBeInTheDocument()
      // The row's visible text matches its rendered label, so the anchor's own
      // accessible name (computed from content) is just "CACP".
      expect(within(rail).getByRole('link', { name: 'CACP' })).toHaveAttribute(
        'href',
        '/playground/cacp'
      )
    })
  })

  describe('Rail — curious and researcher personas keep every route reachable', () => {
    it('curious: /business is deprioritized into MORE, not hidden', () => {
      usePersonaStore.getState().setPersona('curious')
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByRole('button', { name: /command center view/i })).toBeInTheDocument()
    })

    it('researcher: FOR YOU is collapsed (no gating persona)', () => {
      usePersonaStore.getState().setPersona('researcher')
      renderLayout()
      const rail = getRailNav()
      expect(within(rail).getByText('Everything, unfiltered')).toBeInTheDocument()
      expect(within(rail).getByRole('button', { name: /migrate view/i })).toBeInTheDocument()
    })
  })

  describe('Top bar', () => {
    it('shows a region/industry pill falling back to the persona default when the store is untouched', () => {
      usePersonaStore.getState().setPersona('executive')
      renderLayout()
      // Real RegionIndustryPill.test.tsx covers the live-vs-default logic in
      // depth; this just pins that MainLayout actually wires it in.
      const pill = screen.getByRole('button', { name: /region and industry/i })
      expect(pill).toHaveTextContent('Americas')
    })

    it('shows "Global" with no persona selected and no custom region/industry set', () => {
      renderLayout()
      expect(screen.getByRole('button', { name: /region and industry/i })).toHaveTextContent(
        'Global'
      )
    })

    it('reads a LIVE selectedRegion from the store instead of the persona default', () => {
      usePersonaStore.getState().setPersona('executive')
      usePersonaStore.getState().setRegion('apac')
      renderLayout()
      expect(screen.getByRole('button', { name: /region and industry/i })).toHaveTextContent('APAC')
    })

    it('opens the region/industry pill editor on click', () => {
      renderLayout()
      fireEvent.click(screen.getByRole('button', { name: /region and industry/i }))
      expect(screen.getByRole('dialog', { name: /edit region and industry/i })).toBeInTheDocument()
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
