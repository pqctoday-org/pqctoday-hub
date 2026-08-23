// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobileShell } from './useIsMobileShell'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches,
      media: '(max-width: 1023px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
}

describe('useIsMobileShell', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('is false when the flag is off, even below lg', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobileShell())
    expect(result.current).toBe(false)
  })

  it('is false when the flag is on but the viewport is at/above lg', () => {
    localStorage.setItem('pqc-feature-mobile-shell', '1')
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobileShell())
    expect(result.current).toBe(false)
  })

  it('is true when the flag is on and the viewport is below lg', () => {
    localStorage.setItem('pqc-feature-mobile-shell', '1')
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobileShell())
    expect(result.current).toBe(true)
  })

  // /embed's own EmbedProvider always supplies a real context; outside it
  // useIsEmbedded() reads false, which is the only case unit-testable here
  // without mounting EmbedProvider. The `/embed` route itself never renders
  // MainLayout (see App.tsx's separate embed <Route> tree), so the isEmbedded
  // branch is structurally unreachable from the one call site that matters.
})
