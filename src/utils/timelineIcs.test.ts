// SPDX-License-Identifier: GPL-3.0-only
/**
 * A calendar file is consumed by software that will not forgive an approximate
 * grammar, and by a human who will act on the dates. Both are pinned here:
 * RFC 5545 structure, and the honesty constraint that a year never becomes a
 * confident-looking day.
 */
import { describe, it, expect } from 'vitest'
import { phasesToIcs } from './timelineIcs'

/** RFC 5545 folds long lines, so any assertion about CONTENT has to unfold
 *  first — otherwise the test is really asserting where the fold landed. */
const unfold = (ics: string) => ics.replace(/\r\n /g, '')
import type { TimelinePhase } from '@/types/timeline'

const phase = (over: Partial<TimelinePhase> = {}): TimelinePhase =>
  ({
    startYear: 2027,
    endYear: 2030,
    phase: 'Migration',
    type: 'mandate',
    title: 'CNSA 2.0 exclusive use',
    description: 'New systems must use CNSA 2.0 algorithms exclusively.',
    events: [],
    ...over,
  }) as TimelinePhase

const OPTS = { countryName: 'United States', bodyName: 'NSA', now: new Date(Date.UTC(2026, 7, 10)) }

describe('phasesToIcs', () => {
  it('emits a well-formed calendar with CRLF line endings', () => {
    const ics = phasesToIcs([phase()], OPTS)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('VERSION:2.0')
    expect(ics.split('\r\n').filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1)
    expect(ics.split('\r\n').filter((l) => l === 'END:VEVENT')).toHaveLength(1)
  })

  it('uses all-day dates with an exclusive DTEND, never an invented time', () => {
    const ics = phasesToIcs([phase()], OPTS)
    expect(ics).toContain('DTSTART;VALUE=DATE:20270101')
    // DTEND is exclusive in RFC 5545, so a 2027–2030 span ends at 2031-01-01.
    expect(ics).toContain('DTEND;VALUE=DATE:20310101')
    expect(ics).not.toMatch(/DTSTART:\d{8}T\d{6}/)
  })

  it('tells the reader the source granularity is a year', () => {
    const ics = phasesToIcs([phase()], OPTS)
    expect(unfold(ics)).toMatch(/records YEARS/)
  })

  it('escapes RFC 5545 special characters in free text', () => {
    const ics = phasesToIcs(
      [phase({ title: 'Phase 1, 2; and 3', description: 'a\\b\nnew line' })],
      OPTS
    )
    expect(unfold(ics)).toContain('Phase 1\\, 2\\; and 3')
    expect(unfold(ics)).toContain('a\\\\b\\nnew line')
  })

  it('skips a phase with no usable start year rather than defaulting one', () => {
    const ics = phasesToIcs([phase({ startYear: 0 }), phase()], OPTS)
    expect(ics.split('\r\n').filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1)
  })

  it('collapses a single-year phase to one day-span, not a zero-length event', () => {
    const ics = phasesToIcs([phase({ startYear: 2027, endYear: 2027 })], OPTS)
    expect(ics).toContain('DTSTART;VALUE=DATE:20270101')
    expect(ics).toContain('DTEND;VALUE=DATE:20280101')
  })

  it('folds lines longer than 75 octets', () => {
    const long = 'x'.repeat(300)
    const ics = phasesToIcs([phase({ description: long })], OPTS)
    for (const line of ics.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75)
    }
  })

  it('carries the source URL so the entry can be checked', () => {
    const ics = phasesToIcs(
      [
        phase({
          events: [{ sourceUrl: 'https://example.gov/cnsa' }] as unknown as TimelinePhase['events'],
        }),
      ],
      OPTS
    )
    expect(unfold(ics)).toContain('https://example.gov/cnsa')
  })
})
