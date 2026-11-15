// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ONE answer to "which Gantt rows are in view?" on /timeline.
 *
 * Before 2026-11-14 the chart, the executive deadline card, the phone list, the
 * CSV exports and the calendar export each filtered on their own, and they
 * disagreed: the chart searched only country and body names, the calendar
 * ignored the phase filter and `?region=global`, the top-bar CSV ignored every
 * filter. Each surface now calls `filterGanttView` with the same inputs.
 *
 * Pure: no stores, no URL reads.
 */
import type { GanttCountryData, TimelineEvent, TimelinePhase } from '@/types/timeline'
import { laneInTimelineRegion } from './timelineRegionCountries'

export interface GanttViewFilter {
  /** Region id, or 'All'. Ignored when `country` names a lane. */
  region?: string
  /** Lane name, or 'All'. */
  country?: string
  /** Free-text search. */
  query?: string
  /** Lower-cased semantic-search hit ids ("Country — Title"), or null when off. */
  semanticHits?: readonly string[] | null
  /** A Phase, or 'All'. */
  phase?: string
  /** 'Phase' | 'Milestone', or 'All'. */
  etype?: string
  /** "My countries only". */
  onlyMyCountries?: boolean
  myCountries?: readonly string[]
}

/** The text a search is matched against for one event. */
function eventHaystack(e: TimelineEvent): string {
  return [
    e.title,
    e.description,
    e.orgName,
    e.orgFullName,
    e.eventId ?? '',
    e.phase,
    ...(e.relatedStandards ?? []),
    ...(e.libraryRefs ?? []),
  ]
    .join('\n')
    .toLowerCase()
}

/** True when the event's own text, or a semantic hit naming it, matches. */
export function eventMatchesQuery(
  e: TimelineEvent,
  query: string,
  semanticHits?: readonly string[] | null
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (eventHaystack(e).includes(q)) return true
  if (!semanticHits || semanticHits.length === 0) return false
  // Search chunks are titled "<CSV country> — <title>"; the CNSA lane's chunks
  // carry the CSV's own "United States".
  const titleLc = e.title.trim().toLowerCase()
  return semanticHits.some((hit) => hit.endsWith(` — ${titleLc}`))
}

/**
 * Narrow one lane by a search. A match on the lane itself (its name or any
 * body's name or full name) keeps every row, as before; otherwise only the rows
 * holding a matching event stay. Returns null when nothing in the lane matches.
 */
export function searchLane(
  lane: GanttCountryData,
  query: string,
  semanticHits?: readonly string[] | null
): GanttCountryData | null {
  const q = query.trim().toLowerCase()
  if (!q) return lane
  const nameLc = lane.country.countryName.toLowerCase()
  const laneMatch =
    nameLc.includes(q) ||
    lane.country.bodies.some(
      (b) => b.name.toLowerCase().includes(q) || (b.fullName ?? '').toLowerCase().includes(q)
    )
  if (laneMatch) return lane
  const phases = lane.phases.filter(
    (p) =>
      p.phase.toLowerCase().includes(q) ||
      p.events.some((e) => eventMatchesQuery(e, q, semanticHits))
  )
  if (phases.length > 0) return { ...lane, phases }
  // A semantic hit that names the lane but no single event (e.g. a summary chunk).
  if (semanticHits?.some((hit) => hit.includes(nameLc))) return lane
  return null
}

/** Apply every view filter, in the order the chart always applied them. */
export function filterGanttView(
  data: readonly GanttCountryData[],
  filter: GanttViewFilter
): GanttCountryData[] {
  const {
    region = 'All',
    country = 'All',
    query = '',
    semanticHits = null,
    phase = 'All',
    etype = 'All',
    onlyMyCountries = false,
    myCountries = [],
  } = filter
  const out: GanttCountryData[] = []
  for (const lane of data) {
    const name = lane.country.countryName
    if (country !== 'All' ? name !== country : !laneInTimelineRegion(name, region)) continue
    if (onlyMyCountries && !myCountries.includes(name)) continue
    const searched = searchLane(lane, query, semanticHits)
    if (!searched) continue
    const phases = searched.phases.filter(
      (p) => (phase === 'All' || p.phase === phase) && (etype === 'All' || p.type === etype)
    )
    if (phases.length > 0) out.push({ ...searched, phases })
  }
  return out
}

/** Every event of the rows in view, each once, in row order. */
export function eventsInView(data: readonly GanttCountryData[]): TimelineEvent[] {
  const seen = new Set<TimelineEvent>()
  const out: TimelineEvent[] = []
  for (const lane of data)
    for (const p of lane.phases)
      for (const e of p.events)
        if (!seen.has(e)) {
          seen.add(e)
          out.push(e)
        }
  return out
}

/**
 * The year a Deadline-phase record falls due: its end year when it states a
 * range ("2026–2031: classical-only key agreement ends 2031"), else its year.
 */
export function deadlineYear(e: Pick<TimelineEvent, 'startYear' | 'endYear'>): number {
  return e.endYear >= e.startYear ? e.endYear : e.startYear
}

/** The issuing bodies of a row, in first-seen order. */
export function phaseOrgs(phase: TimelinePhase): Array<{ name: string; fullName: string }> {
  const seen = new Map<string, string>()
  for (const e of phase.events) if (!seen.has(e.orgName)) seen.set(e.orgName, e.orgFullName)
  return [...seen].map(([name, fullName]) => ({ name, fullName }))
}

/** DOM id of a lane's first Gantt row — the left-rail list scrolls to it. */
export function timelineRowDomId(countryName: string): string {
  return `timeline-row-${countryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}
