// SPDX-License-Identifier: GPL-3.0-only
import { timelineData } from '@/data/timelineData'
import type { TimelineEvent } from '@/types/timeline'

/**
 * Compliance CSV `timeline_refs` entries are `country:org` tuples (e.g.
 * `"United States:NSA"`, `"France:ANSSI"`). This utility resolves a ref to the
 * actual timeline events for that regulatory body so the compliance UI can
 * display dated milestones next to the free-text `deadline` field — surfacing
 * any drift between the two CSVs.
 */

export interface ParsedTimelineRef {
  country: string
  org: string
}

export interface ResolvedTimelineRef {
  ref: string
  country: string
  org: string
  events: TimelineEvent[]
  /** Earliest `startYear` across the resolved events, or undefined if none. */
  earliestYear?: number
  /** Latest `endYear` across the resolved events, or undefined if none. */
  latestYear?: number
}

/** Split a `"country:org"` ref into its parts. Robust to extra whitespace. */
export function parseTimelineRef(ref: string): ParsedTimelineRef | null {
  if (!ref) return null
  const [rawCountry, rawOrg] = ref.split(':')
  const country = rawCountry?.trim()
  const org = rawOrg?.trim()
  if (!country || !org) return null
  return { country, org }
}

// ── Index built once on module load ─────────────────────────────────────

type OrgKey = string // `${country}::${org}` lowercase
const orgIndex: Map<OrgKey, TimelineEvent[]> = new Map()
const knownCountries: Set<string> = new Set()
const knownOrgs: Set<string> = new Set()

function key(country: string, org: string): OrgKey {
  return `${country.trim().toLowerCase()}::${org.trim().toLowerCase()}`
}

for (const country of timelineData) {
  knownCountries.add(country.countryName.trim().toLowerCase())
  for (const body of country.bodies) {
    knownOrgs.add(body.name.trim().toLowerCase())
    const k = key(country.countryName, body.name)
    if (!orgIndex.has(k)) orgIndex.set(k, [])
    orgIndex.get(k)!.push(...body.events)
  }
}

/**
 * Resolve a `country:org` ref to its timeline events. Returns an object
 * describing what matched — never throws, never returns undefined.
 *
 * @param ref the raw `timelineRef` string from compliance CSV
 */
export function resolveTimelineRef(ref: string): ResolvedTimelineRef {
  const parsed = parseTimelineRef(ref)
  if (!parsed) {
    return { ref, country: '', org: '', events: [] }
  }
  const { country, org } = parsed
  const events = orgIndex.get(key(country, org)) ?? []
  if (events.length === 0) {
    return { ref, country, org, events: [] }
  }
  const earliestYear = Math.min(...events.map((e) => e.startYear))
  const latestYear = Math.max(...events.map((e) => e.endYear))
  return { ref, country, org, events, earliestYear, latestYear }
}

/** Check whether the country component of a ref exists in the timeline data. */
export function isKnownTimelineCountry(country: string): boolean {
  return knownCountries.has(country.trim().toLowerCase())
}

/** Check whether the org component of a ref exists in any country. */
export function isKnownTimelineOrg(org: string): boolean {
  return knownOrgs.has(org.trim().toLowerCase())
}
