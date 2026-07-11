// SPDX-License-Identifier: GPL-3.0-only
/**
 * Play-This-Phase completion — the progress counter must land on N/N (not N-1/N)
 * once every queued step has genuinely completed. Regression test for the
 * `goNext` completion branch never advancing `index` past the second-to-last
 * queue position (it only ever called setDone/setRunning, never setIndex).
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import type { PhaseId } from '@/data/frameworkPhases'
import { useSimAutoRunPlayer } from './useSimAutoRunPlayer'
import { autoRunPhaseQueue } from './simAutoRun'

const noop = () => {}
const renderPlayer = () =>
  renderHook(() => useSimAutoRunPlayer({ openStep: noop, closeEmbed: noop }))

// p2 has the shortest phase queue (7 items as of writing) — quickest to drive
// through a real fake-timer run without hardcoding a length that could drift.
const PHASE: PhaseId = 'p2'

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState((s) => ({
    modules: {},
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Play This Phase completion', () => {
  it('lands the counter on N/N (not N-1/N) once the run genuinely finishes', () => {
    const total = autoRunPhaseQueue(PHASE, false).length

    const { result } = renderPlayer()
    act(() => result.current.cycleSpeed()) // normal -> fast
    act(() => result.current.cycleSpeed()) // fast -> turbo (minimizes per-step dwell)

    act(() => result.current.start({ mode: 'phase', phase: PHASE }))
    expect(result.current.total).toBe(total)

    // Advance in small increments, each in its own `act()` — a single giant
    // advanceTimersByTime call runs every due callback synchronously without ever
    // letting React flush the effects that schedule the NEXT timer, so the chain
    // stalls after the first step. Looping lets each act() flush in between.
    for (let i = 0; i < 30 && !result.current.done; i++) {
      act(() => {
        vi.advanceTimersByTime(2000)
      })
    }

    expect(result.current.done).toBe(true)
    expect(result.current.running).toBe(false)
    expect(result.current.index).toBe(result.current.total)
  })
})
