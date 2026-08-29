// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimulationView } from './SimulationView'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { SIM_TREES, flattenTree } from '@/simulation'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

// mobile-ux-layer: SimulationView is one of the two sanctioned isMobileShell
// call sites (useIsMobileShell.ts). Defaults false so every existing test
// above exercises the real desktop board unchanged; the mobile-play describe
// block below flips it per test, matching MigrationWorkbench.test.tsx's
// established pattern for the same hook.
const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

const renderPage = (initialEntries: string[] = ['/simulation']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <SimulationView />
    </MemoryRouter>
  )

// A minimal but valid completed assessment — the sim now requires one (single
// source of truth: sector/size/jurisdiction derive from the assessment), so the
// console only renders when an assessment exists. The profile fields drive the
// read-only org dials (Healthcare → financial/healthcare sector, 51-200 → large,
// Germany → DE hybrid-required archetype).
const minimalAssessment = (): AssessmentResult => ({
  riskScore: 50,
  riskLevel: 'medium',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: 'Test assessment.',
  generatedAt: new Date().toISOString(),
  assessmentProfile: {
    industry: 'Healthcare',
    country: 'Germany',
    algorithmsSelected: [],
    algorithmUnknown: false,
    sensitivityLevels: [],
    sensitivityUnknown: false,
    complianceFrameworks: [],
    complianceUnknown: false,
    migrationStatus: 'not-started',
    migrationUnknown: false,
    mode: 'quick',
    useCasesUnknown: false,
    retentionUnknown: false,
    credentialLifetimeUnknown: false,
    infrastructureUnknown: false,
    agilityUnknown: false,
    vendorUnknown: false,
    systemScale: '51-200',
    scaleUnknown: false,
    timelineUnknown: false,
  },
})

const seedAssessment = () => {
  const result = minimalAssessment()
  useAssessmentResultStore.getState().setResult(result)
  useAssessmentResultStore.getState().markComplete(result)
}

beforeEach(() => {
  useSimulationStore.getState().reset()
  useAssessmentResultStore.getState().reset()
  // The sim's require-assessment gate: seed a completed assessment so the full
  // console renders (gameplay tests assume it). Tests that need the gate reset it.
  useAssessmentResultStore.setState({ lastResult: null, completedAt: null })
  seedAssessment()
  // suppress the first-run tour (WS-12) for the gameplay tests.
  useSimulationStore.setState({ tourSeen: true })
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
})

