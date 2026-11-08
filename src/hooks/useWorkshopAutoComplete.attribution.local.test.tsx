// SPDX-License-Identifier: AGPL-3.0-only
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useNavigate } from 'react-router'
import { useEffect, type ReactNode } from 'react'
import type { WorkshopFlow, WorkshopStep, WorkshopCompletionSignal } from '@/types/Workshop'
import { useWorkshopAutoComplete } from './useWorkshopAutoComplete'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useModuleStore } from '@/store/useModuleStore'
const loader = vi.hoisted(() => ({ flow: vi.fn() }))
vi.mock('@/services/workshopFlowLoader', () => ({
  loadManifest: async () => ({}),
  findEntry: (_m: unknown, id: string) => ({ file: id }),
  loadFlow: (id: string) => loader.flow(id),
}))
let navigate: ReturnType<typeof useNavigate>
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/library']}>
      <Navigation />
      {children}
    </MemoryRouter>
  )
}
function Navigation() {
  const go = useNavigate()
  useEffect(() => {
    navigate = go
  }, [go])
  return null
}
const step = (
  id: string,
  signal: WorkshopCompletionSignal,
  route = '/library',
  query?: Record<string, string>
): WorkshopStep => ({
  id,
  completionSignal: signal,
  page: { route, query },
  chapter: 'foundations',
  title: id,
  estMinutes: 1,
  whyItMatters: 'Sample',
  tasks: ['Sample task'],
  expectedOutput: 'Sample output',
  narration: 'Sample',
})
function flow(steps: WorkshopStep[], id = 'sample'): WorkshopFlow {
  return {
    id,
    title: id,
    match: { roles: '*', proficiencies: '*', industries: '*', regions: '*' },
    whatToExpect: [],
    totalEstMinutes: 1,
    intro: { id: 'intro', title: 'Sample', estMinutes: 1, steps },
    prerequisites: { id: 'pre', title: 'Sample', estMinutes: 0, steps: [] },
    common: [],
    close: { id: 'close', title: 'Sample', estMinutes: 0, steps: [] },
  }
}
async function mount(steps: WorkshopStep[]) {
  loader.flow.mockResolvedValue(flow(steps))
  useWorkshopStore.getState().start('sample', steps[0].id, 'US')
  const view = renderHook(() => useWorkshopAutoComplete(), { wrapper: Wrapper })
  await waitFor(() => expect(loader.flow).toHaveBeenCalled())
  await waitFor(() => expect(loader.flow).toHaveResolved())
  return view
}
const done = () => useWorkshopStore.getState().completedStepIds
function progress(ids: string[]) {
  useModuleStore.getState().updateModuleProgress('sample-module', { completedSteps: ids })
}
beforeEach(() => {
  vi.clearAllMocks()
  useWorkshopStore.getState().reset()
  useAssessmentFormStore.setState({ assessmentStatus: 'not-started' })
  useBookmarkStore.setState({ libraryBookmarks: ['old'], myThreats: [], myTimelineCountries: [] })
  useModuleStore.setState({ modules: {} })
})
describe('Current-step observation (synthetic signal fixtures, not technical verification)', () => {
  it('ignores prior bookmarks and future-step signals; credits a new current bookmark only', async () => {
    await mount([
      step('current', { kind: 'bookmark-added', surface: 'library' }),
      step('future', { kind: 'bookmark-added', surface: 'library' }),
    ])
    expect(done()).toEqual([])
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'new'] }))
    await waitFor(() => expect(done()).toEqual(['current']))
    act(() => useWorkshopStore.getState().setStep('future'))
    expect(done()).toEqual(['current'])
  })
  it('does not import activity from another resource on return', async () => {
    await mount([step('current', { kind: 'bookmark-added', surface: 'library' })])
    act(() => navigate('/threats'))
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'away'] }))
    act(() => navigate('/library'))
    expect(done()).toEqual([])
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'away', 'here'] }))
    await waitFor(() => expect(done()).toEqual(['current']))
  })
  it('requires newly completed distinct module IDs, not accumulated progress or duplicates', async () => {
    progress(['old-a', 'old-b'])
    await mount([
      step(
        'module',
        { kind: 'module-progress', moduleId: 'sample-module', minSteps: 2 },
        '/learn/sample-module'
      ),
    ])
    act(() => navigate('/learn/sample-module'))
    act(() => progress(['old-a', 'old-b', 'new-a', 'new-a']))
    expect(done()).toEqual([])
    act(() => progress(['old-a', 'old-b', 'new-a', 'new-b']))
    await waitFor(() => expect(done()).toEqual(['module']))
  })
  it('requires a fresh assessment transition and the explicit query subset', async () => {
    useAssessmentFormStore.setState({ assessmentStatus: 'complete' })
    await mount([step('assessment', { kind: 'assessment-complete' }, '/assess', { mode: 'quick' })])
    act(() => navigate('/assess?mode=quick'))
    expect(done()).toEqual([])
    // Resetting on the current resource starts a new observable assessment.
    act(() => useAssessmentFormStore.setState({ assessmentStatus: 'in-progress' }))
    // The baseline was complete; a new assessment attempt must become observable.
    act(() => navigate('/assess?mode=other'))
    act(() => navigate('/assess?mode=quick&extra=allowed'))
    act(() => useAssessmentFormStore.setState({ assessmentStatus: 'complete' }))
    await waitFor(() => expect(done()).toEqual(['assessment']))
  })
  it('credits a current noncomplete assessment becoming complete, but not a query mismatch', async () => {
    await mount([step('assessment', { kind: 'assessment-complete' }, '/assess', { mode: 'quick' })])
    act(() => navigate('/assess?mode=other'))
    act(() => useAssessmentFormStore.setState({ assessmentStatus: 'complete' }))
    act(() => navigate('/assess?mode=quick'))
    expect(done()).toEqual([])
  })
  it('rebases paused activity and remounts conservatively; manual credit remains', async () => {
    const view = await mount([step('bookmark', { kind: 'bookmark-added', surface: 'library' })])
    act(() => useWorkshopStore.getState().pause())
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'paused'] }))
    act(() => useWorkshopStore.getState().resume())
    expect(done()).toEqual([])
    view.unmount()
    renderHook(() => useWorkshopAutoComplete(), { wrapper: Wrapper })
    await waitFor(() => expect(loader.flow).toHaveResolved())
    expect(done()).toEqual([])
    act(() => useWorkshopStore.getState().markStepComplete('bookmark'))
    expect(done()).toEqual(['bookmark'])
  })
  it.each(['leaders', 'compliance'] as const)(
    'never credits %s from threat bookmarks',
    async (surface) => {
      await mount([step('unobservable', { kind: 'bookmark-added', surface }, `/${surface}`)])
      act(() => navigate(`/${surface}`))
      act(() => useBookmarkStore.setState({ myThreats: ['unrelated'] }))
      expect(done()).toEqual([])
    }
  )
  it('never infers a filter action from a route visit', async () => {
    await mount([
      step(
        'filter',
        { kind: 'filter-applied', surface: 'compliance', key: 'country' },
        '/compliance'
      ),
    ])
    act(() => navigate('/compliance'))
    expect(done()).toEqual([])
  })
  it('records only the current explicit route/query as viewing participation', async () => {
    await mount([
      step('route', { kind: 'route-visited', route: '/library?type=article' }, '/library'),
    ])
    expect(done()).toEqual([])
    act(() => navigate('/library?type=other'))
    expect(done()).toEqual([])
    act(() => navigate('/library?type=article&extra=1'))
    await waitFor(() => expect(done()).toEqual(['route']))
  })
  it('rejects stale async hydration from an earlier flow/run', async () => {
    let resolveOld: (f: WorkshopFlow) => void = () => {}
    loader.flow.mockImplementation((id: string) =>
      id === 'old'
        ? new Promise<WorkshopFlow>((resolve) => {
            resolveOld = resolve
          })
        : Promise.resolve(
            flow([step('new-step', { kind: 'bookmark-added', surface: 'library' })], 'new')
          )
    )
    useWorkshopStore.getState().start('old', 'old-step', 'US')
    renderHook(() => useWorkshopAutoComplete(), { wrapper: Wrapper })
    await waitFor(() => expect(loader.flow).toHaveBeenCalledWith('old'))
    act(() => useWorkshopStore.getState().start('new', 'new-step', 'US'))
    await waitFor(() => expect(loader.flow).toHaveBeenCalledWith('new'))
    await act(async () =>
      resolveOld(flow([step('old-step', { kind: 'route-visited', route: '/library' })], 'old'))
    )
    expect(done()).toEqual([])
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'new'] }))
    await waitFor(() => expect(done()).toEqual(['new-step']))
  })
  it('does not import activity recorded during asynchronous flow loading', async () => {
    let resolve: (f: WorkshopFlow) => void = () => {}
    loader.flow.mockImplementation(
      () =>
        new Promise<WorkshopFlow>((r) => {
          resolve = r
        })
    )
    useWorkshopStore.getState().start('sample', 'bookmark', 'US')
    renderHook(() => useWorkshopAutoComplete(), { wrapper: Wrapper })
    await waitFor(() => expect(loader.flow).toHaveBeenCalled())
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'loading'] }))
    await act(async () =>
      resolve(flow([step('bookmark', { kind: 'bookmark-added', surface: 'library' })]))
    )
    expect(done()).toEqual([])
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'loading', 'observed'] }))
    await waitFor(() => expect(done()).toEqual(['bookmark']))
  })
  it('does not fall back to a different step if the current step is absent', async () => {
    await mount([step('current', { kind: 'bookmark-added', surface: 'library' })])
    act(() => useWorkshopStore.getState().setStep('not-in-flow'))
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'new'] }))
    expect(done()).toEqual([])
  })
  it('rebases a restarted run rather than reusing the previous run snapshot', async () => {
    await mount([step('current', { kind: 'bookmark-added', surface: 'library' })])
    act(() => useBookmarkStore.setState({ libraryBookmarks: ['old', 'new'] }))
    await waitFor(() => expect(done()).toEqual(['current']))
    act(() =>
      useWorkshopStore.setState({ completedStepIds: [], startedAt: 'different-sample-run' })
    )
    await waitFor(() => expect(loader.flow).toHaveResolved())
    expect(done()).toEqual([])
  })
  it('rebases source updates batched with resource re-entry instead of importing away activity', async () => {
    await mount([step('current', { kind: 'bookmark-added', surface: 'library' })])
    act(() => navigate('/threats'))
    act(() => {
      useBookmarkStore.setState({ libraryBookmarks: ['old', 'away-batched'] })
      navigate('/library')
    })
    expect(done()).toEqual([])
    act(() =>
      useBookmarkStore.setState({ libraryBookmarks: ['old', 'away-batched', 'after-return'] })
    )
    await waitFor(() => expect(done()).toEqual(['current']))
  })
})
