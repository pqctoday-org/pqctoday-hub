// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0705 regression: a shared /report link must never silently
// overwrite the recipient's own already-in-progress or completed assessment.
// Uses the REAL useAssessmentStore (not mocked) so the assertion is on actual
// persisted state, not a stand-in.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { ReportView } from './ReportView'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useAssessmentFormStore } from '../../store/useAssessmentFormStore'
import { encodeShareToken } from '@/utils/reportShareToken'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)
vi.mock('./ReportContent', () => ({ ReportContent: () => <div data-testid="report-content" /> }))
vi.mock('./ReportToc', () => ({ ReportToc: () => <div data-testid="report-toc" /> }))
vi.mock('./ReportNextSteps', () => ({ ReportNextSteps: () => <div data-testid="report-next-steps" /> }))
vi.mock('@/components/Assess/PersonaSuggestionCard', () => ({
  PersonaSuggestionCard: () => <div data-testid="persona-suggestion-card" />,
}))
vi.mock('@/hooks/useAwarenessScore', () => ({ useAwarenessScore: () => ({ score: 0, tier: 'novice' }) }))
vi.mock('@/hooks/useWorkflowPhaseTracker', () => ({ useWorkflowPhaseTracker: () => {} }))

function renderReport(shareToken: string) {
  return render(
    <MemoryRouter initialEntries={[`/report?share=${shareToken}`]}>
      <ReportView />
    </MemoryRouter>
  )
}

describe('ReportView share-link hydration (ACCURACY-0705)', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
  })

  // This project's global test setup does not call RTL's cleanup() between
  // tests, so without this, each test's <ReportView/> mount stacks up in the
  // jsdom document and `screen.findByText` (which queries the whole document,
  // not a per-render container) can match stale content left by an earlier
  // test's still-mounted instance.
  afterEach(() => {
    cleanup()
  })

  it('applies a shared assessment when the recipient has none of their own yet', async () => {
    const token = encodeShareToken({ industry: 'Finance & Banking', migrationStatus: 'planning' })
    renderReport(token)

    await waitFor(() => {
      expect(useAssessmentStore.getState().assessmentStatus).toBe('complete')
    })
    expect(useAssessmentStore.getState().industry).toBe('Finance & Banking')
  })

  it('does NOT overwrite an existing in-progress assessment — the core regression', async () => {
    const store = useAssessmentStore.getState()
    store.setIndustry('Healthcare')
    store.setCountry('Germany')
    // `setIndustry`/`setCountry` alone don't flip assessmentStatus away from
    // 'not-started' — force it explicitly so this test actually exercises the
    // "recipient has their own in-progress assessment" case, not the
    // fresh-visitor case (which is item 1's OTHER, already-passing branch).
    useAssessmentFormStore.getState().setAssessmentStatus('in-progress')
    const before = useAssessmentStore.getState()

    const token = encodeShareToken({ industry: 'Finance & Banking', migrationStatus: 'planning' })
    renderReport(token)

    // Give the hydration effect a tick to (not) run.
    await screen.findByText(/was not loaded/i)

    const after = useAssessmentStore.getState()
    expect(after.industry).toBe(before.industry)
    expect(after.country).toBe(before.country)
    expect(after.industry).not.toBe('Finance & Banking')
  })

  it('does NOT overwrite an already-completed assessment', async () => {
    const store = useAssessmentStore.getState()
    store.setIndustry('Government')
    store.markComplete()
    expect(useAssessmentStore.getState().assessmentStatus).toBe('complete')

    const token = encodeShareToken({ industry: 'Finance & Banking', migrationStatus: 'planning' })
    renderReport(token)

    await screen.findByText(/was not loaded/i)
    expect(useAssessmentStore.getState().industry).toBe('Government')
  })
})
