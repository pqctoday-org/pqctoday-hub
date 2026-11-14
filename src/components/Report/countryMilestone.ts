// SPDX-License-Identifier: AGPL-3.0-only
import { timelineData, transformToGanttData } from '../../data/timelineData'
import { COUNTRY_PLANNING_MANDATE } from '../../hooks/assessmentData'
import type { GanttCountryData } from '../../types/timeline'
import type { TimelineMilestone } from '../../hooks/assessmentTypes'

// Module scope, so the current-year read is not an impure call during render.
const CURRENT_YEAR = new Date().getFullYear()

export interface CountryMilestone {
  year: number
  title: string
  /** True only for a row curated as a binding mandate (timeline CSV `mandate_type` HARD). */
  binding: boolean
  /** The timeline row's published source, when it has one. */
  sourceUrl?: string
  /** The date the source was published or last checked, as the timeline row states it. */
  sourceDate?: string
}

/**
 * The country's next upcoming Deadline-category milestone — never one in a past year.
 * Event-level, like TimelineExecutiveDeadline.tsx: the earliest row of ANY year used to
 * win, so a US report showed "deadline: 2025" (a not-before date) ahead of the 2030/2031
 * EO 14412 milestones. A curated HARD row is preferred over guidance in the same year.
 */
export function nextMilestoneIn(
  ganttData: GanttCountryData[],
  countryName: string,
  currentYear: number = CURRENT_YEAR
): CountryMilestone | null {
  const countryData = ganttData.find(
    (g) => g.country.countryName.toLowerCase() === countryName.toLowerCase()
  )
  if (!countryData) return null

  let best: CountryMilestone | null = null
  for (const phase of countryData.phases) {
    for (const ev of phase.events) {
      if (ev.phase !== 'Deadline' || ev.startYear < currentYear) continue
      const binding =
        (ev.mandateType ?? COUNTRY_PLANNING_MANDATE[countryData.country.countryName]) === 'HARD'
      if (
        !best ||
        ev.startYear < best.year ||
        (ev.startYear === best.year && binding && !best.binding)
      ) {
        best = { year: ev.startYear, title: ev.title, binding }
        if (ev.sourceUrl) best.sourceUrl = ev.sourceUrl
        if (ev.sourceDate) best.sourceDate = ev.sourceDate
      }
    }
  }
  return best
}

/** The next milestone for a country in the shipped timeline data. */
export function findCountryNextMilestone(countryName: string): CountryMilestone | null {
  return nextMilestoneIn(transformToGanttData(timelineData), countryName)
}

/**
 * The deadline the visitor picked in the Assess timeline step, as the report plots it.
 *
 * The saved pair names the country's timeline phase (`id` is the phase title) and its
 * end year, so the roadmap is paced to that date rather than to whichever milestone
 * happens to be next. Returns null when the country has no phase by that name and
 * year (the answer was for another country, or the timeline data has since changed),
 * so the caller falls back to the country's next milestone instead of plotting a date
 * that cannot be tied to a published row. Binding status is read from the phase's own
 * rows, with the country's curated planning mandate as the fallback, never assumed.
 */
export function selectedMilestoneIn(
  ganttData: GanttCountryData[],
  countryName: string,
  chosen: TimelineMilestone,
  currentYear: number = CURRENT_YEAR
): CountryMilestone | null {
  // A deadline that has already passed can't pace a roadmap; the caller falls back to
  // the country's next milestone.
  if (chosen.year !== undefined && chosen.year < currentYear) return null
  const countryData = ganttData.find(
    (g) => g.country.countryName.toLowerCase() === countryName.toLowerCase()
  )
  if (!countryData) return null
  const phase = countryData.phases.find(
    (p) =>
      p.phase === 'Deadline' &&
      p.title === chosen.id &&
      (chosen.year === undefined || p.endYear === chosen.year)
  )
  if (!phase || phase.endYear < currentYear) return null
  const binding = (phase.events ?? []).some(
    (ev) => (ev.mandateType ?? COUNTRY_PLANNING_MANDATE[countryData.country.countryName]) === 'HARD'
  )
  const milestone: CountryMilestone = {
    year: chosen.year ?? phase.endYear,
    title: phase.title,
    binding,
  }
  const sourced = (phase.events ?? []).find((ev) => ev.sourceUrl)
  if (sourced?.sourceUrl) milestone.sourceUrl = sourced.sourceUrl
  if (sourced?.sourceDate) milestone.sourceDate = sourced.sourceDate
  return milestone
}

/** The visitor's chosen milestone in the shipped timeline data, if it is still there. */
export function findSelectedMilestone(
  countryName: string,
  chosen: TimelineMilestone
): CountryMilestone | null {
  return selectedMilestoneIn(transformToGanttData(timelineData), countryName, chosen)
}

export interface MilestoneGroup {
  /** The issuing body as the timeline names it (e.g. "Federal Agencies", "NSA", "NIAP"). */
  body: string
  milestones: CountryMilestone[]
}

/**
 * Every upcoming Deadline-category milestone for a country, grouped by the body that
 * set it, so a report names whose systems each date applies to instead of one badge
 * for the whole country (executive journey remediation B3). Past years never appear.
 * Groups are ordered by their earliest year; milestones by year, binding first.
 */
export function upcomingMilestonesIn(
  ganttData: GanttCountryData[],
  countryName: string,
  currentYear: number = CURRENT_YEAR
): MilestoneGroup[] {
  const countryData = ganttData.find(
    (g) => g.country.countryName.toLowerCase() === countryName.toLowerCase()
  )
  if (!countryData) return []

  const byBody = new Map<string, Map<string, CountryMilestone>>()
  for (const phase of countryData.phases) {
    for (const ev of phase.events) {
      if (ev.phase !== 'Deadline' || ev.startYear < currentYear) continue
      const body = ev.orgName?.trim() || countryData.country.countryName
      const binding =
        (ev.mandateType ?? COUNTRY_PLANNING_MANDATE[countryData.country.countryName]) === 'HARD'
      const seen = byBody.get(body) ?? new Map<string, CountryMilestone>()
      seen.set(`${ev.startYear}|${ev.title}`, { year: ev.startYear, title: ev.title, binding })
      byBody.set(body, seen)
    }
  }
  return [...byBody.entries()]
    .map(([body, seen]) => ({
      body,
      milestones: [...seen.values()].sort(
        (a, b) => a.year - b.year || Number(b.binding) - Number(a.binding)
      ),
    }))
    .sort((a, b) => a.milestones[0].year - b.milestones[0].year || a.body.localeCompare(b.body))
}

/** Upcoming milestones for a country in the shipped timeline data, grouped by body. */
export function findCountryMilestoneGroups(countryName: string): MilestoneGroup[] {
  return upcomingMilestonesIn(transformToGanttData(timelineData), countryName)
}
