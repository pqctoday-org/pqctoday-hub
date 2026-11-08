// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The published milestone a visitor picked in the Assess timeline step.
 *
 * `timelinePressure` keeps its five summary values for scoring; this pair keeps
 * which milestone and whose it was, so a saved assessment, a shared link and an
 * export can say more than "own target or distant deadline". Everything that
 * reads the pair goes through `sanitizeTimelineMilestone`, so a saved state, a
 * snapshot or a shared link of any shape is dropped rather than trusted.
 */
import type { TimelineMilestone } from '@/hooks/assessmentTypes'

const MAX_ID_LENGTH = 200
const MAX_AUTHORITY_LENGTH = 100
const MIN_YEAR = 1990
const MAX_YEAR = 2100
// eslint-disable-next-line no-control-regex -- the point of the pattern is to refuse control characters
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/

/** The pressure values that come from picking a published deadline card. */
const PRESSURES_WITH_MILESTONE = new Set(['within-1y', 'within-2-3y', 'internal-deadline'])

function shortText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || text.length > max || CONTROL_CHARACTERS.test(text)) return null
  return text
}

/**
 * Returns a clean pair, or null when the value is not one: not an object, an id
 * or authority that is missing, too long or holds control characters. An
 * unusable year is dropped and the rest kept.
 */
export function sanitizeTimelineMilestone(value: unknown): TimelineMilestone | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { id, authority, year } = value as Record<string, unknown>
  const cleanId = shortText(id, MAX_ID_LENGTH)
  const cleanAuthority = shortText(authority, MAX_AUTHORITY_LENGTH)
  if (!cleanId || !cleanAuthority) return null
  const milestone: TimelineMilestone = { id: cleanId, authority: cleanAuthority }
  if (typeof year === 'number' && Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR) {
    milestone.year = year
  }
  return milestone
}

/**
 * The pair that belongs with this pressure value: only the three values that
 * come from a published deadline card keep one ("own target", "no deadline" and
 * "unknown" never do).
 */
export function milestoneForPressure(
  pressure: string | undefined | null,
  milestone: unknown
): TimelineMilestone | null {
  if (!pressure || !PRESSURES_WITH_MILESTONE.has(pressure)) return null
  return sanitizeTimelineMilestone(milestone)
}

/** "<milestone> (<authority>), <year>", the year only when there is one. */
export function describeTimelineMilestone(milestone: TimelineMilestone): string {
  const base = `${milestone.id} (${milestone.authority})`
  return milestone.year ? `${base}, ${milestone.year}` : base
}

/**
 * The timeline answer as the report words it. With a pair, a distant external
 * deadline reads "Distant external deadline: <milestone> (<authority>), <year>"
 * and the nearer two read "<their label>: <milestone> (<authority>), <year>";
 * without one, the generic label is returned unchanged.
 */
export function timelineAnswerLabel(
  pressure: string | undefined | null,
  milestone: unknown,
  genericLabel: string | undefined
): string | undefined {
  const pair = milestoneForPressure(pressure, milestone)
  if (!pair) return genericLabel
  const lead = pressure === 'internal-deadline' ? 'Distant external deadline' : genericLabel
  const detail = describeTimelineMilestone(pair)
  return lead ? `${lead}: ${detail}` : detail
}
