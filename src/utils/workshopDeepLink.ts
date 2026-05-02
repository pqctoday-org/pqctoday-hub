// SPDX-License-Identifier: GPL-3.0-only
import type { WorkshopStep } from '@/types/Workshop'

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
