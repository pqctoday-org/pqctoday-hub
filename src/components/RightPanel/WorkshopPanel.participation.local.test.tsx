// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { WorkshopPanel } from './WorkshopPanel'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { WorkshopFlow } from '@/types/Workshop'
vi.mock('@/hooks/useWorkshopAutoComplete', () => ({ useWorkshopAutoComplete: () => {} }))
vi.mock('@/hooks/useWorkshopManifest', () => ({
  useWorkshopManifest: () => ({
    activeFlow: fixture,
    flowLoading: false,
    flowError: null,
    manifest: { flows: [] },
    compatibleEntries: [],
    isLoading: false,
  }),
}))
vi.mock('./WorkshopStepCard', () => ({ WorkshopStepCard: () => null }))
const fixture: WorkshopFlow = {
  id: 'sample',
  title: 'Sample activity',
  match: { roles: '*', proficiencies: '*', industries: '*', regions: '*' },
  whatToExpect: [],
  totalEstMinutes: 1,
  intro: {
    id: 'intro',
    title: 'Sample',
    estMinutes: 1,
    steps: [
      {
        id: 'filter',
        title: 'Review sample filter',
        chapter: 'foundations',
        estMinutes: 1,
        page: { route: '/compliance' },
        tasks: ['Review one', 'Review two'],
        whyItMatters: 'Sample learning',
        expectedOutput: 'Sample output',
        narration: 'Sample narration',
        completionSignal: { kind: 'filter-applied', surface: 'compliance', key: 'country' },
      },
    ],
  },
  prerequisites: { id: 'pre', title: 'Sample', estMinutes: 0, steps: [] },
  common: [],
  close: { id: 'close', title: 'Sample', estMinutes: 0, steps: [] },
}
beforeEach(() => {
  useWorkshopStore.getState().reset()
  usePersonaStore.setState({
    selectedPersona: 'executive',
    experienceLevel: 'basics',
    selectedIndustry: null,
  })
  useWorkshopStore.getState().start('sample', 'filter', 'US')
})
describe('Desktop current-step participation guidance', () => {
  it('explains unobservable actions and preserved manual participation scope', () => {
    render(
      <MemoryRouter>
        <WorkshopPanel />
      </MemoryRouter>
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Review the activity, then use the manual completion control'
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'participation credit does not verify each task'
    )
    act(() => useWorkshopStore.getState().markStepComplete('filter'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Activity marked complete. Its completion origin is not recorded.'
    )
  })
  it('keeps pause/resume callbacks available without promoting activity to test results', () => {
    render(
      <MemoryRouter>
        <WorkshopPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Pause workshop' }))
    expect(useWorkshopStore.getState().mode).toBe('paused')
    fireEvent.click(screen.getByRole('button', { name: 'Resume workshop' }))
    expect(useWorkshopStore.getState().mode).toBe('running')
    expect(useWorkshopStore.getState().completedStepIds).toEqual([])
  })
})
