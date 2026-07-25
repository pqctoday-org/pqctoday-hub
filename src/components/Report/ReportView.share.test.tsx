// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0708-2: a shared/example /report link must render an EPHEMERAL,
// read-only view — it must never write into the recipient's own persisted
// assessment or persona store, regardless of what the recipient's own state
// already is. (Supersedes the older ACCURACY-0705 fix, which only blocked
// the overwrite when the recipient already had an assessment — leaving the
// no-prior-assessment case still mutating their store on every open.)
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ReportView } from './ReportView'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useAssessmentFormStore } from '../../store/useAssessmentFormStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { encodeShareToken } from '@/utils/reportShareToken'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import type { AssessmentInput } from '@/hooks/assessmentTypes'

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
