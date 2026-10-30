// SPDX-License-Identifier: AGPL-3.0-only
//
// ACCURACY-0708-2: a shared/example /report link must render an EPHEMERAL,
// read-only view — it must never write into the recipient's own persisted
// assessment or persona store, regardless of what the recipient's own state
// already is. (Supersedes the older ACCURACY-0705 fix, which only blocked
// the overwrite when the recipient already had an assessment — leaving the
// no-prior-assessment case still mutating their store on every open.)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Link } from 'react-router'
import '@testing-library/jest-dom'
import { ReportView } from './ReportView'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useAssessmentFormStore } from '../../store/useAssessmentFormStore'
import { useAssessmentResultStore } from '../../store/useAssessmentResultStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { encodeShareToken, decodeShareToken } from '@/utils/reportShareToken'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import type { AssessmentInput } from '@/hooks/assessmentTypes'
import { EXAMPLE_REPORT_RESULT } from '@/data/exampleReport'
import { usePageActionsStore } from '@/store/usePageActionsStore'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)
const reportContentSpy = vi.fn()
vi.mock('./ReportContent', () => ({
  ReportContent: (props: unknown) => {
    reportContentSpy(props)
    return <div data-testid="report-content" />
  },
}))
vi.mock('./ReportToc', () => ({ ReportToc: () => <div data-testid="report-toc" /> }))
vi.mock('./ReportNextSteps', () => ({
  ReportNextSteps: () => <div data-testid="report-next-steps" />,
}))
vi.mock('@/components/Assess/PersonaSuggestionCard', () => ({
  PersonaSuggestionCard: () => <div data-testid="persona-suggestion-card" />,
}))
vi.mock('@/hooks/useAwarenessScore', () => ({
  useAwarenessScore: () => ({ score: 0, tier: 'novice' }),
}))
vi.mock('@/hooks/useWorkflowPhaseTracker', () => ({ useWorkflowPhaseTracker: () => {} }))

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

const SAMPLE_INPUT: AssessmentInput = {
  industry: 'Finance & Banking',
  currentCrypto: ['RSA-2048'],
  dataSensitivity: ['high'],
  complianceRequirements: ['PCI DSS'],
  migrationStatus: 'planning',
}
const SAMPLE_RESULT = computeAssessment(SAMPLE_INPUT)

function renderReport(shareToken: string) {
  return render(
    <MemoryRouter initialEntries={[`/report?share=${shareToken}`]}>
      <ReportView />
    </MemoryRouter>
  )
}

describe('ReportView share-link hydration (ACCURACY-0708-2)', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.getState().clearPersona()
    reportContentSpy.mockClear()
  })

  it("renders the sender's exact snapshot, not a recomputed score", async () => {
    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'executive' })
    renderReport(token)

    await screen.findByTestId('report-content')
    const props = reportContentSpy.mock.calls.at(-1)?.[0] as { result: typeof SAMPLE_RESULT }
    expect(props.result).toEqual(SAMPLE_RESULT)
    expect(props.result.riskScore).toBe(SAMPLE_RESULT.riskScore)
  })

  it('never mutates the store when the recipient has no assessment of their own', async () => {
    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'executive' })
    renderReport(token)

    await screen.findByTestId('report-content')
    // The recipient's own store stays exactly as it started — untouched.
    expect(useAssessmentStore.getState().assessmentStatus).toBe('not-started')
    expect(useAssessmentStore.getState().industry).toBe('')
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
  })

  it('never mutates an existing in-progress assessment', async () => {
    const store = useAssessmentStore.getState()
    store.setIndustry('Healthcare')
    store.setCountry('Germany')
    useAssessmentFormStore.getState().setAssessmentStatus('in-progress')

    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'executive' })
    renderReport(token)

    await screen.findByTestId('report-content')
    const after = useAssessmentStore.getState()
    expect(after.industry).toBe('Healthcare')
    expect(after.country).toBe('Germany')
    expect(after.assessmentStatus).toBe('in-progress')
  })

  it('never mutates an already-completed assessment', async () => {
    const store = useAssessmentStore.getState()
    store.setIndustry('Government')
    store.markComplete()
    expect(useAssessmentStore.getState().assessmentStatus).toBe('complete')

    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'executive' })
    renderReport(token)

    await screen.findByTestId('report-content')
    expect(useAssessmentStore.getState().industry).toBe('Government')
  })

  it("never writes the sender's persona into the recipient's persona store", async () => {
    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'executive' })
    renderReport(token)

    await screen.findByTestId('report-content')
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
    // The ephemeral view still gates sections as the sender's persona would.
    const props = reportContentSpy.mock.calls.at(-1)?.[0] as {
      sharedView?: { persona: string | null }
    }
    expect(props.sharedView?.persona).toBe('executive')
  })

  it('shows the read-only snapshot banner and no in-progress banner for a shared view', async () => {
    // Recipient has their own in-progress assessment — the shared view must
    // render on top of it without surfacing the recipient's OWN in-progress
    // banner (that banner is about the recipient's own answers, not the
    // report they're currently looking at).
    useAssessmentFormStore.getState().setAssessmentStatus('in-progress')
    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'executive' })
    renderReport(token)

    await screen.findByText(/read-only snapshot/i)
    expect(screen.queryByText(/Assessment in progress/i)).not.toBeInTheDocument()
  })

  it('flags a v1 (pre-snapshot) token as an approximate view', async () => {
    // Simulate an old, already-circulating v1 token by encoding its shape
    // directly (the current encodeShareToken only produces v2 tokens).
    const legacyPayload = {
      v: 1,
      industry: 'Finance & Banking',
      migrationStatus: 'planning',
    }
    const token = btoa(unescape(encodeURIComponent(JSON.stringify(legacyPayload))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    renderReport(token)

    await screen.findByText(/older share link/i)
    expect(useAssessmentStore.getState().assessmentStatus).toBe('not-started')
  })
})

