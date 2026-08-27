// SPDX-License-Identifier: GPL-3.0-only
import type { WorkshopStep, WorkshopRegion } from '@/types/Workshop'
import type { Region } from '@/store/usePersonaStore'

/**
 * Build a URL string (path + query) for a workshop step's target page.
 * Used by both the Workshop Mode "Open this page" CTA and the Video Mode
 * navigate cue. Returned URL is relative (e.g. "/timeline?country=US").
 */
export function buildStepUrl(step: WorkshopStep): string {
  return buildUrl(step.page.route, step.page.query)
}

export function buildUrl(route: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) return route
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${route}?${qs}` : route
}

/** Read the current pathname and compare against a step's expected route. */
export function isOnStepRoute(step: WorkshopStep, currentPath: string): boolean {
  return currentPath === step.page.route || currentPath.startsWith(step.page.route + '/')
}

/**
 * Map the persona store's coarse region (americas | eu | mena | apac | global)
 * to the workshop's finer-grained region. Picks a sensible default for each
 * bloc: americas → US, apac → AU, eu → EU. mena / global / null → null (user
 * picks manually — desktop's own WorkshopPrereqList region picker).
 *
 * Pure-moved from WorkshopPanel.tsx (2026-08-23) so the mobile workshop entry
 * point can resolve the same real default without importing a desktop view
 * component — same function, same behavior, one source of truth.
 */
export function personaRegionToWorkshop(r: Region | null): WorkshopRegion | null {
  switch (r) {
    case 'americas':
      return 'US'
    case 'apac':
      return 'AU'
    case 'eu':
      return 'EU'
    default:
      return null
  }
}
