// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTitle, formatSessionTime, formatSessionTimeTitle } from './date'

const NOW = new Date(2026, 10, 26, 12, 0, 0) // 26 Nov 2026, local

describe('formatDate', () => {
  it('formats the four granularities', () => {
    const d = new Date(2026, 10, 1, 9, 0, 0)
    expect(formatDate(d, 'day', { now: NOW })).toBe('1 Nov 2026')
    expect(formatDate('2026-11-01', 'month')).toBe('Nov 2026')
    expect(formatDate('2030-06-15', 'year')).toBe('2030')
    expect(formatDate('2027-08-02', 'quarter')).toBe('Q3 2027')
    expect(formatDate('2027-01-31', 'quarter')).toBe('Q1 2027')
    expect(formatDate('2027-12-31', 'quarter')).toBe('Q4 2027')
  })

  it('defaults to the day form and reads a bare calendar date as that day in any zone', () => {
    expect(formatDate('2026-10-04', 'day', { now: NOW })).toBe('4 Oct 2026')
    expect(formatDate('2026-11-22', undefined, { relative: false })).toBe('22 Nov 2026')
  })

  it('reads year-month and year-only strings', () => {
    expect(formatDate('2026-11', 'month')).toBe('Nov 2026')
    expect(formatDate('2030', 'year')).toBe('2030')
  })

  it('says "3 days ago" inside the last 7 days, and the date from day 8', () => {
    expect(formatDate('2026-11-23', 'day', { now: NOW })).toBe('3 days ago')
    expect(formatDate('2026-11-19', 'day', { now: NOW })).toBe('7 days ago')
    expect(formatDate('2026-11-18', 'day', { now: NOW })).toBe('18 Nov 2026')
    expect(formatDate('2026-11-26', 'day', { now: NOW })).toBe('today')
    expect(formatDate('2026-11-25', 'day', { now: NOW })).toBe('yesterday')
  })

  it('keeps future dates absolute and lets exports switch the relative form off', () => {
    expect(formatDate('2026-11-28', 'day', { now: NOW })).toBe('28 Nov 2026')
    expect(formatDate('2026-11-23', 'day', { now: NOW, relative: false })).toBe('23 Nov 2026')
  })

  it('only the day granularity goes relative', () => {
    expect(formatDate('2026-11-24', 'month', { now: NOW })).toBe('Nov 2026')
  })

  it('shows "Not recorded" for blanks and unreadable input, never NaN or Invalid Date', () => {
    for (const v of [null, undefined, '', '   ', 'not a date', NaN, new Date('x')]) {
      expect(formatDate(v as never)).toBe('Not recorded')
    }
  })

  it('never produces the old notations', () => {
    const outs = [
      formatDate('2026-11-26', 'day', { now: new Date(2026, 11, 30), relative: true }),
      formatDate('2026-11-26', 'day', { relative: false }),
      formatDate('2026-11-26', 'month'),
    ]
    for (const o of outs) {
      expect(o).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // 11/26/2026
      expect(o).not.toMatch(/\d{4}-\d{2}-\d{2}/) // 2026-11-26
      expect(o).not.toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/) // Nov 26, 2026
      expect(o).not.toMatch(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/)
      expect(o).not.toMatch(/NaN|undefined|Invalid/)
    }
  })

  it('reads a timestamp as a local day, or a UTC day with utc: true', () => {
    const ts = Date.UTC(2026, 0, 15, 23, 30)
    expect(formatDate(ts, 'day', { now: NOW, utc: true })).toBe('15 Jan 2026')
  })
})

describe('formatDateTitle', () => {
  it('gives the full date for a calendar day', () => {
    expect(formatDateTitle('2026-11-23')).toBe('23 Nov 2026')
  })
  it('adds time and zone for a timestamp', () => {
    expect(formatDateTitle(new Date(2026, 10, 23, 9, 5))).toMatch(
      /^23 Nov 2026, 09:05 UTC([+-]\d+(:\d+)?)?$/
    )
  })
  it('handles blanks', () => {
    expect(formatDateTitle(null)).toBe('Not recorded')
  })
})

describe('formatSessionTime', () => {
  it('is 24 hour local time with seconds', () => {
    expect(formatSessionTime(new Date(2026, 10, 26, 13, 18, 2))).toBe('13:18:02')
    expect(formatSessionTime(new Date(2026, 10, 26, 0, 5, 9))).toBe('00:05:09')
  })
  it('never uses 12-hour clock or an ISO timestamp', () => {
    const out = formatSessionTime(new Date(2026, 10, 26, 13, 18, 42))
    expect(out).not.toMatch(/AM|PM/)
    expect(out).not.toMatch(/Z$|T\d/)
  })
  it('puts the full date and zone in the title', () => {
    expect(formatSessionTimeTitle(new Date(2026, 10, 26, 13, 18, 2))).toMatch(
      /^26 Nov 2026, 13:18:02 UTC([+-]\d+(:\d+)?)?$/
    )
  })
  it('handles blanks', () => {
    expect(formatSessionTime(undefined)).toBe('Not recorded')
  })
})
