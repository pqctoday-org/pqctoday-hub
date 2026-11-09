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

/**
 * Largest reported percent the field accepts. Spending can run well past the
 * approved budget, so the ceiling is generous, but it stops a mistyped
 * exponent from being stored and printed as "1e+300%".
 */
export const REPORTED_PERCENT_MAX = 1000

export const REPORTED_PERCENT_MESSAGE = `Enter a number from 0 to ${REPORTED_PERCENT_MAX}. The previous value was kept.`

export type ReportedPercentResult = { ok: true; value: number } | { ok: false; message: string }

/**
 * Read what was typed into the reported-percent field. Negative, infinite,
 * not-a-number and absurdly large entries are rejected, never clamped: clamping
 * a bad entry would store it as a real 0%.
 */
export function parseReportedPercent(raw: string): ReportedPercentResult {
  const trimmed = raw.trim()
  const value = trimmed === '' ? Number.NaN : Number(trimmed)
  if (!Number.isFinite(value) || value < 0 || value > REPORTED_PERCENT_MAX) {
    return { ok: false, message: REPORTED_PERCENT_MESSAGE }
  }
  // Number('-0') is -0; keep a plain 0.
  return { ok: true, value: value === 0 ? 0 : value }
}

/**
 * Score cell of a Markdown row for a reporting-only measure. A restored value
 * that has not been assessed for current use says so, as the screen does.
 */
export function reportingOnlyScoreCell(raw: number | undefined, notAssessed: boolean): string {
  const value = raw === undefined ? 'Unknown' : `${raw}%`
  const lead = raw !== undefined && notAssessed ? ' — not assessed for current use;' : ' —'
  return `${value}${lead} reporting only; excluded from readiness`
}

/** Current-use status of a CSV row for a reporting-only measure. */
export function reportingOnlyStatus(raw: number | undefined, notAssessed: boolean): string {
  return raw !== undefined && notAssessed
    ? 'Reporting only — excluded from readiness; not assessed for current use'
    : 'Reporting only — excluded from readiness'
}
