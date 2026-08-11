// SPDX-License-Identifier: GPL-3.0-only
/**
 * Progress model — the scoped deadline slice. "What is due next, and has
 * anything already passed?"
 *
 * Replaces three renderings of the same dates: the `DeadlineTimeline` dot plot,
 * the timeline inside `ExecutiveTimelineView`, and the For You slice.
 *
 * Two rules:
 *
 *  1. **Dates come from `deadlineDates` only.** That column is structured
 *     (`{year, label}`) and populated on every `fixed` and `phased` row. The
 *     free-text `deadline` is rendered beside it for humans but never parsed —
 *     parsing prose is how a mock ends up asserting "GDPR Art. 32, 2018" for a
 *     row whose data carries no date at all.
 *
 *  2. **Nothing is called "overdue".** A past date is a fact; whether the
 *     reader is late is a claim about them this page cannot support — it knows
 *     nothing about what they have done. Past dates are grouped as passed, and
 *     each entry keeps its own label ("effective", "transposition passed",
 *     "pqc high-risk") so the reader can tell an in-force date from a deadline.
 *     Lumping a 2018 in-force date in with a missed deadline is the specific
 *     error this grouping exists to avoid.
 */
import type { ComplianceFramework } from '@/data/complianceData'
import type { ObligationRow } from '../obligations/obligationsModel'

export type ProgressBucket = 'passed' | 'thisYear' | 'ahead' | 'ongoing'

export interface ProgressEntry {
  framework: ComplianceFramework
  /** Undefined only for the `ongoing` bucket. */
  year?: number
  /** The milestone's own label, verbatim from `deadline_dates`. */
  label?: string
  bucket: ProgressBucket
}

export interface ProgressGroup {
  bucket: ProgressBucket
  title: string
  note: string
  entries: ProgressEntry[]
}

const GROUP_COPY: Record<ProgressBucket, { title: string; note: string }> = {
  passed: {
    title: 'Dates already passed',
    note: 'Some of these are in-force dates, others were deadlines — each entry keeps the wording its source used. Whether you are late is not something this page can know.',
  },
  thisYear: {
    title: 'This year',
    note: 'Stated for the current calendar year.',
  },
  ahead: {
    title: 'Ahead',
    note: 'Earliest first.',
  },
  ongoing: {
    title: 'Ongoing — no dated milestone',
    note: 'These bind continuously and state no date. They are listed so the absence is visible rather than looking like an omission.',
  },
}

const BUCKET_ORDER: ProgressBucket[] = ['passed', 'thisYear', 'ahead', 'ongoing']

/**
 * Flattens the register into dated entries, one per stated milestone.
 *
 * `currentYear` is injected rather than read from the clock so the grouping is
 * testable and so a build cannot produce a different page than its tests.
 */
export function buildProgress(rows: ObligationRow[], currentYear: number): ProgressEntry[] {
  const out: ProgressEntry[] = []
  for (const row of rows) {
    if (row.milestones.length === 0) {
      out.push({ framework: row.framework, bucket: 'ongoing' })
      continue
    }
    for (const milestone of row.milestones) {
      out.push({
        framework: row.framework,
        year: milestone.year,
        label: milestone.label,
        bucket:
          milestone.year < currentYear
            ? 'passed'
            : milestone.year === currentYear
              ? 'thisYear'
              : 'ahead',
      })
    }
  }
  return out
}

/**
 * Groups entries for display. Passed dates run most-recent-first (what just
 * happened matters more than what happened in 2018); everything else runs
 * earliest-first (what bites next).
 */
export function groupProgress(entries: ProgressEntry[]): ProgressGroup[] {
  return BUCKET_ORDER.map((bucket) => {
    const list = entries.filter((e) => e.bucket === bucket)
    list.sort((a, b) => {
      if (a.year !== undefined && b.year !== undefined && a.year !== b.year) {
        return bucket === 'passed' ? b.year - a.year : a.year - b.year
      }
      return a.framework.label.localeCompare(b.framework.label)
    })
    return { bucket, ...GROUP_COPY[bucket], entries: list }
  }).filter((g) => g.entries.length > 0)
}

/** The next dated milestone, or null when the scope has none. */
export function nextMilestone(entries: ProgressEntry[], currentYear: number): ProgressEntry | null {
  const upcoming = entries
    .filter((e) => e.year !== undefined && e.year >= currentYear)
    .sort((a, b) => (a.year as number) - (b.year as number))
  return upcoming[0] ?? null
}
