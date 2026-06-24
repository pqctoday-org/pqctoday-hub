// SPDX-License-Identifier: GPL-3.0-only
/**
 * Resume behaviour — the single play button RESUMES from where the run left off.
 *
 * Genuine hub completion persists after a run stops and is cleared by Reset, so:
 *  - `resumable` is true exactly when the FIRST gating step of the queue is already
 *    complete (and flips back to false when completion is cleared);
 *  - `start()` lands the playhead on the first NOT-completed gating step (0 on a
 *    fresh run), and only shows the one-time scenario card on a fresh start.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimAutoRunPlayer } from './useSimAutoRunPlayer'
import { autoRunQueue, completeStepGenuine } from './simAutoRun'

const noop = () => {}
const renderPlayer = () =>
  renderHook(() => useSimAutoRunPlayer({ openStep: noop, closeEmbed: noop }))

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState((s) => ({
    modules: {},
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
})

describe('auto-run resume', () => {
  it('is not resumable on a fresh run and starts the playhead at index 0', () => {
    const { result } = renderPlayer()
    expect(result.current.resumable).toBe(false)

    act(() => result.current.start())
    expect(result.current.index).toBe(0)
    // Fresh start shows the one-time scenario-framing card.
    expect(result.current.scenarioIntro).not.toBeNull()
  })

  it('becomes resumable once the first gating step is genuinely complete', () => {
    const { result } = renderPlayer()
    const first = autoRunQueue()[0].step

    act(() => {
      completeStepGenuine(first)
    })
    expect(result.current.resumable).toBe(true)
  })

  it('resumes start() at the first NOT-completed gating step and skips the scenario card', () => {
    const { result } = renderPlayer()
    const q = autoRunQueue()
    // Genuinely complete a prefix of the queue.
    const prefix = 3
    act(() => {
      for (let i = 0; i < prefix; i++) completeStepGenuine(q[i].step)
    })

    // The first not-complete step is the resume point (>= prefix; >= since shared
    // artifact types can satisfy several queued steps at once).
    act(() => result.current.start())
    expect(result.current.index).toBeGreaterThanOrEqual(prefix)
    expect(q[result.current.index]).toBeDefined()
    // Resuming mid-queue does NOT replay the one-time scenario card.
    expect(result.current.scenarioIntro).toBeNull()
  })

  it('returns to a fresh (non-resumable, index 0) run after completion is cleared (Reset)', () => {
    const { result } = renderPlayer()
    const first = autoRunQueue()[0].step
    act(() => {
      completeStepGenuine(first)
    })
    expect(result.current.resumable).toBe(true)

    // Reset clears genuine completion (the sim store + module artifacts).
    act(() => {
      useSimulationStore.getState().reset()
      useModuleStore.setState((s) => ({
        modules: {},
        artifacts: { ...s.artifacts, executiveDocuments: [] },
      }))
    })
    expect(result.current.resumable).toBe(false)

    act(() => result.current.start())
    expect(result.current.index).toBe(0)
    expect(result.current.scenarioIntro).not.toBeNull()
  })
})
