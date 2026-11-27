// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Missing data in a numeric field (UX grammar v2.1, D15 and owner decision O1).
 *
 * The four live labels stay as they are, each with the "Needs data" cue; "Not recorded" is
 * for a plain blank only. A missing value is never shown as NaN, never as 0, and never as a
 * dash with no word. Rows that carry one sort last (compareNumbersMissingLast) and are never
 * computed with.
 */
import { groupInteger, groupOneDecimal, MINUS } from './number'

/** The four live missing-data labels, in the words the data uses today. */
export const MISSING_LABELS = [
  'Research needed',
  'Not specified by the source',
  'Not measured',
  'Not applicable',
] as const
export type MissingLabel = (typeof MISSING_LABELS)[number]

/** Shown for a plain blank (null, undefined, empty or whitespace). */
export const NOT_RECORDED = 'Not recorded'

/** The cue that goes next to a missing-data label. */
export const NEEDS_DATA_CUE = 'Needs data'

/** Longest-first so "not specified by the source" wins over "not specified". */
const ALIASES: Array<[RegExp, MissingLabel]> = [
  [/^research needed$/i, 'Research needed'],
  [/^not specified( by the source)?$/i, 'Not specified by the source'],
  [/^not measured$/i, 'Not measured'],
  [/^(not applicable|n\/?a)$/i, 'Not applicable'],
  [/^(tbd|to be determined|unknown|not determined|not available|pending)$/i, 'Research needed'],
  [/^(not tested|not benchmarked|n\/?m)$/i, 'Not measured'],
]

export interface NumberDisplay {
  kind: 'number' | 'missing' | 'blank'
  /** What to render. */
  text: string
  /** True for the four live labels: show the Needs-data cue next to the text. */
  needsData: boolean
  /** The numeric value, or null when there is none. */
  value: number | null
}

function parseNumberText(s: string): number | null {
  const cleaned = s.replace(/,/g, '').replace(/−/g, '-').trim()
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Classify any value that should be a number. */
export function describeNumber(v: unknown, blankText: string = NOT_RECORDED): NumberDisplay {
  if (typeof v === 'number') {
    if (Number.isFinite(v)) {
      return { kind: 'number', text: groupDisplay(v), needsData: false, value: v }
    }
    // NaN or Infinity is a failed computation, not a blank cell.
    return { kind: 'missing', text: 'Not measured', needsData: true, value: null }
  }
  if (v === null || v === undefined) {
    return { kind: 'blank', text: blankText, needsData: false, value: null }
  }
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return { kind: 'blank', text: blankText, needsData: false, value: null }
    const parsed = parseNumberText(s)
    if (parsed !== null) {
      return { kind: 'number', text: groupDisplay(parsed), needsData: false, value: parsed }
    }
    for (const [re, label] of ALIASES) {
      if (re.test(s)) return { kind: 'missing', text: label, needsData: true, value: null }
    }
    // Any other text in a numeric field maps to the nearest live label.
    return { kind: 'missing', text: 'Research needed', needsData: true, value: null }
  }
  return { kind: 'blank', text: blankText, needsData: false, value: null }
}

function groupDisplay(n: number): string {
  const text = Number.isInteger(n) ? groupInteger(n) : groupOneDecimal(n)
  return n < 0 && !text.startsWith(MINUS) ? `${MINUS}${text}` : text
}

export interface MissingOptions {
  /** Text for a plain blank. Defaults to "Not recorded". */
  blank?: string
}

/**
 * A number, one of the four live missing-data labels, or "Not recorded" for a plain blank.
 * Use describeNumber when you also need the Needs-data cue.
 */
export function formatNumberOrMissing(v: unknown, options: MissingOptions = {}): string {
  return describeNumber(v, options.blank).text
}

/** Sort comparator: numbers ascending, rows with a missing label or blank after them. */
export function compareNumbersMissingLast(a: unknown, b: unknown): number {
  const x = describeNumber(a).value
  const y = describeNumber(b).value
  if (x === null && y === null) return 0
  if (x === null) return 1
  if (y === null) return -1
  return x - y
}
