// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Which Timeline lanes each region filter shows.
 *
 * A lane sits in the region its flag code has in the jurisdictions registry
 * (jurisdictions_*.csv), so a region's lanes are never typed here. The registry's
 * countries come first, then any Timeline lane that registry code covers, which is
 * how the NSA CNSA 2.0 lane ("United States (CNSA)", flag US) joins the Americas.
 * A lane with no jurisdiction behind it (Global, International, G7, NATO) belongs
 * to the Global region.
 *
 * Before 2026-11-14 twelve Timeline lanes (22 events, including all ten NSA
 * CNSA 2.0 rows) were in no region, so every region filter hid them and the
 * Coverage-by-region tiles under-counted. timelineRemediation1114.test.ts checks
 * that every lane belongs to exactly one region, apart from the lanes listed in
 * TIMELINE_UNREGIONED_LANES.
 *
 * Regions are reading groups, not legal statements: `eu` is the Europe group
 * (the registry's `eu` and `europe-noneu` regions together, so the United Kingdom,
 * Norway and Switzerland are in it), and membership never implies EU law applies;
 * see EU_MEMBER_CODES for that.
 */
import {
  JURISDICTION_BY_CODE,
  JURISDICTION_BY_NAME,
  JURISDICTION_NAMES_BY_REGION,
  type JurisdictionRegion,
} from './jurisdictionsData'
import { timelineData } from './timelineData'

/** The Timeline region a registry region belongs to; null when the filter offers none. */
const TIMELINE_REGION_OF: Record<JurisdictionRegion, string | null> = {
  americas: 'americas',
  eu: 'eu',
  'europe-noneu': 'eu',
  mena: 'mena',
  apac: 'apac',
  africa: null,
}

/** The registry jurisdiction behind a lane: by flag code, else by lane name. */
function jurisdictionOfLane(lane: { countryName: string; flagCode: string }) {
  return (
    JURISDICTION_BY_CODE[lane.flagCode.trim().toUpperCase()] ??
    JURISDICTION_BY_NAME[lane.countryName.replace(/ \(CNSA\)$/, '')]
  )
}

/**
 * Lanes deliberately in no region: the registry's `africa` jurisdictions (Nigeria has a
 * lane). Africa is not a region the filter offers, and MENA would misplace it; those lanes
 * stay reachable from "All Regions", the country picker and search.
 */
export const TIMELINE_UNREGIONED_LANES: readonly string[] = JURISDICTION_NAMES_BY_REGION.africa

export const TIMELINE_REGION_COUNTRIES: Readonly<Record<string, readonly string[]>> = (() => {
  const regions: Record<string, Set<string>> = {
    americas: new Set(),
    eu: new Set(),
    mena: new Set(),
    apac: new Set(),
    global: new Set(),
  }
  for (const [registryRegion, names] of Object.entries(JURISDICTION_NAMES_BY_REGION)) {
    const target = TIMELINE_REGION_OF[registryRegion as JurisdictionRegion]
    // eslint-disable-next-line security/detect-object-injection -- fixed keys
    if (target) for (const name of names) regions[target].add(name)
  }
  for (const lane of timelineData) {
    const jurisdiction = jurisdictionOfLane(lane)
    const target = jurisdiction ? TIMELINE_REGION_OF[jurisdiction.region] : 'global'
    // eslint-disable-next-line security/detect-object-injection -- fixed keys
    if (target) regions[target].add(lane.countryName)
  }
  return Object.fromEntries(Object.entries(regions).map(([region, names]) => [region, [...names]]))
})()

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
