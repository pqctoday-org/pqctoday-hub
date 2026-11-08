// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { WorkshopPanel } from './WorkshopPanel'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import type { WorkshopFlow } from '@/types/Workshop'
const { state, retryFlow } = vi.hoisted(() => ({
  state: {
    flowLoading: true,
    flowError: null as Error | null,
    activeFlow: null as WorkshopFlow | null,
  },
  retryFlow: vi.fn(),
}))
const match = { roles: '*', proficiencies: '*', industries: '*', regions: '*' } as const
const entry = {
  id: 'b',
  file: 'b.json',
  title: 'Selected sample B',
  match,
  totalEstMinutes: 1,
  stepCount: 0,
  date: 'sample',
}
vi.mock('@/hooks/useWorkshopAutoComplete', () => ({ useWorkshopAutoComplete: () => {} }))
vi.mock('@/hooks/useWorkshopManifest', () => ({
  useWorkshopManifest: () => ({
    manifest: { flows: [entry] },
    activeEntry: entry,
    matchedEntry: entry,
    compatibleEntries: [],
    isLoading: false,
    error: null,
    retry: vi.fn(),
    retryFlow,
    ...state,
  }),
}))
vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (select: (state: object) => unknown) =>
    select({
      selectedPersona: null,
      experienceLevel: null,
      selectedIndustry: null,
      selectedRegion: null,
    }),
}))
vi.mock('./WorkshopPrereqList', () => ({ WorkshopPrereqList: () => null }))
const sampleFlow = (id: string): WorkshopFlow => ({
  id,
  title: `Sample ${id}`,
  match,
  whatToExpect: [],
  totalEstMinutes: 1,
  intro: { id: 'intro', title: 'Sample intro', estMinutes: 0, steps: [] },
  prerequisites: { id: 'prereq', title: 'Sample prereq', estMinutes: 0, steps: [] },
  common: [],
  close: { id: 'close', title: 'Sample close', estMinutes: 0, steps: [] },
})
beforeEach(() => {
  vi.clearAllMocks()
  state.flowLoading = true
  state.flowError = null
  state.activeFlow = null
  useWorkshopStore.setState({
    mode: 'idle',
    selectedRegion: 'US',
    flowOverrideId: null,
    currentFlowId: null,
  })
})
const renderPanel = () =>
  render(
    <MemoryRouter>
      <WorkshopPanel />
    </MemoryRouter>
  )
describe('Workshop panel selection recovery', () => {
  it('shows selected-flow loading and blocks both execution controls even if old content exists', () => {
    state.activeFlow = sampleFlow('a')
    renderPanel()
    expect(screen.getByRole('status')).toHaveTextContent('Loading selected workshop')
    expect(screen.getByRole('button', { name: 'Start Workshop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Record this workshop/ })).toBeDisabled()
    expect(screen.queryByText('Sample intro')).not.toBeInTheDocument()
  })
  it('shows a per-flow error and retry while a catalogue is available', async () => {
    state.flowLoading = false
    state.flowError = new Error('Sample unavailable')
    renderPanel()
    expect(screen.getByRole('alert')).toHaveTextContent('Sample unavailable')
    await userEvent.click(screen.getByRole('button', { name: 'Retry selected workshop' }))
    expect(retryFlow).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Start Workshop' })).toBeDisabled()
  })
  it('requires matching selected and hydrated identities before enabling Start or Record', () => {
    state.flowLoading = false
    state.activeFlow = sampleFlow('a')
    const { rerender } = renderPanel()
    expect(screen.getByRole('button', { name: 'Start Workshop' })).toBeDisabled()
    state.activeFlow = sampleFlow('b')
    rerender(
      <MemoryRouter>
        <WorkshopPanel />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'Start Workshop' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Record this workshop/ })).toBeEnabled()
  })
})
