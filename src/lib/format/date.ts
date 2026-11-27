// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Dates and times for readers (UX grammar v2.1, section 2.4).
 *
 *   formatDate(d, 'day')     26 Nov 2026
 *   formatDate(d, 'month')   Nov 2026
 *   formatDate(d, 'year')    2030
 *   formatDate(d, 'quarter') Q3 2027
 *   within 7 days            "3 days ago" (the full date goes in the title, see formatDateTitle)
 *
 * ISO dates stay in files, CSV and URLs; they never reach a reader. Fixed English month
 * names, so the text does not change with the visitor's locale.
 */

export type DateGranularity = 'day' | 'month' | 'year' | 'quarter'

/** What formatDate accepts: a Date, a millisecond timestamp, or a date / date-time string. */
export type DateInput = Date | number | string

export interface FormatDateOptions {
  /** Reference time for "3 days ago". Defaults to now; tests pass a fixed value. */
  now?: Date | number
  /**
   * Allow "3 days ago" inside the last 7 days (day granularity only). Default true.
   * Pass false for a stamp that is written into a file or a generated document, where a
   * relative phrase would go stale.
   */
  relative?: boolean
  /** Read the calendar day in UTC instead of the visitor's time zone. */
  utc?: boolean
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const YEAR_MONTH = /^(\d{4})-(\d{2})$/
const YEAR_ONLY = /^(\d{4})$/
const DAY_MS = 86_400_000

interface Parts {
  year: number
  month: number // 0-11
  day: number
}

function toDate(input: DateInput): Date | null {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  if (typeof input === 'number') {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const s = input.trim()
  if (!s) return null
  const dateOnly = DATE_ONLY.exec(s)
  if (dateOnly) {
    // A bare calendar date has no time zone: read it as that calendar day everywhere.
    const d = new Date(Date.UTC(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const ym = YEAR_MONTH.exec(s)
  if (ym) return new Date(Date.UTC(+ym[1], +ym[2] - 1, 1))
  const y = YEAR_ONLY.exec(s)
  if (y) return new Date(Date.UTC(+y[1], 0, 1))
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** True when the input is a bare calendar date (no time, so no zone to convert). */
function isCalendarOnly(input: DateInput): boolean {
  if (typeof input !== 'string') return false
  const s = input.trim()
  return DATE_ONLY.test(s) || YEAR_MONTH.test(s) || YEAR_ONLY.test(s)
}

function partsOf(input: DateInput, d: Date, utc: boolean): Parts {
  if (utc || isCalendarOnly(input)) {
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() }
  }
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

function dayNumber(p: Parts): number {
  return Math.floor(Date.UTC(p.year, p.month, p.day) / DAY_MS)
}

/** The text a reader sees when the date is missing or unreadable. */
export const NO_DATE = 'Not recorded'

/** "26 Nov 2026" (always the absolute day), used for titles and exports. */
function absoluteDay(p: Parts): string {
  return `${p.day} ${MONTHS[p.month]} ${p.year}`
}

export function formatDate(
  input: DateInput | null | undefined,
  granularity: DateGranularity = 'day',
  options: FormatDateOptions = {}
): string {
  if (input === null || input === undefined) return NO_DATE
  const d = toDate(input)
  if (!d) return NO_DATE
  const utc = options.utc === true
  const p = partsOf(input, d, utc)
  switch (granularity) {
    case 'year':
      return String(p.year)
    case 'quarter':
      return `Q${Math.floor(p.month / 3) + 1} ${p.year}`
    case 'month':
      return `${MONTHS[p.month]} ${p.year}`
    case 'day': {
      if (options.relative !== false) {
        const nowD = options.now === undefined ? new Date() : new Date(options.now)
        const today = partsOf(nowD, nowD, utc)
        const diff = dayNumber(today) - dayNumber(p)
        if (diff >= 0 && diff <= 7) {
          if (diff === 0) return 'today'
          if (diff === 1) return 'yesterday'
          return `${diff} days ago`
        }
      }
      return absoluteDay(p)
    }
  }
}

/**
 * The full date for a tooltip: "26 Nov 2026" for a calendar day, "26 Nov 2026, 13:18 UTC+1"
 * for a timestamp. Pair it with formatDate when that returns "3 days ago".
 */
export function formatDateTitle(input: DateInput | null | undefined): string {
  if (input === null || input === undefined) return NO_DATE
  const d = toDate(input)
  if (!d) return NO_DATE
  const p = partsOf(input, d, false)
  if (isCalendarOnly(input)) return absoluteDay(p)
  return `${absoluteDay(p)}, ${pad(d.getHours())}:${pad(d.getMinutes())} ${zoneLabel(d)}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** "UTC+1", "UTC-5", "UTC+5:30", "UTC" from the Date's own offset (no ICU needed). */
function zoneLabel(d: Date): string {
  const offset = -d.getTimezoneOffset()
  if (offset === 0) return 'UTC'
  const sign = offset > 0 ? '+' : '-'
  const abs = Math.abs(offset)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return m ? `UTC${sign}${h}:${pad(m)}` : `UTC${sign}${h}`
}

/**
 * Time of day for a session log or a stamp: "13:18:02" (24 h, local). The full date and
 * zone for the tooltip come from formatSessionTimeTitle.
 */
export function formatSessionTime(t: Date | number | string | null | undefined): string {
  if (t === null || t === undefined) return NO_DATE
  const d = toDate(t)
  if (!d) return NO_DATE
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Tooltip for formatSessionTime: "26 Nov 2026, 13:18:02 UTC+1". */
export function formatSessionTimeTitle(t: Date | number | string | null | undefined): string {
  if (t === null || t === undefined) return NO_DATE
  const d = toDate(t)
  if (!d) return NO_DATE
  const p = partsOf(d, d, false)
  return `${absoluteDay(p)}, ${formatSessionTime(d)} ${zoneLabel(d)}`
}

/**
 * A fixed stamp for a generated document, a data-source line or an export header:
 * "26 Nov 2026". Never relative, because the text is saved and read later.
 */
export function formatDateStamp(input: DateInput | null | undefined): string {
  return formatDate(input, 'day', { relative: false })
}

/**
 * The data source line: "timeline_11222026.csv · updated 22 Nov 2026". With no date it
 * reads "... · update date not recorded", never a blank or an "Invalid Date".
 */
export function formatDataSourceLine(name: string, updated: DateInput | null | undefined): string {
  const hasDate = updated !== null && updated !== undefined && formatDateStamp(updated) !== NO_DATE
  return hasDate
    ? `${name} · updated ${formatDateStamp(updated)}`
    : `${name} · update date not recorded`
}

/**
 * A day and a time for a saved-at or last-edited stamp: "26 Nov 2026, 13:18" (24 h, local).
 * Never relative: the stamp names a moment.
 */
export function formatDateTime(input: DateInput | null | undefined): string {
  if (input === null || input === undefined) return NO_DATE
  const d = toDate(input)
  if (!d) return NO_DATE
  const p = partsOf(d, d, false)
  return `${absoluteDay(p)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
