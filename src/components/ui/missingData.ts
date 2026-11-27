// SPDX-License-Identifier: AGPL-3.0-only
import { evidenceStateLabel, type EvidenceFieldState } from '@/data/pqcAlgorithmsData'

/**
 * Missing data in a number field (grammar rule D15, owner decision 26 Nov 2026).
 *
 * A field that holds no usable number shows one of four words the site already uses: "Research
 * needed", "Not specified by the source", "Not measured" or "Not applicable". The words stay as they
 * are; what this adds is that every one of them carries the same "Needs data" cue, and that a row
 * holding one of them is never computed with (no sum, ratio, best-in-row, zero or NaN) and sorts after
 * every row that has a value, whichever way the column is sorted. A plain blank is "Not recorded",
 * which is not one of the four.
 *
 * This file is the one place the Algorithms screens read that rule from, so the shared formatter that
 * is planned for the whole site can replace it in one step.
 */

const MISSING_STATES: readonly EvidenceFieldState[] = [
  'not-researched',
  'not-specified',
  'not-measured',
  'not-applicable',
]

/** The four words, from the same function every table, drawer and export reads. */
export const MISSING_DATA_LABELS: readonly string[] = MISSING_STATES.map(evidenceStateLabel)

/** True when the text is one of the four missing-data words (and so shows the cue). */
export function isMissingDataLabel(text: string | null | undefined): boolean {
  return text !== null && text !== undefined && MISSING_DATA_LABELS.includes(text.trim())
}

/**
 * Orders two values of a sortable column so a missing value (`null`, or a value the caller marks
 * missing) comes after every value that is there, in both directions. `compare` orders two present
 * values in ascending order; `dir` is 1 for ascending and -1 for descending.
 */
export function compareMissingLast<T>(
  a: T | null,
  b: T | null,
  dir: 1 | -1,
  compare: (x: T, y: T) => number
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return dir * compare(a, b)
}
