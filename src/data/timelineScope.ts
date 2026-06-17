// SPDX-License-Identifier: GPL-3.0-only
/**
 * Timeline scope helper (C6) — pure predicate that filters `CountryData[]` to a
 * sim-supplied scope. Shared between `TimelineView` (behaviour-preserving refactor
 * of the inline `ganttData` memo) and `TimelineEmbed` (the sim mount arm).
 *
 * `TimelineView` continues to work exactly as before: it passes its resolved
 * `categoryFilter` / `tierFilter` / country / region values to `applyTimelineScope`
 * instead of inlining the predicate. Pinned by the existing `TimelineView.test.ts`.
 */
import type { CountryData } from '@/types/timeline'
import type { EntityType } from '@/types/timeline'
import { matchesCategoryFilter } from '@/components/Timeline/CategoryFilter'
import { matchesTrustTierFilter } from '@/components/common/TrustTierFilter'
import { CATEGORY_DEFAULT } from '@/components/Timeline/CategoryFilter'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'

export interface TimelineScope {
  /** Show only this country. Takes precedence over `region`. */
  country?: string
  /** Show only countries in this region (e.g. 'Europe'). */
  region?: string
  /** Entity-type filter — defaults to CATEGORY_DEFAULT when omitted. */
  categories?: EntityType[]
}

/**
 * Apply a scope to a `CountryData[]`, returning the filtered+narrowed set.
 * This is the extracted form of the `ganttData` useMemo in `TimelineView`.
 * Pure: no stores, no URL reads.
 */
export function applyTimelineScope(
  countries: CountryData[],
  scope: TimelineScope = {}
): CountryData[] {
  const { country, region, categories } = scope
  const cats = categories ?? CATEGORY_DEFAULT

  // 1. Narrow to the requested country / region
  let narrowed = countries
  if (country && country !== 'All') {
    narrowed = countries.filter((c) => c.countryName === country)
  } else if (region && region !== 'All') {
    const inRegion = REGION_COUNTRIES_MAP[region as keyof typeof REGION_COUNTRIES_MAP] ?? []
    narrowed = countries.filter((c) => inRegion.includes(c.countryName))
  }

  // 2. Filter events by category (and drop empty bodies/countries)
  return narrowed
    .map((c) => ({
      ...c,
      bodies: c.bodies
        .map((body) => ({
          ...body,
          events: body.events.filter((ev) => matchesCategoryFilter(cats, ev.entityType)),
        }))
        .filter((body) => body.events.length > 0),
    }))
    .filter((c) => c.bodies.length > 0)
}

/**
 * Apply a trust-tier filter on top of an already-scoped country array.
 * Separated because `useTrustTierFilter` is a hook that can't run inside
 * `applyTimelineScope` — callers supply the resolved `tiers[]`.
 */
export function applyTierFilter(countries: CountryData[], tiers: string[]): CountryData[] {
  if (tiers.length === 0) return countries
  return countries
    .map((c) => ({
      ...c,
      bodies: c.bodies
        .map((body) => ({
          ...body,
          events: body.events.filter((ev) => matchesTrustTierFilter(tiers, 'timeline', ev.title)),
        }))
        .filter((body) => body.events.length > 0),
    }))
    .filter((c) => c.bodies.length > 0)
}

/**
 * Parse the `scope` from a tree-step's `to` query string.
 * Supports `?country=Germany`, `?region=Europe`.
 * An empty scope means "default" — caller supplies a fallback (e.g. assessed jurisdiction).
 */
export function parseTimelineScope(to: string): TimelineScope {
  const qIdx = to.indexOf('?')
  if (qIdx < 0) return {}
  const params = new URLSearchParams(to.slice(qIdx + 1))
  const scope: TimelineScope = {}
  const country = params.get('country')
  const region = params.get('region')
  if (country) scope.country = country
  else if (region) scope.region = region
  return scope
}
