// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 nav remediation (WP4) — leaving or stopping an auto-run always cleans up.
 *
 * The demo-fill flag used to survive an unmount mid-run (Back, a nav link, the
 * header's "Exit to hub"), so business tools opened elsewhere in the hub came up
 * pre-filled with demo content; and stop() left the run's open resource up.
 * stop() is now called from Reset / Start over / the exits too, so an idle
 * stop() must be harmless: no resume-playhead overwrite, no closeEmbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimAutoRunPlayer } from './useSimAutoRunPlayer'
import { isAutoRunFillActive, setAutoRunFill } from './autoRunFill'

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState((s) => ({
    modules: {},
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
})
afterEach(() => setAutoRunFill(false))

const renderPlayer = (closeEmbed = vi.fn()) =>
  renderHook(() => useSimAutoRunPlayer({ openStep: () => {}, closeEmbed }))

describe('auto-run cleanup (WP4)', () => {
  it('unmounting mid-run switches demo fill off', () => {
    const { result, unmount } = renderPlayer()
    act(() => result.current.start())
    expect(isAutoRunFillActive()).toBe(true)
    unmount()
    expect(isAutoRunFillActive()).toBe(false)
  })

  it('stop() on a live run closes its resource and switches demo fill off', () => {
    const closeEmbed = vi.fn()
    const { result } = renderPlayer(closeEmbed)
    act(() => result.current.start())
    act(() => result.current.stop())
    expect(closeEmbed).toHaveBeenCalledTimes(1)
    expect(isAutoRunFillActive()).toBe(false)
    expect(result.current.running).toBe(false)
  })

  it('stop() on an idle player is a no-op: no playhead overwrite, no closeEmbed', () => {
    const closeEmbed = vi.fn()
    const { result } = renderPlayer(closeEmbed)
    act(() => useSimulationStore.getState().setAutoRunResumeIndex(9))
    act(() => result.current.stop())
    expect(useSimulationStore.getState().autoRunResumeIndex).toBe(9)
    expect(closeEmbed).not.toHaveBeenCalled()
  })

  it('stop() is idempotent — a second call charges nothing more', () => {
    const closeEmbed = vi.fn()
    const { result } = renderPlayer(closeEmbed)
    act(() => result.current.start())
    act(() => result.current.stop())
    act(() => result.current.stop())
    expect(closeEmbed).toHaveBeenCalledTimes(1)
  })
})
