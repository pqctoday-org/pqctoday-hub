// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Which Timeline lanes each region filter shows.
 *
 * Starts from the site-wide REGION_COUNTRIES_MAP (personaConfig.ts) and adds the
 * Timeline's own lanes that map does not list. That map also drives Assess and
 * the compliance applicability engine, so lanes are added HERE rather than
 * there: widening it would change what those pages treat as "your region".
 *
 * Before 2026-11-14 twelve Timeline lanes (22 events, including all ten NSA
 * CNSA 2.0 rows) were in no region, so every region filter hid them and the
 * Coverage-by-region tiles under-counted. timelineRegionCountries.test.ts checks
 * that every lane belongs to exactly one region, apart from the lanes listed in
 * TIMELINE_UNREGIONED_LANES.
 *
 * Regions are reading groups, not legal statements: `eu` is the Europe group
 * (the United Kingdom, Norway and Switzerland are in it, as the UK already was),
 * and membership never implies EU law applies — see EU_MEMBER_CODES for that.
 */
import { REGION_COUNTRIES_MAP } from './personaConfig'

const TIMELINE_LANE_ADDITIONS: Record<string, string[]> = {
  // The loader splits NSA's CNSA 2.0 rows into their own lane (timelineData.ts).
  americas: ['United States (CNSA)', 'Brazil', 'Uruguay'],
  eu: ['Denmark', 'Finland', 'Netherlands', 'Norway', 'Sweden', 'Switzerland'],
  apac: ['Indonesia', 'Thailand'],
  mena: [],
  global: [],
}

/**
 * Lanes deliberately in no region. Nigeria is in Africa, which the region
 * filter does not offer, and MENA would misplace it; it stays reachable from
 * "All Regions", the country picker and search.
 */
export const TIMELINE_UNREGIONED_LANES: readonly string[] = ['Nigeria']

export const TIMELINE_REGION_COUNTRIES: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(
    Object.entries(REGION_COUNTRIES_MAP).map(([region, countries]) => [
      region,
      // eslint-disable-next-line security/detect-object-injection -- fixed keys
      [...new Set([...countries, ...(TIMELINE_LANE_ADDITIONS[region] ?? [])])],
    ])
  )

/** The Timeline lanes a region shows; [] for an unknown region. */
export function timelineRegionCountries(region: string): readonly string[] {
  return Object.prototype.hasOwnProperty.call(TIMELINE_REGION_COUNTRIES, region)
    ? // eslint-disable-next-line security/detect-object-injection -- own key checked
      TIMELINE_REGION_COUNTRIES[region]
    : []
}

/** True when `countryName` is shown under `region` ('All' shows every lane). */
export function laneInTimelineRegion(countryName: string, region: string): boolean {
  return region === 'All' || timelineRegionCountries(region).includes(countryName)
}
