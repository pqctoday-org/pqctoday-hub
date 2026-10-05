// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useIsBelowMdViewport } from './useIsBelowMdViewport'

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  let changeHandler: ((e: MediaQueryListEvent) => void) | null = null
  const mql = {
    get matches() {
      return matches
    },
    addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') changeHandler = handler
    }),
    removeEventListener: vi.fn(),
  }
  const matchMedia = vi.fn(() => mql)
  vi.stubGlobal('matchMedia', matchMedia)
  return {
    matchMedia,
    setMatches: (next: boolean) => {
      matches = next
      changeHandler?.({ matches: next } as MediaQueryListEvent)
    },
  }
}

describe('useIsBelowMdViewport', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('asks about the md breakpoint, 768px', () => {
    const { matchMedia } = mockMatchMedia(true)
    renderHook(() => useIsBelowMdViewport())
    expect(matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('reads the width at once, below and above', () => {
    mockMatchMedia(true)
    expect(renderHook(() => useIsBelowMdViewport()).result.current).toBe(true)
    mockMatchMedia(false)
    expect(renderHook(() => useIsBelowMdViewport()).result.current).toBe(false)
  })

  it('follows the viewport across the breakpoint', () => {
    const media = mockMatchMedia(false)
    const { result } = renderHook(() => useIsBelowMdViewport())
    act(() => media.setMatches(true))
    expect(result.current).toBe(true)
    act(() => media.setMatches(false))
    expect(result.current).toBe(false)
  })

  it('is false without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(renderHook(() => useIsBelowMdViewport()).result.current).toBe(false)
  })
})
