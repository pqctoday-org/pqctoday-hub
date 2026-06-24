// SPDX-License-Identifier: GPL-3.0-only
/**
 * Resume behaviour — the single play button RESUMES from where the run left off.
 *
 * The resume point is the LITERAL playhead position (the queue index where the run
 * was interrupted), remembered in the sim store by stop(). It is NOT derived from
 * completion: the level-major queue shares completion keys across passes, so a
 * "first not-complete step" heuristic skips ahead to a unique late step (the
 * closure) — which is the bug this model fixes. So:
 *  - `resumable` is true exactly when a playhead is remembered (> 0), and flips back
 *    to false on completion and on Reset (the index lives in SEED);
 *  - `start()` lands the playhead on the remembered index (0 on a fresh run), and
 *    only shows the one-time scenario card on a fresh start.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimAutoRunPlayer } from './useSimAutoRunPlayer'
import { autoRunQueue } from './simAutoRun'

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

  it('becomes resumable once a playhead is remembered (a run was interrupted)', () => {
    const { result } = renderPlayer()
    expect(result.current.resumable).toBe(false)

    act(() => useSimulationStore.getState().setAutoRunResumeIndex(7))
    expect(result.current.resumable).toBe(true)
  })

  it('resumes start() at the EXACT remembered index and skips the scenario card', () => {
    const { result } = renderPlayer()
    const q = autoRunQueue()
    const where = Math.min(15, q.length - 1)

    // Simulate the run being interrupted at `where` (what stop() records).
    act(() => useSimulationStore.getState().setAutoRunResumeIndex(where))

    act(() => result.current.start())
    expect(result.current.index).toBe(where)
    // Resuming mid-queue does NOT replay the one-time scenario card.
    expect(result.current.scenarioIntro).toBeNull()
  })

  it('ignores a stale remembered index that is out of range (starts fresh)', () => {
    const { result } = renderPlayer()
    const q = autoRunQueue()
    act(() => useSimulationStore.getState().setAutoRunResumeIndex(q.length + 100))

    act(() => result.current.start())
    expect(result.current.index).toBe(0)
    expect(result.current.scenarioIntro).not.toBeNull()
  })

  it('returns to a fresh (non-resumable, index 0) run after Reset clears the playhead', () => {
    const { result } = renderPlayer()
    act(() => useSimulationStore.getState().setAutoRunResumeIndex(9))
    expect(result.current.resumable).toBe(true)

    // Reset clears the remembered playhead (it lives in SEED).
    act(() => useSimulationStore.getState().reset())
    expect(result.current.resumable).toBe(false)

    act(() => result.current.start())
    expect(result.current.index).toBe(0)
    expect(result.current.scenarioIntro).not.toBeNull()
  })
})