// BUG FIX (Grade-A remediation Phase 2, top-bar Share correctness —
// pqctoday-priv/grade-a-remediation/PLAN-00-TOP-CONNECTING-PLAN.md §6,
// PLAN-02-CORE-FUNNEL.md): the global top-bar Share button used to pass no
// `url`, so it fell back to `window.location.href` — the bare `/report`
// path when a report is only in local store, not the URL — while the
// SENDER still got a success toast implying the share worked. A recipient
// opening that bare link landed on "No Report Yet". ReportView must
// register the real, token-minting mechanism (`buildReportShareUrl`) with
// `usePageActionsStore`, so the top bar produces a self-contained, fully
// decodable link. (2026-08-27: the report page's own in-page Share button
// was removed in favor of this top-bar-only registration — these tests now
// assert on the registration directly rather than on parity between two
// affordances.)
//
// Renders the RECIPIENT's own live/completed report (not a `?share=` link) —
// `buildReportShareUrl`'s non-shared branch mints a brand-new token from
// `window.location.origin` + `window.location.pathname` (never reads
// `window.location.search`), so, unlike the already-shared case, it doesn't
// depend on MemoryRouter syncing the real `window.location` object (it
// doesn't, in jsdom) — this is also the primary real-world case: a sender
// minting a fresh link for their own report.
function renderOwnReport() {
  useAssessmentResultStore.getState().setResult(SAMPLE_RESULT)
  useAssessmentFormStore.getState().setAssessmentStatus('complete')
  return render(
    <MemoryRouter initialEntries={['/report']}>
      <ReportView />
    </MemoryRouter>
  )
}

describe('ReportView registers the top-bar Share URL (Grade-A remediation Phase 2)', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.getState().clearPersona()
    usePageActionsStore.getState().clearPageActions()
  })

  it('registers a `?share=` token URL (not a bare path) once the report has rendered', async () => {
    renderOwnReport()

    await screen.findByTestId('report-content')
    const registeredUrl = usePageActionsStore.getState().current?.url
    expect(registeredUrl).toBeDefined()
    expect(registeredUrl).toContain('?share=')
  })

  it('registers a URL that decodes back to the exact rendered result — a fresh visitor would NOT hit "No Report Yet"', async () => {
    renderOwnReport()

    await screen.findByTestId('report-content')
    const registeredUrl = usePageActionsStore.getState().current?.url
    const tokenParam = new URL(registeredUrl!).searchParams.get('share')
    expect(tokenParam).toBeTruthy()

    // Decoding is exactly what a fresh recipient's browser does on load (see
    // ReportView's hydration effect above) — round-tripping here proves the
    // top-bar link is genuinely loadable, not just URL-shaped. Compared
    // against a JSON round-trip of SAMPLE_RESULT (not SAMPLE_RESULT itself):
    // the token is JSON under the hood, so explicit-`undefined`-valued keys
    // computeAssessment sets (e.g. unset optional fields) never survive
    // encoding either way — that's expected, real behavior, not a bug.
    const decoded = decodeShareToken(tokenParam!)
    expect(decoded).not.toBeNull()
    expect(decoded).toEqual({ v: 2, result: JSON.parse(JSON.stringify(SAMPLE_RESULT)) })
  })

  it("embeds the sender's exact result, matching encodeShareToken's own output shape", async () => {
    renderOwnReport()

    await screen.findByTestId('report-content')
    const registeredUrl = usePageActionsStore.getState().current?.url
    const registeredToken = new URL(registeredUrl!).searchParams.get('share')!

    const expectedToken = encodeShareToken({ result: SAMPLE_RESULT, persona: null })
    expect(decodeShareToken(registeredToken)).toEqual(decodeShareToken(expectedToken))
  })

  it('clears the registered Share URL on unmount so a later route keeps the generic fallback', async () => {
    const { unmount } = renderOwnReport()

    await screen.findByTestId('report-content')
    expect(usePageActionsStore.getState().current?.url).toBeDefined()

    unmount()
    expect(usePageActionsStore.getState().current).toBeNull()
  })
})

