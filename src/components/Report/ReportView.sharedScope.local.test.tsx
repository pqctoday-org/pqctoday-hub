// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportView } from './ReportView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { decodeShareToken, encodeShareToken } from '@/utils/reportShareToken'
import { EXAMPLE_REPORT_RESULT } from '@/data/exampleReport'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)
const contents = vi.hoisted(() => vi.fn())
const workflow = vi.hoisted(() => vi.fn())
vi.mock('./ReportContent', () => ({
  ReportContent: (props: { result: { riskScore: number } }) => {
    contents(props)
    return <p>Snapshot {props.result.riskScore}</p>
  },
}))
vi.mock('./ReportToc', () => ({ ReportToc: () => null }))
vi.mock('./ReportNextSteps', () => ({ ReportNextSteps: () => null }))
vi.mock('@/components/Assess/PersonaSuggestionCard', () => ({ PersonaSuggestionCard: () => null }))
vi.mock('@/hooks/useAwarenessScore', () => ({ useAwarenessScore: () => ({ hasStarted: false }) }))
vi.mock('@/hooks/useWorkflowPhaseTracker', () => ({
  useWorkflowPhaseTracker: (phase: string) => workflow(phase),
}))
const phone = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => phone() }))

const a = { ...EXAMPLE_REPORT_RESULT, additiveScore: undefined, riskScore: 17 }
const c = { ...EXAMPLE_REPORT_RESULT, additiveScore: undefined, riskScore: 23 }
const url = (result: typeof a) => {
  const token = encodeShareToken({ result, persona: 'executive' })
  expect(decodeShareToken(token)).not.toBeNull()
  return '/report?share=' + token
}
const stores = () =>
  JSON.stringify({
    form: useAssessmentFormStore.getState(),
    result: useAssessmentResultStore.getState(),
    modules: useModuleStore.getState().modules,
    artifacts: useModuleStore.getState().artifacts,
    persona: usePersonaStore.getState().selectedPersona,
  })
function show(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Link to={url(c)}>Other shared sample</Link>
      <Link to="/report">Own report</Link>
      <ReportView />
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAssessmentStore.getState().reset()
  usePersonaStore.getState().setPersona('executive')
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
  useAssessmentResultStore.setState({
    lastResult: { ...EXAMPLE_REPORT_RESULT, riskScore: 88 },
    completedAt: '2026-11-01T00:00:00Z',
    sourceInputKey: 'RECIPIENT-KEY',
    assessmentHistory: [
      {
        completedAt: '2026-11-01T00:00:00Z',
        riskScore: 88,
        riskLevel: 'high',
        industry: 'RECIPIENT-HISTORY',
        categoryScores: {
          quantumExposure: 1,
          migrationComplexity: 2,
          regulatoryPressure: 3,
          organizationalReadiness: 4,
        },
      },
    ],
  })
  contents.mockClear()
  workflow.mockClear()
  phone.mockReturnValue(false)
})

describe('shared resolution never performs recipient completion/persistence', () => {
  it('keeps complete recipient work intact across initial and same-route shared snapshots', async () => {
    const before = stores()
    show(url(a))
    await screen.findByText('Snapshot 17')
    fireEvent.click(screen.getByRole('link', { name: 'Other shared sample' }))
    await screen.findByText('Snapshot 23')
    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(stores()).toBe(before)
    expect(workflow).not.toHaveBeenCalled()
    expect(contents.mock.calls.every(([p]) => [17, 23].includes(p.result.riskScore))).toBe(true)
  })
  it('keeps recipient stores intact on native phone branch', async () => {
    phone.mockReturnValue(true)
    const before = stores()
    show(url(a))
    await screen.findByText('17')
    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(stores()).toBe(before)
    expect(workflow).not.toHaveBeenCalled()
  })
  it('resumes own progress only after leaving the shared route', async () => {
    show(url(a))
    await screen.findByText('Snapshot 17')
    expect(workflow).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: 'Own report' }))
    await waitFor(() => expect(workflow).toHaveBeenCalledWith('assess'))
    expect(contents.mock.calls.at(-1)![0].sharedView).toBeUndefined()
  })
})

it('uses the full shared body for print and returns to the phone brief afterward', async () => {
  phone.mockReturnValue(true)
  const before = stores()
  show(url(a))
  await screen.findByText('17')
  act(() => window.dispatchEvent(new Event('beforeprint')))
  await screen.findByText('Snapshot 17')
  act(() => window.dispatchEvent(new Event('afterprint')))
  await screen.findByText('17')
  expect(screen.queryByText('Snapshot 17')).toBeNull()
  expect(stores()).toBe(before)
  expect(workflow).not.toHaveBeenCalled()
})

it('keeps the existing invalid-link fallback to the own report', async () => {
  show('/report?share=not-a-valid-token')
  await waitFor(() => expect(workflow).toHaveBeenCalledWith('assess'))
  expect(contents.mock.calls.at(-1)![0].sharedView).toBeUndefined()
})
