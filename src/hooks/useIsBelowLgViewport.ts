// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'

/** Tailwind's `lg` breakpoint (`--breakpoint-lg: 64rem` in theme.css) — the
 *  exact width MainLayout.tsx's rail uses to switch between the desktop left
 *  rail (`hidden lg:flex`) and the mobile header/nav-row (`lg:hidden`). */
const BELOW_LG_QUERY = '(max-width: 1023px)'

/**
 * True when the viewport is below Tailwind's `lg` breakpoint (1024px) — the
 * one and only threshold MainLayout.tsx's rail rebuild (persona-journeys
 * A-grade redesign, 2026-08-01) uses to decide desktop-rail vs. mobile-nav.
 *
 * Shared by MainLayout.tsx (to suppress its own header chrome when the
 * Curious persona's bespoke mobile board takes over '/') and LandingView.tsx
 * (to decide whether to render `CuriousMobileBoard` instead of
 * `PersonaBoardView` for that same persona/route) — a single source of truth
 * so the two can never disagree about which breakpoint means "mobile" here.
 * Mirrors the existing inline `matchMedia` pattern used elsewhere in the repo
 * (ComplianceTable.tsx, EmbedLayout.tsx, SimulationView.tsx), just centralized
 * because two independent components must agree on this one value.
 */
export function useIsBelowLgViewport(): boolean {
  const [isBelowLg, setIsBelowLg] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(BELOW_LG_QUERY).matches
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(BELOW_LG_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsBelowLg(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isBelowLg
}