// Mobile UX layer (Phase 8). ReportEmbed.tsx renders this same component
// inside the simulation via simEmbed — simEmbed must win over isMobileShell
// regardless of viewport width, same as Threats/Library/Compliance/Migrate/
// Assess.
describe('mobile shell guard', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.getState().clearPersona()
    useAssessmentFormStore.setState({
      industry: SAMPLE_INPUT.industry,
      dataSensitivity: SAMPLE_INPUT.dataSensitivity,
      migrationStatus: SAMPLE_INPUT.migrationStatus,
      assessmentStatus: 'complete',
    })
  })

  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
  })

  it('renders the mobile screen when isMobileShell is true and not sim-embedded', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    render(
      <MemoryRouter initialEntries={['/report']}>
        <ReportView />
      </MemoryRouter>
    )
    expect(await screen.findByText('Report')).toBeInTheDocument()
    expect(screen.queryByTestId('report-content')).not.toBeInTheDocument()
  })

  it('still renders the full desktop view when simEmbed is true, even if isMobileShell is true', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    render(
      <MemoryRouter initialEntries={['/report']}>
        <ReportView simEmbed />
      </MemoryRouter>
    )
    expect(await screen.findByTestId('report-content')).toBeInTheDocument()
  })
})

// 2026-09-07 fix: MobileReportView previously had NO shared/example
// resolution at all — it only ever read the viewer's own live assessment
// store, so a `?share=`/`?example=1` link opened on a phone always landed on
// "No Report Yet" regardless of what the link promised. Flagged by the
// Executive/GRC split plan's mobile acceptance criteria ("fix shared/example
// mobile report resolution... before claiming GRC report parity") but not
// persona-specific — this affects every persona's shared/example links.
describe('mobile shared/example report parity (2026-09-07)', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.getState().clearPersona()
    mockUseIsMobileShell.mockReturnValue(true)
  })

  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
  })

  it('renders the worked example report on mobile for ?example=1, not "No Report Yet"', async () => {
    render(
      <MemoryRouter initialEntries={['/report?example=1']}>
        <ReportView />
      </MemoryRouter>
    )
    expect(screen.queryByText('No Report Yet')).not.toBeInTheDocument()
    // The example's own risk score renders — proof the resolved shared view,
    // not the (empty) live store, drove this screen.
    await screen.findByText(String(EXAMPLE_REPORT_RESULT.riskScore))
  })

  it("renders the sender's exact snapshot on mobile for a ?share= token, not the viewer's own empty state", async () => {
    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'grc' })
    render(
      <MemoryRouter initialEntries={[`/report?share=${token}`]}>
        <ReportView />
      </MemoryRouter>
    )
    expect(screen.queryByText('No Report Yet')).not.toBeInTheDocument()
    await screen.findByText(String(SAMPLE_RESULT.riskScore))
  })

  it('never writes a shared link into the recipient’s own persisted store on mobile either', async () => {
    const token = encodeShareToken({ result: SAMPLE_RESULT, persona: 'grc' })
    render(
      <MemoryRouter initialEntries={[`/report?share=${token}`]}>
        <ReportView />
      </MemoryRouter>
    )
    await screen.findByText(String(SAMPLE_RESULT.riskScore))
    expect(useAssessmentStore.getState().assessmentStatus).toBe('not-started')
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
  })
})

