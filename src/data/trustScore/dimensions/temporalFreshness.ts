// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult } from '../types'

/** Compute days since a date string (ISO or various formats). */
function daysSince(dateStr: string): number {
  const parsed = Date.parse(dateStr)
  if (isNaN(parsed)) return Infinity
  return Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24))
}

export function scoreTemporalFreshness(dates: {
  lastVerifiedDate?: string
  lastUpdateDate?: string
  releaseDate?: string
}): DimensionResult {
  const candidates = [dates.lastVerifiedDate, dates.lastUpdateDate, dates.releaseDate].filter(
    (d): d is string => !!d && d.trim().length > 0
  )

  if (candidates.length === 0) {
    return { rawScore: 0, rationale: 'No date information available', notApplicable: true }
  }

  // Use the most recent date that is not in the future: an expected release
  // date ("2027-01-01") says nothing about how fresh the record is, and taking
  // it would score the row as updated today. A future date is skipped, not
  // treated as unparseable. One day of slack keeps "today" valid in time
  // zones ahead of UTC, where a bare ISO date parses as a few hours ahead.
  const ages = candidates
    .map(daysSince)
    .filter((d) => d === Infinity || d >= -1)
    .map((d) => Math.max(d, 0))
  if (ages.length === 0) {
    return { rawScore: 0, rationale: 'Only future dates available', notApplicable: true }
  }
  const staleDays = Math.min(...ages)

  if (staleDays === Infinity) {
    return { rawScore: 10, rationale: 'Date could not be parsed' }
  }

  let score: number
  let label: string
  if (staleDays <= 30) {
    score = 100
    label = 'Updated within 30 days'
  } else if (staleDays <= 90) {
    score = 80
    label = `Updated ${staleDays} days ago`
  } else if (staleDays <= 180) {
    score = 55
    label = `Updated ${staleDays} days ago`
  } else if (staleDays <= 365) {
    score = 30
    label = `Updated ${staleDays} days ago`
  } else {
    score = 10
    label = `Updated ${staleDays} days ago (>1 year)`
  }

  return { rawScore: score, rationale: label }
}
