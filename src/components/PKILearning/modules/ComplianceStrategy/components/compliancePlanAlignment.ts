// SPDX-License-Identifier: AGPL-3.0-only
import type { UserMilestone } from './ComplianceGantt'

export interface PlanAlignment {
  status: 'completed' | 'on-track' | 'at-risk' | 'unknown'
  alignmentLabel: string
  gap: string
}

export const isSampleYear = (year: unknown): year is number =>
  typeof year === 'number' && Number.isInteger(year) && year >= 1 && year <= 9999

/** Saved input is opaque JSON; neither substring matches nor coercion establishes a link. */
export const isObligationKeyArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((key) => typeof key === 'string')

export const validObligationKeys = (value: unknown): string[] =>
  isObligationKeyArray(value) ? value : []

export const recordedCompletionLabel = (value: unknown): string =>
  value === true
    ? 'Yes'
    : value === false
      ? 'No'
      : value === undefined
        ? 'Not marked complete'
        : `Unknown (raw: ${JSON.stringify(value)})`

/** Explicit sample links only; no applicability, technical or legal assessment. */
export function assessPlanAlignment(
  key: string,
  referenceYear: number,
  milestones: UserMilestone[],
  scenarioAsOfYear: number | null
): PlanAlignment {
  const relevant = milestones.filter((m) => validObligationKeys(m.obligationKeys).includes(key))
  const unknown = (gap: string): PlanAlignment => ({
    status: 'unknown',
    alignmentLabel: 'Unknown',
    gap,
  })
  if (!relevant.length)
    return unknown(
      'Sample alignment unknown: no milestone-to-obligation scope or supporting checks are recorded here. Link activities explicitly; unrelated activities receive no credit.'
    )
  if (relevant.some((m) => m.completed !== undefined && typeof m.completed !== 'boolean'))
    return unknown(
      'Sample completion unknown: a linked activity has no Boolean completion record. Raw saved input is preserved, not treated as Done or planned work.'
    )
  if (!isSampleYear(referenceYear) || !isSampleYear(scenarioAsOfYear))
    return unknown(
      'Sample alignment unknown: a valid reference year and scenario as-of year are required.'
    )
  if (relevant.some((m) => m.completed && !isSampleYear(m.completedYear)))
    return unknown(
      'Sample timing unknown: a marked-complete activity has no valid recorded completion year. Its planned year is not a completion date.'
    )
  if (relevant.some((m) => m.completed && m.completedYear! > scenarioAsOfYear))
    return unknown(
      'Sample timing unknown: a recorded completion year is after the scenario as-of year. Review the inconsistent future completion.'
    )
  if (relevant.some((m) => !m.completed && !isSampleYear(m.year)))
    return unknown('Sample timing unknown: an unfinished activity has no valid planned year.')
  const late = relevant.some((m) =>
    m.completed ? m.completedYear! > referenceYear : m.year > referenceYear
  )
  if (late)
    return {
      status: 'at-risk',
      alignmentLabel: 'Late plan/record',
      gap: 'At least one linked activity is planned or recorded after the reference year. This compares years only, not an exact legal deadline or obligation satisfaction.',
    }
  if (relevant.every((m) => m.completed))
    return {
      status: 'completed',
      alignmentLabel: 'Recorded by reference year',
      gap: 'All explicitly linked sample activities are recorded complete by the reference year and scenario as-of year. This does not establish applicability, technical results or compliance with an exact dated deadline.',
    }
  return {
    status: 'on-track',
    alignmentLabel: 'Planned by reference year',
    gap: 'Unfinished linked activities are planned by the reference year; planned work is not delivered work. No technical on-track or compliance conclusion is established.',
  }
}
