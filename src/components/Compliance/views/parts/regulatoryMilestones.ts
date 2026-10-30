// SPDX-License-Identifier: AGPL-3.0-only
import type { ComplianceFramework } from '../../../../data/complianceData'
import type { ApplicabilityResult } from '../../../../utils/applicabilityEngine'

export interface ReferenceMilestone {
  item: ComplianceFramework
  /** First declared year that is not already past. */
  year: number
}

/**
 * `deadlineYear` is the EARLIEST declared year, so a phased framework (for
 * example a 2025 start and a 2033 completion) would drop out of the list as soon
 * as its first year passes. Read the declared years instead and take the next one.
 */
function nextMilestoneYear(item: ComplianceFramework, currentYear: number): number | undefined {
  const declared = (item.deadlineDates ?? []).map((d) => d.year)
  const years = declared.length
    ? declared
    : typeof item.deadlineYear === 'number'
      ? [item.deadlineYear]
      : []
  return years.filter((y) => y >= currentYear).sort((a, b) => a - b)[0]
}

/** A year-level record cannot establish a precise cutover date or a planning obligation. */
export function upcomingReferenceMilestones(
  mandatory: ApplicabilityResult<ComplianceFramework>[],
  recognized: ApplicabilityResult<ComplianceFramework>[],
  currentYear: number
): ReferenceMilestone[] {
  const upcoming = (items: ApplicabilityResult<ComplianceFramework>[]): ReferenceMilestone[] =>
    items
      .flatMap(({ item }) => {
        const year = nextMilestoneYear(item, currentYear)
        return year === undefined ? [] : [{ item, year }]
      })
      .sort((a, b) => a.year - b.year)
  const primary = upcoming(mandatory)
  return (primary.length ? primary : upcoming(recognized)).slice(0, 2)
}
