// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { SIM_TREES, flattenTree, type TreeStep } from '@/simulation'
import type { PhaseId } from '@/data/frameworkPhases'
import { completeStepGenuine, type AutoRunQueueItem } from './simAutoRun'
import { useSimAutoRunPlayer } from './useSimAutoRunPlayer'
import { SimExecWalkthroughComplete } from './SimExecWalkthroughComplete'
import { SimPlayChoiceModal } from '../SimPlayChoiceModal'

const shortened = vi.hoisted(() => ({ queue: [] as unknown[] }))
vi.mock('./simAutoRun', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./simAutoRun')>()
  return {
    ...actual,
    autoRunQueue: () => shortened.queue,
    autoRunIntroQueue: () => shortened.queue,
  }
})
// The tested outcomes concern visit evidence and queue completion, not the
// independent scenario-profile seeding behavior.
vi.mock('./seedDemoOrg', () => ({ seedDemoOrg: () => {} }))

function findStep(kind: TreeStep['kind']): { phase: PhaseId; step: TreeStep } {
  for (const [phase, tree] of Object.entries(SIM_TREES)) {
    if (!tree) continue
    const step = flattenTree(tree).find((candidate) => candidate.kind === kind)
    if (step) return { phase: phase as PhaseId, step }
  }
  throw new Error(`No ${kind} step found in the current sample trees`)
}

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState((state) => ({
    modules: {},
    artifacts: { ...state.artifacts, executiveDocuments: [] },
  }))
  const { phase, step } = findStep('learn')
  shortened.queue = [{ phase, step, level: 1 } satisfies AutoRunQueueItem]
})
afterEach(() => vi.useRealTimers())

describe('narrated sample outcome scope', () => {
  it.each(['workshop', 'catalog'] as const)(
    'records an automatically visited %s as narrated and viewed',
    (kind) => {
      const { phase, step } = findStep(kind)
      expect(completeStepGenuine(step, 'financial', { phase })).toBe(true)
      const resource = kind === 'workshop' ? step.workshopId : step.catalogId
      const record = useSimulationStore
        .getState()
        .evidence.find((item) => item.resourceId === resource)
      expect(record).toMatchObject({ origin: 'narrated-example', status: 'viewed' })
      expect(record?.status).not.toBe('practiced')
    }
  )

  it.each(['workshop', 'catalog'] as const)(
    'preserves the separate learner-origin %s participation record',
    (kind) => {
      const { phase, step } = findStep(kind)
      completeStepGenuine(step, 'financial', { phase, origin: 'learner' })
      const resource = kind === 'workshop' ? step.workshopId : step.catalogId
      const record = useSimulationStore
        .getState()
        .evidence.find((item) => item.resourceId === resource)
      expect(record).toMatchObject({ origin: 'learner', status: 'practiced' })
    }
  )

  it.each(['climb', 'intro'] as const)(
    'exhausts a shortened %s queue without claiming full framework maturity',
    async (mode) => {
      vi.useFakeTimers()
      const openStep = vi.fn()
      const closeEmbed = vi.fn()
      const { result } = renderHook(() => useSimAutoRunPlayer({ openStep, closeEmbed }))
      act(() => result.current.start({ mode }))
      // Drive the real player through its existing framing cards and timing
      // beats. Only its input queue is shortened; its completion branch and
      // visit/evidence behavior remain production code.
      for (let beat = 0; beat < 12 && !result.current.done; beat += 1) {
        act(() => {
          if (result.current.scenarioIntro) result.current.beginScenario()
          if (result.current.passIntro) result.current.beginPass()
          if (result.current.phaseIntro) result.current.beginPhase()
        })
        await act(async () => {
          await vi.advanceTimersByTimeAsync(10000)
        })
      }
      expect(result.current.done).toBe(true)
      expect(result.current.total).toBe(1)
      expect(openStep).toHaveBeenCalledTimes(1)
      expect(closeEmbed).toHaveBeenCalledTimes(1)
      expect(result.current.caption).not.toMatch(
        /full program maturity reached|migration complete/i
      )
      if (mode === 'intro') {
        expect(result.current.caption).toBe(
          'Short introduction complete — you have viewed selected resources on the threat and early planning.'
        )
      } else {
        expect(result.current.caption).toBe(
          'Sample journey complete — available steps and worked examples viewed; this does not establish full framework maturity.'
        )
      }
    }
  )

  it('describes the short introduction as resource viewing rather than a required asset decision', () => {
    render(
      <MemoryRouter>
        <SimPlayChoiceModal
          onClose={vi.fn()}
          onStart={vi.fn()}
          defaultCard="intro"
          defaultPhase="p0"
          sectorLabel="Financial services"
          inputSource="sample"
        />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('heading', { name: 'Start here — short introduction' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Explore the quantum threat and early planning through selected learning resources from Executive Mandate and Discovery. For making decisions yourself, choose the interactive board below.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/one exposed asset|one choice, its consequence/i)
    ).not.toBeInTheDocument()
  })

  it.each([false, true])('uses intro-only completion language with phone brief=%s', (brief) => {
    render(
      <MemoryRouter>
        <SimExecWalkthroughComplete intro brief={brief} onClose={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Short introduction complete' })).toBeInTheDocument()
    expect(
      screen.getByText('You have viewed selected resources on the threat and early planning.')
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        /You’ve seen the full program|end to end, from mandate to closure|Chapter summaries and sample-document notices/i
      )
    ).not.toBeInTheDocument()
  })
})
