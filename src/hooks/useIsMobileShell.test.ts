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

  // On by default as of 2026-08-23 (deliberate go-live decision — see
  // featureFlags.ts) — no localStorage/env setup needed for the on case
  // below; explicit '0' is the opt-out path, not '1' for opt-in.

  it('is true below lg with no flag set at all (the new default)', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobileShell())
    expect(result.current).toBe(true)
  })

  it('is false when explicitly opted out via "0", even below lg', () => {
    localStorage.setItem('pqc-feature-mobile-shell', '0')
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobileShell())
    expect(result.current).toBe(false)
  })

  it('is false when the viewport is at/above lg, flag on (default) or explicit "1"', () => {
    localStorage.setItem('pqc-feature-mobile-shell', '1')
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobileShell())
    expect(result.current).toBe(false)
  })

  it('is true when explicit "1" and the viewport is below lg (legacy opt-in value still works)', () => {
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
