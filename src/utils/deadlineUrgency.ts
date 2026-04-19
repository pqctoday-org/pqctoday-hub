// SPDX-License-Identifier: GPL-3.0-only

const CURRENT_YEAR = new Date().getFullYear()

export type DeadlineUrgency = 'overdue' | 'imminent' | 'near' | 'future' | 'ongoing'

/**
 * Extract a numeric deadline year from a free-text string.
 *
 * Rules:
 *  - If the string starts with or is the word "ongoing" (case-insensitive) we treat
 *    it as having no deadline year, even if parenthetical notes mention historical
 *    years like "Ongoing (GL-2004-2022)". Those years describe provenance, not a
 *    future deadline, and letting them through misplaces dots far left of the
 *    timeline start.
 *  - Otherwise return the EARLIEST future-or-current year in the string so phased
 *    deadlines like "2025-2033 (phased)" or "2026 (wallets); 2030 (PQC)" map to
 *    the nearest commitment date.
 *  - Fall back to the earliest year present if none are in the future.
 */
export function extractYear(deadline: string): number | null {
  if (!deadline) return null
  const trimmed = deadline.trim().toLowerCase()
  if (trimmed.startsWith('ongoing') || trimmed.startsWith('annual')) return null

  const matches = deadline.match(/\b(20\d{2})\b/g)
  if (!matches || matches.length === 0) return null

  const years = matches.map((y) => parseInt(y, 10)).sort((a, b) => a - b)
  const now = CURRENT_YEAR
  const future = years.find((y) => y >= now)
  return future ?? years[0]
}

/** Classify urgency relative to the current year */
export function deadlineUrgency(deadline: string): DeadlineUrgency {
  const year = extractYear(deadline)
  if (!year) return 'ongoing'
  if (year < CURRENT_YEAR) return 'overdue'
  if (year <= CURRENT_YEAR + 2) return 'imminent'
  if (year <= CURRENT_YEAR + 4) return 'near'
  return 'future'
}

/** Semantic text color class for a given urgency level */
export function urgencyColor(urgency: DeadlineUrgency): string {
  switch (urgency) {
    case 'overdue':
      return 'text-status-error'
    case 'imminent':
      return 'text-status-warning'
    case 'near':
      return 'text-status-success'
    case 'future':
    case 'ongoing':
      return 'text-muted-foreground'
  }
}
