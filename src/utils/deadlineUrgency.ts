// SPDX-License-Identifier: GPL-3.0-only

const CURRENT_YEAR = new Date().getFullYear()

export type DeadlineUrgency = 'overdue' | 'imminent' | 'near' | 'future' | 'ongoing'

/** Extract a numeric year from a deadline string, e.g. "2025 (software)" → 2025 */
export function extractYear(deadline: string): number | null {
  const match = deadline.match(/\b(20\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
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
