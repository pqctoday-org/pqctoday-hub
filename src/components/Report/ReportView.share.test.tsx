// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0708-2: a shared/example /report link must render an EPHEMERAL,
// read-only view — it must never write into the recipient's own persisted
// assessment or persona store, regardless of what the recipient's own state
// already is. (Supersedes the older ACCURACY-0705 fix, which only blocked
// the overwrite when the recipient already had an assessment — leaving the
// no-prior-assessment case still mutating their store on every open.)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ReportView } from './ReportView'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useAssessmentFormStore } from '../../store/useAssessmentFormStore'
import { useAssessmentResultStore } from '../../store/useAssessmentResultStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { encodeShareToken, decodeShareToken } from '@/utils/reportShareToken'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import type { AssessmentInput } from '@/hooks/assessmentTypes'
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
// opening that bare link landed on "No Report Yet". ReportView must now
// register the SAME real, token-minting mechanism the in-page Share button
// uses (`buildReportShareUrl`) with `usePageActionsStore`, so the top bar
// produces an identical, self-contained, fully decodable link.
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

  it("uses the SAME mechanism as the in-page Share button — the token embeds the sender's exact result, matching encodeShareToken's own output shape", async () => {
    renderOwnReport()

    await screen.findByTestId('report-content')
    const registeredUrl = usePageActionsStore.getState().current?.url
    const registeredToken = new URL(registeredUrl!).searchParams.get('share')!

    // encodeShareToken is the exact function `shareReport` (ReportContent's
    // in-page "Share" button) calls — building the expected token the same
    // way confirms both affordances go through one shared mechanism, not two.
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