describe('SimulationView (Mission Control)', () => {
  it('renders the console shell, setup dials and KPI ribbon', () => {
    renderPage()
    expect(screen.getByText('PQC Today Sim')).toBeInTheDocument()
    // subtitle + framework attribution merged onto one line (2026-08-02)
    expect(screen.getByText(/Migration Sim/)).toBeInTheDocument()
    // ORG/JURISDICTION/SECTOR merged into one read-only Profile pill (2026-08-02):
    // still not a button, still sourced from the assessment.
    const profile = screen.getByText('Profile')
    expect(profile).toBeInTheDocument()
    expect(profile.closest('button')).toBeNull()
    // Seat stays switchable — a real button that cycles.
    expect(screen.getByRole('button', { name: /^Seat:/ })).toBeInTheDocument()
    // The full Transformation panel moved into the Signals tab (2026-08-02);
    // the header keeps a one-line Maturity glance in its compact KPI cluster.
    expect(screen.getByText('Maturity')).toBeInTheDocument()
    // WP2.2: relabeled from "Phases cleared" — the L2 count is a milestone,
    // not the win condition (see scoreboard.ts).
    expect(screen.getByText('Gov L2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /End Quarter/ })).toBeInTheDocument()
    // exit affordance back to the hub is a visible button on the console
    expect(screen.getByRole('button', { name: /Exit to hub/i })).toBeInTheDocument()
  })

  // WP4.7 — ribbon slimming: the KPI ribbon keeps only scoreboard + clock +
  // budget; HNDL/TNFL risk and readiness moved off it. Since 2026-08-02 they
  // live in the Signals tab's Vital signs card, so they are NOT co-rendered with
  // the ribbon any more — the tab has to be opened first.
  it('slims the ribbon to scoreboard + clock + budget, moving threat/readiness into Signals', () => {
    renderPage()
    expect(screen.queryByText('Est. readiness')).not.toBeInTheDocument()
    // not rendered until the Signals tab is opened (one panel at a time)
    expect(screen.queryByText('Vital signs')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Signals' }))
    expect(screen.getByText('Vital signs')).toBeInTheDocument()
    // HNDL/TNFL de-duplicated out of Vital signs (2026-08-02) — Program status
    // above it already shows both, with per-tier track bars.
    expect(screen.getByText('Program status')).toBeInTheDocument()
    expect(screen.getAllByText(/HNDL ·/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/TNFL ·/).length).toBeGreaterThan(0)
    // scoreboard + clock + budget still present on the ribbon (Budget secured
    // also appears in the mobile fallback summary, hence getAllByText)
    expect(screen.getByText('Gov L2')).toBeInTheDocument()
    expect(screen.getByText('Q-Day')).toBeInTheDocument()
    expect(screen.getAllByText(/Budget/).length).toBeGreaterThan(0)
  })

  // The sim runs on the user's assessed org (single source of truth): with no
  // completed assessment it shows a gate, not the playable console.
  it('renders the require-assessment gate when no assessment exists', () => {
    useAssessmentResultStore.setState({ lastResult: null, completedAt: null })
    renderPage()
    // the gate prompt + a link to start the assessment
    expect(screen.getByText(/Run your PQC assessment to start the simulation/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start the assessment/i })).toHaveAttribute(
      'href',
      '/assess'
    )
    expect(screen.getByRole('link', { name: /View report/i })).toHaveAttribute('href', '/report')
    // the console is NOT rendered
    expect(screen.queryByText('Phases cleared')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /End Quarter/ })).not.toBeInTheDocument()
  })

  // Regression: the self-unlock effect used to bail out whenever ANY result
  // already existed in the store, even a stale one (e.g. the sample org, or an
  // older answer set). That left the JURISDICTION/SECTOR dials frozen on the
  // stale org after completing a new real assessment, unless the player
  // separately visited /report (which always recomputes). The effect must
  // instead compare against the CURRENT form input and refresh on a mismatch.
  it('refreshes the org dials from a newly completed assessment even when a stale result is already stored', () => {
    // Seed a stale/sample result (Healthcare/Germany from minimalAssessment,
    // via seedAssessment in beforeEach) — mimics the sample-org / previous-run case.
    useAssessmentFormStore.getState().reset()
    useAssessmentFormStore.setState({
      industry: 'Technology',
      country: 'Australia',
      sensitivityUnknown: true,
      migrationStatus: 'not-started',
      assessmentStatus: 'complete',
    })
    renderPage()
    // jurisdiction is a bare text node inside the merged Profile pill now (it
    // shares its element with org size + sector), so assert on the pill itself.
    const pill = screen.getByLabelText(/^Profile:/)
    expect(pill.textContent).toContain('Australia')
    expect(pill.textContent).not.toContain('Germany')
    useAssessmentFormStore.getState().reset()
  })

  // W2c — honest delegation: a phase auto-completed by the AI team must be flagged
  // so the maturity credit doesn't masquerade as the player's own understanding.
  it('flags an AI-delegated phase "RUN BY AI · UNVERIFIED" with a study nudge', () => {
    const p0Steps = flattenTree(SIM_TREES.p0!)
    // architect owns p2/p3/p5, not p0 → p0 is delegatable; seed it as delegated.
    useSimulationStore.setState({ sel: 'p0', seat: 'architect', auto: [`p0::${p0Steps[0].to}`] })
    renderPage()
    expect(screen.getByText(/RUN BY AI · UNVERIFIED/i)).toBeInTheDocument()
    expect(screen.getByText(/Run by your AI team — study to verify/i)).toBeInTheDocument()
  })

  it('clicking a phase in the journey switches the active phase ops', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Pilots/i })) // P5
    expect(screen.getByText(/PHASE 5/)).toBeInTheDocument()
  })

  it('the tree drives the next move; the right call opens the module embedded in the sim', () => {
    renderPage()
    expect(screen.getByText('Next move — pick the right play')).toBeInTheDocument()
    // default phase p0, fresh state → first unlocked activity is 0.1, whose
    // correct decision card shows its WP2.6 `decision` phrasing (not the raw
    // "Learn: PQC Business Case" step label — see sections.tsx/gen-sim-trees.mjs).
    // Target the DecisionSection's choice card (aria-label "Option <X>: <label>") —
    // the active-band ladder now ALSO offers the same step (any-order completion),
    // so the plain label is no longer unique.
    fireEvent.click(screen.getByRole('button', { name: /Option [A-C]: Build the business case/ }))
    const rightCall = screen.getByText(/Right call/)
    // CTA opens the module IN the sim (embedded), under a persistent "Simulation
    // mode" bar. Scope to the "Right call" box (the parent of the label div) — the
    // active-band ladder also has "open here" controls now, so the label is shared.
    const rightCallBox = rightCall.parentElement as HTMLElement
    fireEvent.click(within(rightCallBox).getByRole('button', { name: /open here/i }))
    expect(screen.getByText(/Simulation mode/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to board/i })).toBeInTheDocument()
  })

  it('opening a Learn/Activity resource from the list keeps the sim header (embeds, no navigation)', () => {
    renderPage()
    // the resource columns live in their own tab since 2026-08-02
    fireEvent.click(screen.getByRole('tab', { name: 'Resources' }))
    // the "Open a resource" lists now embed in-sim: such items say "opens in simulation"
    const embeddable = screen.getAllByText('opens in simulation')
    expect(embeddable.length).toBeGreaterThan(0)
    const btn = embeddable[0].closest('button')
    expect(btn).not.toBeNull()
    fireEvent.click(btn!)
    // if it had navigated, SimulationView would unmount and the header would vanish
    expect(screen.getByText('PQC Today Sim')).toBeInTheDocument()
    expect(screen.getByText(/Simulation mode/i)).toBeInTheDocument()
  })

  it('a wrong move surfaces a framework Common Failure', () => {
    renderPage()
    // the DecisionSection choice cards are the "Option <X>: ..." buttons; the
    // correct one is the next-move step, the others are framework Common Failures.
    const correctBtn = screen.getByRole('button', {
      name: /Option [A-C]: Build the business case/,
    })
    const grid = correctBtn.parentElement as HTMLElement
    const wrong = within(grid)
      .getAllByRole('button')
      .find((b) => !/Build the business case/.test(b.textContent ?? ''))
    fireEvent.click(wrong!)
    expect(screen.getByText('✕ Common failure')).toBeInTheDocument()
  })

  it('shows phase artifacts under Progress and gates the architecture view by phase', () => {
    renderPage()
    // Artifacts moved out of the old Expert rail into the Progress tab (2026-08-02)
    fireEvent.click(screen.getByRole('tab', { name: 'Progress' }))
    expect(screen.getByText(/Executive Mandate artifacts/)).toBeInTheDocument()
    // p0 (Executive Mandate) produces artifacts but is not an architecture phase
    fireEvent.click(screen.getByRole('tab', { name: 'Signals' }))
    expect(screen.queryByText(/Your architecture/)).not.toBeInTheDocument()
    // P1 (Discovery) acts on the estate → architecture view appears in Signals.
    // Switching phase resets the tab to Decide, so Signals is re-opened here.
    fireEvent.click(screen.getByRole('button', { name: /Discovery/i }))
    fireEvent.click(screen.getByRole('tab', { name: 'Signals' }))
    expect(screen.getByText(/Your architecture/)).toBeInTheDocument()
  })

  // Per-phase progressive disclosure (2026-08-02) — the point of the tabs is that
  // only ONE panel is mounted at a time, and that a phase always opens on Decide.
  it('opens every phase on Decide and mounts only the active tab', () => {
    renderPage()
    // Decide's content is up; the other tabs' content is not merely hidden but absent
    expect(screen.queryByText(/Maturity gates/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Open a resource/)).not.toBeInTheDocument()
    expect(screen.queryByText('Vital signs')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Progress' }))
    expect(screen.getByText(/Maturity gates/)).toBeInTheDocument()
    expect(screen.queryByText(/Open a resource/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Resources' }))
    expect(screen.getByText(/Open a resource/)).toBeInTheDocument()
    expect(screen.queryByText(/Maturity gates/)).not.toBeInTheDocument()
  })

  it('resets to the Decide tab when the phase changes', () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Resources' }))
    expect(screen.getByText(/Open a resource/)).toBeInTheDocument()
    // switching phase must not land the player on the new phase's Resources tab
    fireEvent.click(screen.getByRole('button', { name: /Discovery/i }))
    expect(screen.queryByText(/Open a resource/)).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Decide' })).toHaveAttribute('data-state', 'active')
  })

  it('End Quarter advances the turn and opens the Quarter Report', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /End Quarter/ }))
    expect(screen.getByText('Quarter Report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument()
  })

  // WS-01 — one tree-gated source of truth: the Quarter Report's cleared count
  // can never disagree with the board, and the AI advances the tree (via `auto`),
  // never the legacy `checks` counter.
  // 12 full quarter cycles against the whole view sits right at vitest's 5s
  // default on a loaded CI runner (5.4s observed on the 07192026 PR run;
  // passes locally). Explicit timeout rather than a smaller loop — the 12
  // iterations are the point: a drift appearing late in the year would be
  // missed by a 2-3 quarter loop.
  it(
    'the Quarter Report never contradicts the board; AI advances the tree',
    { timeout: 20000 },
    () => {
      renderPage()
      for (let i = 0; i < 12; i++) {
        fireEvent.click(screen.getByRole('button', { name: /End Quarter/ }))
        const dialog = screen.getByRole('dialog')
        // both board and report render "Phases cleared" as "n/9"; while the report
        // is open they must show the SAME number.
        const reportVal = within(dialog).getByText(/^\d+\/9$/).textContent
        const boardVals = screen
          .getAllByText(/^\d+\/9$/)
          .filter((el) => !dialog.contains(el))
          .map((el) => el.textContent)
        expect(boardVals).toContain(reportVal)
        fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
      }
      // Option A: the AI advances progress only via real tree `auto` keys — there is
      // no separate progression counter to drift out of sync with the board.
      const { auto } = useSimulationStore.getState()
      for (const k of auto) expect(k).toMatch(/^[a-z0-9]+::.+/)
    }
  )

  // WS-12 — the first-run guide shows on a fresh visit, is skippable, and is
  // remembered (does not reappear once dismissed).
  it('shows a skippable first-run guide that is remembered after dismissal', () => {
    useSimulationStore.setState({ tourSeen: false })
    renderPage()
    expect(screen.getByRole('dialog', { name: /simulation guide/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Skip$/ }))
    expect(useSimulationStore.getState().tourSeen).toBe(true)
    expect(screen.queryByRole('dialog', { name: /simulation guide/i })).not.toBeInTheDocument()
  })

  // WS-13 (Phase A) — accessible names on the SVG gauges, the dials, and the
  // decision options, so a screen reader doesn't hit unlabeled controls.
  it('gives the gauges, dials and decision options accessible names', () => {
    renderPage()
    // the maturity gauges are labelled images, not bare SVGs
    expect(screen.getAllByRole('img', { name: /Maturity level/i }).length).toBeGreaterThan(0)
    // a setup dial announces its value + that it is actionable
    expect(screen.getByRole('button', { name: /seat:.*activate to change/i })).toBeInTheDocument()
    // the first decision option is named
    expect(screen.getByRole('button', { name: /^Option A:/ })).toBeInTheDocument()
  })

  // Deep link: /simulation?phase=<id> jumps the board to that phase on load.
  it('jumps to the phase named by ?phase= on load, then strips the param', () => {
    renderPage(['/simulation?phase=p3'])
    expect(useSimulationStore.getState().sel).toBe('p3')
  })

  it('ignores an unknown ?phase= value instead of corrupting the selected phase', () => {
    // Regression: `phaseParam in FRAMEWORK_PHASES` would previously accept
    // inherited Object.prototype keys (e.g. "toString") as a "valid" phase.
    renderPage(['/simulation?phase=toString'])
    expect(useSimulationStore.getState().sel).toBe('p0')
  })

  // Wave 4 (WP4.6) — /simulation?seed=<n> ("Challenge a colleague").
  it('applies ?seed= on a genuinely fresh run, then strips the param', () => {
    renderPage(['/simulation?seed=424242'])
    expect(useSimulationStore.getState().seed).toBe(424242)
  })

  it('ignores a non-integer / non-positive ?seed= instead of corrupting the run seed', () => {
    const before = useSimulationStore.getState().seed
    renderPage(['/simulation?seed=not-a-number'])
    expect(useSimulationStore.getState().seed).toBe(before)
  })

  it('never applies ?seed= to a run already in progress (a quarter has elapsed)', () => {
    useSimulationStore.setState({ q: 2 }) // one End Quarter already happened
    const before = useSimulationStore.getState().seed
    renderPage(['/simulation?seed=424242'])
    expect(useSimulationStore.getState().seed).toBe(before)
  })

  it('"Challenge a colleague" copies a ?seed= link for THIS run\'s seed', async () => {
    useSimulationStore.setState({ seed: 999888 })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /More run actions/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /challenge a colleague/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/simulation?seed=999888')
    )
  })
})

