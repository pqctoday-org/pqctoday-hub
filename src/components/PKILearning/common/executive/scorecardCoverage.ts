// SPDX-License-Identifier: AGPL-3.0-only

/**
 * A combined KPI score is withheld until this share of the weight that can be
 * scored has a value. The scorecard screen and every Markdown/CSV export read
 * this one number so they cannot disagree.
 */
export const OVERALL_SCORE_MIN_COVERAGE = 0.7

/**
 * Share of the scorable weight that has a value (0..1).
 *
 * Locked KPIs (`disabled`: the data they read is not there yet) cannot be
 * scored, so they are left out of the denominator as well as the numerator.
 * Counting them made some roles unable to reach the threshold: on a fresh
 * worksheet a GRC reader's unlocked KPIs make up only 61% of the intended weight.
 */
export function scoredWeightShare<D extends { disabled?: boolean }>(
  dimensions: readonly D[],
  weightOf: (dimension: D) => number,
  isScored: (dimension: D) => boolean
): number {
  let scorable = 0
  let scored = 0
  for (const dimension of dimensions) {
    if (dimension.disabled) continue
    const weight = weightOf(dimension)
    scorable += weight
    if (isScored(dimension)) scored += weight
  }
  return scorable > 0 ? Math.min(1, scored / scorable) : 0
}
