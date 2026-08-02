// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsBelowLgViewport } from './useIsBelowLgViewport'

/** Minimal MediaQueryList mock, capturing the `change` listener so tests can
 *  simulate a live viewport resize the way EmbedLayout.test.tsx / a resize
 *  observer would. */
function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  let changeHandler: ((e: MediaQueryListEvent) => void) | null = null

  const mql = {
    get matches() {
      return matches
    },
    media: '(max-width: 1023px)',
    addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') changeHandler = handler
    }),
    removeEventListener: vi.fn(),
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql)
  )

  return {
    setMatches: (next: boolean) => {
      matches = next
      changeHandler?.({ matches: next } as MediaQueryListEvent)
    },
  }
}

describe('useIsBelowLgViewport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the initial viewport width synchronously (below lg)', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsBelowLgViewport())
    expect(result.current).toBe(true)
  })

  it('reads the initial viewport width synchronously (lg and above)', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsBelowLgViewport())
    expect(result.current).toBe(false)
  })

  it('updates when the viewport crosses the breakpoint', () => {
    const media = mockMatchMedia(false)
    const { result } = renderHook(() => useIsBelowLgViewport())
    expect(result.current).toBe(false)

    act(() => {
      media.setMatches(true)
    })

    expect(result.current).toBe(true)
  })

  it('queries the exact `lg` breakpoint (1023px max-width — Tailwind lg = 1024px)', () => {
    mockMatchMedia(false)
    renderHook(() => useIsBelowLgViewport())
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1023px)')
  })
})