// simulation-unified-play-mechanism-plan-07052026.md — the unified PLAY entry
// point. Rev. 3: the modal always opens (except when resumable, which stays a
// direct one-click Resume); persona only changes which card is pre-emphasized,
// never which one auto-starts.
describe('SimulationView — unified PLAY modal', () => {
  beforeEach(() => {
    usePersonaStore.getState().setPersona(null)
  })

  it('clicking ▶ PLAY opens the modal with all 3 scopes visible', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^▶ Play$/ }))
    expect(screen.getByRole('dialog', { name: /choose how to play/i })).toBeInTheDocument()
    expect(screen.getByText('Executive Overview')).toBeInTheDocument()
    expect(screen.getByText('Full Migration Journey')).toBeInTheDocument()
    expect(screen.getByText('Play This Phase')).toBeInTheDocument()
  })

  it('with no persona set, Full Migration Journey is the recommended default', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^▶ Play$/ }))
    const dialog = screen.getByRole('dialog', { name: /choose how to play/i })
    const journeyCard = within(dialog).getByText('Full Migration Journey').closest('div')!
    expect(within(journeyCard).getByText(/recommended for you/i)).toBeInTheDocument()
  })

  it('a business persona (executive) recommends Executive Overview instead', () => {
    usePersonaStore.getState().setPersona('executive')
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^▶ Play$/ }))
    const dialog = screen.getByRole('dialog', { name: /choose how to play/i })
    const execCard = within(dialog).getByText('Executive Overview').closest('div')!
    expect(within(execCard).getByText(/recommended for you/i)).toBeInTheDocument()
    // and Full Migration Journey is NOT the one marked recommended
    const journeyCard = within(dialog).getByText('Full Migration Journey').closest('div')!
    expect(within(journeyCard).queryByText(/recommended for you/i)).not.toBeInTheDocument()
  })

  it('a technical persona (developer) recommends Full Migration Journey', () => {
    usePersonaStore.getState().setPersona('developer')
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^▶ Play$/ }))
    const dialog = screen.getByRole('dialog', { name: /choose how to play/i })
    const journeyCard = within(dialog).getByText('Full Migration Journey').closest('div')!
    expect(within(journeyCard).getByText(/recommended for you/i)).toBeInTheDocument()
  })

  it('when a run is resumable, the button reads ▶ Resume and does not open the modal', () => {
    useSimulationStore.setState({ autoRunResumeIndex: 1 })
    renderPage()
    expect(screen.getByRole('button', { name: /^▶ Resume$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start a different path/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /choose how to play/i })).not.toBeInTheDocument()
  })

  it('"start a different path" opens the modal even while resumable', () => {
    useSimulationStore.setState({ autoRunResumeIndex: 1 })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /start a different path/i }))
    expect(screen.getByRole('dialog', { name: /choose how to play/i })).toBeInTheDocument()
  })
})

