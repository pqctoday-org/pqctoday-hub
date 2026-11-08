// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { phasesToIcs } from './timelineIcs'
import type { TimelinePhase } from '@/types/timeline'

// Independent fixture reader: content-line unfolding, TEXT decoding and DATE
// durations. This tests the exported contract, not general RFC conformance.
function readEvents(calendar: string) {
  const records: Map<string, string>[] = []
  let event: Map<string, string> | null = null
  for (const line of calendar.replace(/\r\n[ \t]/g, '').split('\r\n')) {
    if (line === 'BEGIN:VEVENT') {
      event = new Map()
      records.push(event)
    } else if (line === 'END:VEVENT') event = null
    else if (event) {
      const colon = line.indexOf(':')
      if (colon >= 0) event.set(line.slice(0, colon), line.slice(colon + 1))
    }
  }
  return records.map((record) => {
    const date = (value: string) =>
      Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)))
    const start = record.get('DTSTART;VALUE=DATE')!
    const end = record.get('DTEND;VALUE=DATE')
    const text = (key: string) =>
      record
        .get(key)
        ?.replace(/\\([nN,;\\])/g, (_, char: string) => (char.toLowerCase() === 'n' ? '\n' : char))
    return {
      record,
      start,
      end,
      durationDays: end ? (date(end) - date(start)) / 86400000 : 1,
      summary: text('SUMMARY'),
      description: text('DESCRIPTION'),
    }
  })
}
const phase = (overrides: Partial<TimelinePhase> = {}): TimelinePhase => ({
  startYear: 2027,
  endYear: 2030,
  phase: 'Migration',
  type: 'Phase',
  title: 'Fictional sample phase',
  description: 'Sample description',
  events: [],
  ...overrides,
})
const options = {
  countryName: 'Sample country',
  bodyName: 'Sample body',
  now: new Date('2026-01-01T00:00:00Z'),
}

describe('calendar planning reminders preserve source uncertainty', () => {
  it('exports open-ended phases as a labelled one-day placeholder with no invented end or duration', () => {
    const input = phase({ openEnded: true, endYear: 2027 })
    const before = JSON.stringify(input)
    const [event] = readEvents(phasesToIcs([input], options))
    expect(event.start).toBe('20270101')
    expect(event.end).toBeUndefined()
    expect(event.record.has('DURATION')).toBe(false)
    expect(event.durationDays).toBe(1)
    expect(event.summary).toBe('Planning reminder — Sample country: Fictional sample phase')
    expect(event.description).toContain('one-day calendar entry')
    expect(event.description).toContain('1 January 2027 as a chosen placeholder')
    expect(event.description).toContain('not a source date, deadline, end date or phase duration')
    expect(JSON.stringify(input)).toBe(before)
  })
  it('keeps bounded year-span behavior and identical UID, without relabelling it a one-day reminder', () => {
    const bounded = readEvents(phasesToIcs([phase()], options))[0]
    const open = readEvents(phasesToIcs([phase({ openEnded: true })], options))[0]
    expect(bounded.start).toBe('20270101')
    expect(bounded.end).toBe('20310101')
    expect(bounded.durationDays).toBe(1461)
    expect(bounded.summary).toBe('Sample country: Fictional sample phase')
    expect(bounded.description).toContain('treat 2027–2030 as the window, not the day')
    expect(open.record.get('UID')).toBe(bounded.record.get('UID'))
  })
  it('does not infer that every source in a mixed aggregate is open-ended; retains source URLs and escaped free text', () => {
    const title = 'Sample, title; \\ folder\nsecond line'
    const description =
      'Literal sample, semicolon; backslash\\ and newline\n' + 'long text '.repeat(25)
    const input = phase({
      openEnded: true,
      title,
      description,
      events: [
        {
          startYear: 2027,
          endYear: 2027,
          openEnded: true,
          sourceUrl: 'https://example.test/open?x=a,b',
        },
        { startYear: 2028, endYear: 2030, sourceUrl: 'https://example.test/bounded' },
      ] as TimelinePhase['events'],
    })
    const output = phasesToIcs([input], options)
    const [event] = readEvents(output)
    expect(output).toContain('\r\n ')
    expect(event.summary).toBe(`Planning reminder — Sample country: ${title}`)
    expect(event.description).toContain(description)
    expect(event.description).toContain(
      'At least one source event in this grouped phase has no end date stated; other events may have bounded dates.'
    )
    expect(event.description).toContain('Source: https://example.test/open?x=a,b')
    expect(event.description).toContain('Source: https://example.test/bounded')
    expect(event.end).toBeUndefined()
    expect(input.events[1].endYear).toBe(2030)
  })
})
