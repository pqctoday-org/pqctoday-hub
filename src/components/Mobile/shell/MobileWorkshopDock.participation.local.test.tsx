// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileWorkshopDock } from './MobileWorkshopDock'
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
describe('Phone participation scope (synthetic unobservable filter fixture)', () => {
  it('uses manual activity credit, leaving task references unverified', () => {
    render(
      <MemoryRouter initialEntries={['/compliance']}>
        <MobileWorkshopDock />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Review sample filter'))
    expect(
      screen.getByText(/Review the activity, then use the manual completion control/)
    ).toBeInTheDocument()
    expect(screen.getByText('Review one')).toBeInTheDocument()
    expect(screen.getByText('Review two')).toBeInTheDocument()
    expect(useWorkshopStore.getState().completedStepIds).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Mark activity complete' }))
    expect(useWorkshopStore.getState().completedStepIds).toEqual(['filter'])
    expect(
      screen.getByText(/Activity marked complete. Its completion origin is not recorded/)
    ).toBeInTheDocument()
    expect(screen.getByText(/participation credit does not verify each task/)).toBeInTheDocument()
  })
  it('does not retroactively label durable participation as Viewed or a passed check', () => {
    useWorkshopStore.getState().markStepComplete('filter')
    render(
      <MemoryRouter>
        <MobileWorkshopDock />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Review sample filter'))
    expect(screen.getByText(/completion origin is not recorded/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark activity complete' })).not.toBeInTheDocument()
    expect(screen.queryByText(/test passed|signature valid/i)).not.toBeInTheDocument()
  })
})
