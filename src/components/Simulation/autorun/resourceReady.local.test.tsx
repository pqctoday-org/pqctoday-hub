// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { slowScrollEmbed } from './useSimAutoRunPlayer'

afterEach(() => vi.useRealTimers())

describe('guided resource readiness', () => {
  it('waits for the real resource before completing its viewing beat', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    const { rerender } = render(
      <div data-sim-embed-pane>
        <div data-sim-embed-loading>Loading module</div>
      </div>
    )
    slowScrollEmbed({ speed: 'turbo', isCancelled: () => false, onDone })
    act(() => vi.advanceTimersByTime(1200))
    expect(onDone).not.toHaveBeenCalled()
    rerender(
      <div data-sim-embed-pane>
        <p>Resource content</p>
      </div>
    )
    act(() => vi.advanceTimersByTime(600))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('stops waiting when the run is cancelled', () => {
    vi.useFakeTimers()
    let cancelled = false
    const onDone = vi.fn()
    render(
      <div data-sim-embed-pane>
        <div data-sim-embed-loading>Loading module</div>
      </div>
    )
    slowScrollEmbed({ speed: 'turbo', isCancelled: () => cancelled, onDone })
    cancelled = true
    act(() => vi.advanceTimersByTime(1200))
    expect(onDone).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
