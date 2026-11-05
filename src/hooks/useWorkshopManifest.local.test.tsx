// SPDX-License-Identifier: AGPL-3.0-only
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkshopManifest } from './useWorkshopManifest'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import type { WorkshopFlow } from '@/types/Workshop'
import type { WorkshopFlowManifest } from '@/services/workshopFlowLoader'
const mocks = vi.hoisted(() => ({ loadManifest: vi.fn(), loadFlow: vi.fn() }))
vi.mock('@/services/workshopFlowLoader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/workshopFlowLoader')>()),
  ...mocks,
}))
vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (select: (state: object) => unknown) =>
    select({ selectedPersona: null, experienceLevel: null, selectedIndustry: null }),
}))
const match = { roles: '*', proficiencies: '*', industries: '*', regions: '*' } as const
const manifest: WorkshopFlowManifest = {
  version: 'sample',
  generatedAt: 'sample',
  flows: [
    {
      id: 'a',
      file: 'a.json',
      title: 'Sample A',
      match,
      totalEstMinutes: 1,
      stepCount: 1,
      date: 'sample',
      isGenericFallback: true,
    },
    {
      id: 'b',
      file: 'b.json',
      title: 'Sample B',
      match,
      totalEstMinutes: 1,
      stepCount: 1,
      date: 'sample',
    },
  ],
}
const flow = (id: string): WorkshopFlow => ({
  id,
  title: `Sample ${id}`,
  match,
  whatToExpect: [],
  totalEstMinutes: 1,
  intro: { id: 'intro', title: 'Sample intro', estMinutes: 0, steps: [] },
  prerequisites: { id: 'prereq', title: 'Sample prerequisites', estMinutes: 0, steps: [] },
  common: [],
  close: { id: 'close', title: 'Sample close', estMinutes: 0, steps: [] },
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.loadManifest.mockResolvedValue(manifest)
  mocks.loadFlow.mockImplementation(async (file: string) => flow(file[0]))
  useWorkshopStore.setState({
    mode: 'idle',
    flowOverrideId: null,
    currentFlowId: null,
    completedStepIds: [],
  })
})
describe('Workshop selection binds loaded content and recovery to its identity', () => {
  it('suppresses the previous flow while a newly selected flow is pending or fails, then retries that file', async () => {
    const pending = deferred<WorkshopFlow>()
    mocks.loadFlow.mockImplementation((file: string) =>
      file === 'b.json' ? pending.promise : Promise.resolve(flow('a'))
    )
    const { result } = renderHook(() => useWorkshopManifest('US'))
    await waitFor(() => expect(result.current.activeFlow?.id).toBe('a'))
    act(() => useWorkshopStore.getState().setFlowOverrideId('b'))
    expect(result.current.activeEntry?.id).toBe('b')
    expect(result.current.activeFlow).toBeNull()
    expect(result.current.flowLoading).toBe(true)
    await act(async () => pending.reject(new Error('Sample flow unavailable')))
    expect(result.current.flowError?.message).toBe('Sample flow unavailable')
    expect(result.current.activeFlow).toBeNull()
    expect(result.current.flowLoading).toBe(false)
    mocks.loadFlow.mockResolvedValueOnce(flow('b'))
    act(() => result.current.retryFlow())
    await waitFor(() => expect(result.current.activeFlow?.id).toBe('b'))
    expect(mocks.loadFlow).toHaveBeenLastCalledWith('b.json', true)
    expect(result.current.flowError).toBeNull()
  })
  it('does not let an old late response replace the newer selected flow', async () => {
    const a = deferred<WorkshopFlow>()
    const b = deferred<WorkshopFlow>()
    mocks.loadFlow.mockImplementation((file: string) => (file === 'a.json' ? a.promise : b.promise))
    const { result } = renderHook(() => useWorkshopManifest('US'))
    await waitFor(() => expect(mocks.loadFlow).toHaveBeenCalledWith('a.json', false))
    act(() => useWorkshopStore.getState().setFlowOverrideId('b'))
    await waitFor(() => expect(mocks.loadFlow).toHaveBeenCalledWith('b.json', false))
    await act(async () => b.resolve(flow('b')))
    expect(result.current.activeFlow?.id).toBe('b')
    await act(async () => a.resolve(flow('a')))
    expect(result.current.activeFlow?.id).toBe('b')
  })
  it('rejects content belonging to a different manifest identity', async () => {
    mocks.loadFlow.mockResolvedValue(flow('wrong'))
    const { result } = renderHook(() => useWorkshopManifest('US'))
    await waitFor(() => expect(result.current.flowError?.message).toMatch(/does not match/))
    expect(result.current.activeFlow).toBeNull()
  })
  it('preserves a paused running flow pin and its saved completed steps', async () => {
    useWorkshopStore.setState({
      mode: 'paused',
      currentFlowId: 'a',
      flowOverrideId: 'b',
      completedStepIds: ['sample-completed'],
    })
    const { result } = renderHook(() => useWorkshopManifest('US'))
    await waitFor(() => expect(result.current.activeFlow?.id).toBe('a'))
    expect(result.current.activeEntry?.id).toBe('a')
    expect(useWorkshopStore.getState().completedStepIds).toEqual(['sample-completed'])
  })
  it('keeps catalogue retry separate and rehydrates an unchanged selected file after retry', async () => {
    mocks.loadManifest.mockRejectedValueOnce(new Error('Sample catalogue offline'))
    const { result } = renderHook(() => useWorkshopManifest('US'))
    await waitFor(() => expect(result.current.error).not.toBeNull())
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.activeFlow?.id).toBe('a'))
    expect(mocks.loadManifest).toHaveBeenLastCalledWith(true)
    expect(result.current.error).toBeNull()
  })
})