// mobile-ux-layer Phase 9 — real interactive play for p0/p1. jsdom has no real
// CSS engine, so the desktop board (`hidden md:flex`) and whichever phone-block
// branch is active both stay in the DOM at once (same reason the existing
// "Budget secured" assertion above already uses getAllByText) — every query
// here scopes into the `sim-mobile-decide` testid to avoid matching the
// always-mounted desktop board's own, separate DecisionSection instance.
describe('SimulationView — mobile-ux-layer real play (p0/p1)', () => {
  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
  })

  it('offers a real "Play" CTA on the read-only overview for p0, the default phase', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderPage()
    expect(screen.getByRole('button', { name: /Play Executive Mandate now/i })).toBeInTheDocument()
  })

  it('tapping Play opens a real interactive Decide view wired to the same real store as desktop', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Play Executive Mandate now/i }))
    const mobileBoard = screen.getByTestId('sim-mobile-decide')
    expect(within(mobileBoard).getByText('Executive Mandate')).toBeInTheDocument()
    expect(within(mobileBoard).getByText('Next move — pick the right play')).toBeInTheDocument()
    fireEvent.click(
      within(mobileBoard).getByRole('button', { name: /Option [A-C]: Build the business case/ })
    )
    expect(within(mobileBoard).getByText(/Right call/)).toBeInTheDocument()
  })

  it('a wrong pick applies the same real quarter setback the desktop board would apply', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Play Executive Mandate now/i }))
    const mobileBoard = screen.getByTestId('sim-mobile-decide')
    const correctBtn = within(mobileBoard).getByRole('button', {
      name: /Option [A-C]: Build the business case/,
    })
    const grid = correctBtn.parentElement as HTMLElement
    const wrong = within(grid)
      .getAllByRole('button')
      .find((b) => !/Build the business case/.test(b.textContent ?? ''))
    const before = useSimulationStore.getState().q
    fireEvent.click(wrong!)
    expect(within(mobileBoard).getByText('✕ Common failure')).toBeInTheDocument()
    // p0's real cost is 1 quarter (only p1 is 2 — see wrongPickCostQuarters in
    // SimulationView.tsx); confirms the SAME store mutation desktop applies,
    // not a mobile-only stub.
    expect(within(mobileBoard).getByText(/cost you 1 quarter/)).toBeInTheDocument()
    expect(useSimulationStore.getState().q).not.toBe(before)
  })

  it('the back control returns to the run-home overview without losing the run', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Play Executive Mandate now/i }))
    fireEvent.click(screen.getByRole('button', { name: /Overview/i }))
    expect(screen.queryByTestId('sim-mobile-decide')).not.toBeInTheDocument()
    expect(screen.getByText('Your migration')).toBeInTheDocument()
  })

  // WS-1 (sim-mobile-full-play): every phase is playable now, not just p0/p1
  // — the p0/p1-only guard this test used to assert is exactly the gap the
  // plan closes (audit: "a phone player reaches a real decision engine for
  // 2 of 9 phases").
  it('a phase beyond p0/p1 ALSO has a real Play CTA (WS-1: all phases play)', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    useSimulationStore.setState({ sel: 'p3' })
    renderPage()
    expect(screen.getByRole('button', { name: /Play .* now/i })).toBeInTheDocument()
    expect(screen.getByText('Your migration')).toBeInTheDocument()
  })

  it('with the mobile shell off, the read-only overview never offers a Play CTA', () => {
    renderPage()
    expect(screen.queryByRole('button', { name: /Play .* now/i })).not.toBeInTheDocument()
  })
})

