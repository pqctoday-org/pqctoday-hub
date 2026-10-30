// SPDX-License-Identifier: AGPL-3.0-only
import type { ComplianceFramework } from '../../../../data/complianceData'
import type { ApplicabilityResult } from '../../../../utils/applicabilityEngine'

/** A year-level record cannot establish a precise cutover date or a planning obligation. */
export function upcomingReferenceMilestones(
  mandatory: ApplicabilityResult<ComplianceFramework>[],
  recognized: ApplicabilityResult<ComplianceFramework>[],
  currentYear: number
) {
  const upcoming = (items: ApplicabilityResult<ComplianceFramework>[]) =>
    items
      .map(({ item }) => item)
      .filter((item) => typeof item.deadlineYear === 'number' && item.deadlineYear >= currentYear)
      .sort((a, b) => a.deadlineYear! - b.deadlineYear!)
  const primary = upcoming(mandatory)
  return (primary.length ? primary : upcoming(recognized)).slice(0, 2)
}
