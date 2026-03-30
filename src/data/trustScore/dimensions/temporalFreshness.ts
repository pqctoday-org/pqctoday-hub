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

  // Use the most recent date
  const staleDays = Math.min(...candidates.map(daysSince))

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