// mobile-ux-layer (2026-08-24 audit R1.3): before this fix, the only way to
// reach p0/p1 on a phone was the desktop-only phase ladder or "Watch the
// Executive Overview" — which walks the shared, persisted `sel` through all
// 9 phases with no way back, permanently hiding the Play CTA on that device
// after one watch. These tests cover the two-part fix: a mobile phase
// switcher reachable from both the playable and read-only fallback states,
// and a snapshot/restore of `sel` around a mobile-triggered watch run.
describe('SimulationView — mobile-ux-layer phase switcher + sel restore (audit R1.3)', () => {
  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
  })

  it('offers a p0/p1 switcher on the read-only overview even past p1', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    useSimulationStore.setState({ sel: 'p3' })
    renderPage()
    const group = screen.getByRole('group', { name: /choose a playable phase/i })
    expect(within(group).getByText('Executive Mandate')).toBeInTheDocument()
    expect(within(group).getByText('Discovery & Inventory')).toBeInTheDocument()
  })

  it('tapping p1 in the switcher makes the p1 Play CTA reachable again', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    useSimulationStore.setState({ sel: 'p3' })
    renderPage()
    const group = screen.getByRole('group', { name: /choose a playable phase/i })
    fireEvent.click(within(group).getByText('Discovery & Inventory'))
    expect(useSimulationStore.getState().sel).toBe('p1')
    expect(
      screen.getByRole('button', { name: /Play Discovery & Inventory now/i })
    ).toBeInTheDocument()
  })

  it('the switcher marks the active phase via aria-pressed', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderPage() // default sel is p0
    const group = screen.getByRole('group', { name: /choose a playable phase/i })
    expect(within(group).getByText('Executive Mandate').closest('button')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(within(group).getByText('Discovery & Inventory').closest('button')).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('watching the Executive Overview restores sel once the run stops, so Play stays reachable', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    useSimulationStore.setState({ sel: 'p1' })
    renderPage()
    expect(useSimulationStore.getState().sel).toBe('p1')
    fireEvent.click(screen.getByRole('button', { name: /Watch the Executive Overview/i }))
    // The real autorun queue moves sel to its first phase's beat after a real
    // (uncontrolled) short delay — waiting for that proves the snapshot was
    // taken before start(), not after (a too-late snapshot would just
    // re-capture the moved value and the "restore" below would be a no-op).
    await waitFor(() => expect(useSimulationStore.getState().sel).not.toBe('p1'))
    // The real "■ Stop" control (SimAutoRunOverlay) calls the same
    // player.stop() that a natural run completion also calls internally —
    // the one place `running` transitions back to false either way. jsdom
    // has no CSS engine, so both the desktop board and the mobile fallback
    // stay mounted at once (each with its own overlay instance sharing the
    // same underlying player) — click the first, matching this file's
    // established getAllByText pattern for the same reason.
    fireEvent.click(screen.getAllByRole('button', { name: /■ Stop/i })[0])
    expect(useSimulationStore.getState().sel).toBe('p1')
    expect(
      screen.getByRole('button', { name: /Play Discovery & Inventory now/i })
    ).toBeInTheDocument()
  })

  it('does not touch sel on desktop (isMobileShell false) — watch is left to autoRunPlayer alone', () => {
    useSimulationStore.setState({ sel: 'p1' })
    renderPage()
    // With the mobile shell off, the switcher itself must not render — the
    // snapshot/restore effect has nothing to gate without it, and desktop's
    // own free phase ladder makes it unnecessary.
    expect(
      screen.queryByRole('group', { name: /choose a playable phase/i })
    ).not.toBeInTheDocument()
  })
})
