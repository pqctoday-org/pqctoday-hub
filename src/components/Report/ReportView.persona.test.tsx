// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportView } from './ReportView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)
const lifecycle = vi.hoisted(() => ({ mounts: 0, unmounts: 0 }))
vi.mock('./ReportContent', () => ({
  ReportContent: (props: { result: { riskScore: number } }) => {
    useEffect(() => {
      lifecycle.mounts += 1
      return () => {
        lifecycle.unmounts += 1
      }
    }, [])
    return <p>Snapshot {props.result.riskScore}</p>
  },
}))
vi.mock('./ReportToc', () => ({ ReportToc: () => null }))
vi.mock('./ReportNextSteps', () => ({ ReportNextSteps: () => null }))
vi.mock('@/components/Assess/PersonaSuggestionCard', () => ({ PersonaSuggestionCard: () => null }))
vi.mock('@/hooks/useAwarenessScore', () => ({ useAwarenessScore: () => ({ hasStarted: false }) }))
vi.mock('@/hooks/useWorkflowPhaseTracker', () => ({ useWorkflowPhaseTracker: () => undefined }))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

const currentKey = () => JSON.stringify(useAssessmentStore.getState().getInput())

beforeEach(() => {
  useAssessmentStore.getState().reset()
  usePersonaStore.getState().setPersona('executive')
  useAssessmentResultStore.setState({ lastResult: null, sourceInputKey: null })
  lifecycle.mounts = 0
  lifecycle.unmounts = 0
  useAssessmentFormStore.setState({
    assessmentStatus: 'complete',
    assessmentMode: 'comprehensive',
    industry: 'Healthcare',
    country: 'Germany',
    currentCrypto: ['RSA-2048'],
    dataSensitivity: ['high'],
    dataRetention: ['10-25y'],
    migrationStatus: 'planning',
    complianceRequirements: [],
    credentialLifetime: ['3-10y'],
    systemCount: '51-200',
    teamSize: '11-50',
    cryptoAgility: 'partially-abstracted',
  })
})

describe('changing the persona while the report is open', () => {
  it('updates in place: no loading screen, the report content is not remounted', async () => {
    render(
      <MemoryRouter initialEntries={['/report']}>
        <ReportView />
      </MemoryRouter>
    )
    await screen.findByText(/^Snapshot /)
    await waitFor(() =>
      expect(useAssessmentResultStore.getState().sourceInputKey).toBe(currentKey())
    )
    const firstKey = currentKey()
    expect(lifecycle.mounts).toBe(1)

    act(() => usePersonaStore.getState().setPersona('developer'))
    // The input changed, so a recompute starts — but the report stays on screen.
    expect(currentKey()).not.toBe(firstKey)
    expect(screen.queryByText('Generating your report…')).not.toBeInTheDocument()
    expect(screen.getByText(/^Snapshot /)).toBeInTheDocument()

    // The recomputed result is persisted against the NEW input, not skipped.
    await waitFor(() =>
      expect(useAssessmentResultStore.getState().sourceInputKey).toBe(currentKey())
    )
    expect(screen.queryByText('Generating your report…')).not.toBeInTheDocument()
    expect(lifecycle.mounts).toBe(1)
    expect(lifecycle.unmounts).toBe(0)
  })
})
