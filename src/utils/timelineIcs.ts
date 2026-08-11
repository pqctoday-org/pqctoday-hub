// SPDX-License-Identifier: GPL-3.0-only
/**
 * Timeline → calendar export — B+ remediation 4.3 (2026-08-10).
 *
 * "Ops can act on the dates instead of transcribing them." The Gantt chart is
 * the right shape for reading a landscape and the wrong shape for planning a
 * maintenance window: an operator's next move after seeing a deadline is to put
 * it in the calendar the rest of their team already lives in.
 *
 * Deliberately plain RFC 5545, generated in-browser with no dependency. Two
 * honesty constraints baked in:
 *
 *  - The corpus records YEARS, not dates. Emitting `20270101` as if it were the
 *    day a mandate lands would be inventing precision the source does not have,
 *    so every event is an ALL-DAY event covering the phase's own span, and its
 *    description says the year is the granularity we hold.
 *  - Every event carries its source URL where we have one, so the calendar
 *    entry can be checked against the document rather than trusted.
 */
import type { TimelinePhase } from '@/types/timeline'

/** Escape per RFC 5545 §3.3.11 — backslash, semicolon, comma, newline. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Fold long lines at 75 octets per RFC 5545 §3.1. Plenty of calendar clients
 *  tolerate unfolded lines; Outlook is notably not one of them. */
function fold(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = [line.slice(0, 75)]
  let rest = line.slice(75)
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  if (rest) parts.push(` ${rest}`)
  return parts.join('\r\n')
}

function yearDate(year: number, month = 1, day = 1): string {
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
}

export interface IcsOptions {
  countryName: string
  bodyName: string
  /** Stamp for DTSTAMP/UID. Injected so the output is deterministic in tests. */
  now?: Date
}

/**
 * An RFC 5545 calendar for one country/body's phases.
 *
 * Returns the .ics text. Phases with no usable start year are skipped rather
 * than defaulted — an event on the wrong year is worse than a missing one.
 */
export function phasesToIcs(phases: TimelinePhase[], options: IcsOptions): string {
  const stamp = (options.now ?? new Date(Date.UTC(2026, 0, 1)))
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PQC Today//Timeline Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    fold(`X-WR-CALNAME:${escapeText(`PQC — ${options.countryName} (${options.bodyName})`)}`),
  ]

  let seq = 0
  for (const phase of phases) {
    if (!Number.isFinite(phase.startYear) || phase.startYear <= 0) continue
    seq += 1
    const endYear =
      Number.isFinite(phase.endYear) && phase.endYear >= phase.startYear
        ? phase.endYear
        : phase.startYear
    const uid = `pqctoday-${options.countryName}-${options.bodyName}-${phase.startYear}-${seq}`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')

    const description = [
      phase.description,
      '',
      `Phase: ${phase.phase}`,
      `Source granularity: this corpus records YEARS, not exact dates — treat ${phase.startYear}${
        endYear !== phase.startYear ? `–${endYear}` : ''
      } as the window, not the day.`,
      ...phase.events
        .filter((e) => e.sourceUrl)
        .map((e) => `Source: ${e.sourceUrl}`)
        .slice(0, 5),
    ]
      .filter(Boolean)
      .join('\n')

    lines.push(
      'BEGIN:VEVENT',
      fold(`UID:${uid}@pqctoday.com`),
      `DTSTAMP:${stamp}`,
      // All-day span: DTEND is exclusive in RFC 5545, hence endYear + 1.
      `DTSTART;VALUE=DATE:${yearDate(phase.startYear)}`,
      `DTEND;VALUE=DATE:${yearDate(endYear + 1)}`,
      fold(`SUMMARY:${escapeText(`${options.countryName}: ${phase.title}`)}`),
      fold(`DESCRIPTION:${escapeText(description)}`),
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}

/** Trigger a download of the generated calendar. Split from `phasesToIcs` so
 *  the generation is testable without touching the DOM. */
export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