// The old hydration guard ran its decode effect exactly once per mount
// (`hydratedRef`), so tapping a second shared link while ALREADY on /report
// — the common case for a board's "See a finished example" + a teammate's
// direct share link, or simply re-sharing — left the FIRST link's content on
// screen. `useResolvedSharedReport` re-resolves on every distinct
// `searchParams` value instead.
describe('ReportView re-resolves a shared link on a same-route query change', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.getState().clearPersona()
    reportContentSpy.mockClear()
  })

  it('updates from one ?share= token to a different one without remounting', async () => {
    const firstResult = computeAssessment({
      industry: 'Healthcare',
      currentCrypto: ['RSA-2048'],
      dataSensitivity: ['medium'],
      complianceRequirements: [],
      migrationStatus: 'not-started',
    })
    const firstToken = encodeShareToken({ result: firstResult, persona: 'curious' })
    const secondToken = encodeShareToken({ result: SAMPLE_RESULT, persona: 'grc' })

    // A real react-router `<Link>`, clicked via fireEvent — this triggers
    // genuine client-side navigation on the SAME mounted MemoryRouter/history
    // (ReportView itself never unmounts), unlike re-rendering a new
    // <MemoryRouter> element, which would just reset `initialEntries` rather
    // than reproducing an in-app navigation.
    function Harness() {
      return (
        <>
          <Link to={`/report?share=${secondToken}`}>switch</Link>
          <ReportView />
        </>
      )
    }

    render(
      <MemoryRouter initialEntries={[`/report?share=${firstToken}`]}>
        <Harness />
      </MemoryRouter>
    )
    await screen.findByTestId('report-content')
    const firstProps = reportContentSpy.mock.calls.at(-1)?.[0] as {
      result: { riskScore: number }
    }
    expect(firstProps.result.riskScore).toBe(firstResult.riskScore)

    fireEvent.click(screen.getByText('switch'))

    // A mount-only guard would leave the FIRST token's props in place here —
    // ReportView never unmounts across this navigation, so this only passes
    // if the resolution hook re-ran on the new searchParams value.
    await vi.waitFor(() => {
      const latest = reportContentSpy.mock.calls.at(-1)?.[0] as { result: { riskScore: number } }
      expect(latest.result.riskScore).toBe(SAMPLE_RESULT.riskScore)
    })
  })
})

// Bare /report with no assessment used to be an empty "No Report Yet" page,
// which search engines reported as a soft 404. It now shows the worked
// example under a "sample" banner — to visitors and crawlers alike.
describe('bare /report with no assessment shows the sample report', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.getState().clearPersona()
    reportContentSpy.mockClear()
  })

  afterEach(() => {
    mockUseIsMobileShell.mockReturnValue(false)
  })

  function renderBare(embed = false) {
    return render(
      <MemoryRouter initialEntries={['/report']}>
        <ReportView simEmbed={embed} />
      </MemoryRouter>
    )
  }

  it('renders the worked example with the sample banner, not "No Report Yet"', async () => {
    renderBare()
    await screen.findByTestId('report-content')
    const props = reportContentSpy.mock.calls.at(-1)?.[0] as {
      result: typeof SAMPLE_RESULT
      sharedView?: { sample?: boolean }
    }
    expect(props.result).toEqual(EXAMPLE_REPORT_RESULT)
    expect(props.sharedView?.sample).toBe(true)
    expect(screen.getByText(/This is a sample report/)).toBeInTheDocument()
    expect(screen.queryByText('No Report Yet')).not.toBeInTheDocument()
  })

  it('never writes the sample into the visitor’s own store', async () => {
    renderBare()
    await screen.findByTestId('report-content')
    expect(useAssessmentFormStore.getState().assessmentStatus).toBe('not-started')
    expect(useAssessmentResultStore.getState().lastResult).toBeNull()
  })

  it('keeps the empty state once the visitor has started their own assessment', () => {
    useAssessmentFormStore.getState().setAssessmentStatus('in-progress')
    renderBare()
    expect(screen.queryByText(/This is a sample report/)).not.toBeInTheDocument()
  })

  it('keeps the empty state inside the simulation', () => {
    renderBare(true)
    expect(screen.getByText('No Report Yet')).toBeInTheDocument()
    expect(screen.queryByText(/This is a sample report/)).not.toBeInTheDocument()
  })

  it('shows the same sample, with its banner, on mobile', async () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderBare()
    expect(await screen.findByText(/This is a sample report/)).toBeInTheDocument()
    expect(screen.queryByText('No Report Yet')).not.toBeInTheDocument()
  })
})
