// SPDX-License-Identifier: GPL-3.0-only
import { timelineData, transformToGanttData } from '../../data/timelineData'
import { COUNTRY_PLANNING_MANDATE } from '../../hooks/assessmentData'
import type { GanttCountryData } from '../../types/timeline'

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
