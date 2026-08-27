// SPDX-License-Identifier: GPL-3.0-only
import { useMobileShell } from '@/services/featureFlags'
import { useIsBelowLgViewport } from './useIsBelowLgViewport'
import { useIsEmbedded } from '@/embed/EmbedProvider'

/**
 * The single gate for the mobile UX layer (IMPLEMENTATION-PLAN.md §5.1).
 * True only when the feature flag is on, the viewport is below Tailwind's
 * `lg` breakpoint (the same 1024px threshold the desktop rail already
 * splits on), and the route is not embedded (`/embed` keeps its own
 * dedicated layout regardless of viewport).
 *
 * `MainLayout` and `SimulationView` are the only two call sites permitted
 * to branch on this (the plan's two sanctioned mount points) — every other
 * component under `src/components/Mobile/` is reached only through them,
 * never by checking this hook itself.
 */
export function useIsMobileShell(): boolean {
  const flagOn = useMobileShell()
  const isBelowLg = useIsBelowLgViewport()
  const isEmbedded = useIsEmbedded()
  return flagOn && isBelowLg && !isEmbedded
}
