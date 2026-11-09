// SPDX-License-Identifier: AGPL-3.0-only
import type { KpiValueOrigin } from './scorecardValueOrigin'

/**
 * Worksheets saved before budget utilization became a reporting-only measure wrote
 * a default 0 for it, with the origin "not-entered", because nobody had typed a
 * value. Restoring that 0 would show an entered 0% on screen and in both exports.
 * Drop it so a missing value stays distinct from zero. A deliberate 0 carries a
 * learner origin and is kept; so is a value whose origin was never recorded, which
 * the screen and the exports label as not assessed for current use.
 */
export function withoutNeverEnteredReportingScores(
  dimensions: ReadonlyArray<{ id: string; reportingOnly?: boolean }>,
  scores: Record<string, number> | undefined,
  origins: Record<string, KpiValueOrigin> | undefined
): Record<string, number> | undefined {
  if (!scores) return scores
  const neverEntered = new Set(
    dimensions
      .filter((dimension) => dimension.reportingOnly && origins?.[dimension.id] === 'not-entered')
      .map((dimension) => dimension.id)
  )
  return Object.fromEntries(Object.entries(scores).filter(([id]) => !neverEntered.has(id)))
}
