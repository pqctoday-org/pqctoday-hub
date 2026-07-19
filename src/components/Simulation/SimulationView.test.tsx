// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SimulationView } from './SimulationView'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { SIM_TREES, flattenTree } from '@/simulation'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

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
  // suppress the first-run tour (WS-12) for the gameplay tests; guided defaults
  // to false (Expert console) — reset() preserves it like tourSeen, so a test
  // that flips it must not leak into the next one.
  useSimulationStore.setState({ tourSeen: true, guided: false })
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
})

describe('SimulationView (Mission Control)', () => {
  it('renders the console shell, setup dials and KPI ribbon', () => {
    renderPage()
    expect(screen.getByText('PQC Today Sim')).toBeInTheDocument()
    expect(screen.getByText('PQC Migration Simulation')).toBeInTheDocument()
    // ORG is now read-only (sourced from the assessment) — label has no ⟳ glyph,
    // and the dial is not a button.
    const org = screen.getByText('ORG')
    expect(org).toBeInTheDocument()
    expect(org.textContent).not.toContain('⟳')
    expect(org.closest('button')).toBeNull()
    // SEAT stays switchable — it keeps the ⟳ glyph on a button.
    expect(screen.getByText('SEAT ⟳')).toBeInTheDocument()
    expect(screen.getByText(/Transformation/)).toBeInTheDocument()
    // WP2.2: relabeled from "Phases cleared" — the L2 count is a milestone,
    // not the win condition (see scoreboard.ts).
    expect(screen.getByText('Governance floor (L2)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /End Quarter/ })).toBeInTheDocument()
    // exit affordance back to the hub is a visible button on the console
    expect(screen.getByRole('button', { name: /Exit to hub/i })).toBeInTheDocument()
  })

  // WP4.7 — ribbon slimming: the KPI ribbon keeps only scoreboard + clock +
  // budget; HNDL/TNFL risk and readiness moved to the Expert rail's pinned
  // "Threat & readiness" panel (Guided mode never sees the rail at all).
  it('slims the ribbon to scoreboard + clock + budget, moving threat/readiness to the Expert rail', () => {
    renderPage()
    expect(screen.queryByText('Est. readiness')).not.toBeInTheDocument()
    expect(screen.getByText('Threat & readiness')).toBeInTheDocument()
    expect(screen.getAllByText('HNDL risk').length).toBeGreaterThan(0)
    expect(screen.getAllByText('TNFL risk').length).toBeGreaterThan(0)
    // scoreboard + clock + budget still present on the ribbon (Budget secured
    // also appears in the mobile fallback summary, hence getAllByText)
    expect(screen.getByText('Governance floor (L2)')).toBeInTheDocument()
    expect(screen.getByText('Years to Q-Day')).toBeInTheDocument()
    expect(screen.getAllByText('Budget secured').length).toBeGreaterThan(0)
  })

  it('hides the Expert rail (and its Threat & readiness panel) in Guided mode', () => {
    useSimulationStore.setState({ guided: true })
    renderPage()
    expect(screen.queryByText('Threat & readiness')).not.toBeInTheDocument()
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
    expect(screen.getByText('Australia')).toBeInTheDocument()
    expect(screen.queryByText('Germany')).not.toBeInTheDocument()
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

  it('right column shows phase artifacts and gates the architecture view by phase', () => {
    renderPage()
    // p0 (Executive Mandate) produces artifacts but is not an architecture phase
    expect(screen.getByText(/Executive Mandate artifacts/)).toBeInTheDocument()
    expect(screen.queryByText(/Your architecture/)).not.toBeInTheDocument()
    // P1 (Discovery) acts on the estate → architecture view appears, now behind
    // the Expert rail's "Show more" disclosure (PR3)
    fireEvent.click(screen.getByRole('button', { name: /Discovery/i }))
    fireEvent.click(screen.getByRole('button', { name: /Show \d+ more panel/i }))
    expect(screen.getByText(/Your architecture/)).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: /⋯ MORE/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /^▶ PLAY$/ }))
    expect(screen.getByRole('dialog', { name: /choose how to play/i })).toBeInTheDocument()
    expect(screen.getByText('Executive Overview')).toBeInTheDocument()
    expect(screen.getByText('Full Migration Journey')).toBeInTheDocument()
    expect(screen.getByText('Play This Phase')).toBeInTheDocument()
  })

  it('with no persona set, Full Migration Journey is the recommended default', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^▶ PLAY$/ }))
    const dialog = screen.getByRole('dialog', { name: /choose how to play/i })
    const journeyCard = within(dialog).getByText('Full Migration Journey').closest('div')!
    expect(within(journeyCard).getByText(/recommended for you/i)).toBeInTheDocument()
  })

  it('a business persona (executive) recommends Executive Overview instead', () => {
    usePersonaStore.getState().setPersona('executive')
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^▶ PLAY$/ }))
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
    fireEvent.click(screen.getByRole('button', { name: /^▶ PLAY$/ }))
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
