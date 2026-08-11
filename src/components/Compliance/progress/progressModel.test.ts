// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildProgress, groupProgress, nextMilestone } from './progressModel'
import { buildObligations } from '../obligations/obligationsModel'

const EU_FINANCE = { country: 'France', industry: 'Finance & Insurance', region: 'eu' as const }
const ROWS = buildObligations(EU_FINANCE)

describe('buildProgress', () => {
  it('emits one entry per stated milestone', () => {
    const eidas = ROWS.filter((r) => r.framework.id === 'EIDAS')
    const entries = buildProgress(eidas, 2026)
    expect(entries.length).toBe(eidas[0].milestones.length)
    expect(entries.every((e) => e.year !== undefined)).toBe(true)
  })

  it('keeps undated obligations instead of dropping them', () => {
    // GDPR, ENISA and ETSI bind continuously and state no date. Only 62 of 197
    // catalogue rows carry dates at all — a purely dated view would silently
    // omit the majority and read as an omission rather than a fact.
    const entries = buildProgress(ROWS, 2026)
    const ongoing = entries.filter((e) => e.bucket === 'ongoing')
    expect(ongoing.length).toBeGreaterThan(0)
    expect(ongoing.map((e) => e.framework.id)).toContain('GDPR')
    expect(ongoing.every((e) => e.year === undefined)).toBe(true)
  })

  it('buckets strictly by year against the injected current year', () => {
    const entries = buildProgress(ROWS, 2026)
    for (const e of entries) {
      if (e.year === undefined) continue
      if (e.year < 2026) expect(e.bucket).toBe('passed')
      else if (e.year === 2026) expect(e.bucket).toBe('thisYear')
      else expect(e.bucket).toBe('ahead')
    }
  })

  it('never invents a date for a row whose data carries none', () => {
    const gdpr = ROWS.filter((r) => r.framework.id === 'GDPR')
    expect(buildProgress(gdpr, 2026)).toEqual([{ framework: gdpr[0].framework, bucket: 'ongoing' }])
  })
})

describe('groupProgress', () => {
  it('orders groups passed → this year → ahead → ongoing, dropping empties', () => {
    const groups = groupProgress(buildProgress(ROWS, 2026))
    const order = groups.map((g) => g.bucket)
    expect(order).toEqual(
      [...order].sort((a, b) => {
        const rank = { passed: 0, thisYear: 1, ahead: 2, ongoing: 3 }
        return rank[a] - rank[b]
      })
    )
    expect(groups.every((g) => g.entries.length > 0)).toBe(true)
  })

  it('runs passed dates most-recent-first and future dates earliest-first', () => {
    const groups = groupProgress(buildProgress(ROWS, 2026))
    const passed = groups.find((g) => g.bucket === 'passed')
    if (passed && passed.entries.length > 1) {
      const years = passed.entries.map((e) => e.year as number)
      expect(years).toEqual([...years].sort((a, b) => b - a))
    }
    const ahead = groups.find((g) => g.bucket === 'ahead')
    if (ahead && ahead.entries.length > 1) {
      const years = ahead.entries.map((e) => e.year as number)
      expect(years).toEqual([...years].sort((a, b) => a - b))
    }
  })

  it('never labels a group "overdue"', () => {
    // A past date is a fact; "overdue" is a claim about the reader that this
    // page has no basis for. If this assertion is ever relaxed, the copy has
    // started asserting something the data cannot support.
    const groups = groupProgress(buildProgress(ROWS, 2026))
    for (const g of groups) {
      expect(`${g.title} ${g.note}`.toLowerCase()).not.toContain('overdue')
    }
  })
})

describe('nextMilestone', () => {
  it('returns the earliest date at or after the current year', () => {
    const entries = buildProgress(ROWS, 2026)
    const next = nextMilestone(entries, 2026)
    expect(next?.year).toBeGreaterThanOrEqual(2026)
    const earlierUpcoming = entries.filter(
      (e) => e.year !== undefined && e.year >= 2026 && e.year < (next?.year as number)
    )
    expect(earlierUpcoming).toHaveLength(0)
  })

  it('returns null when nothing is dated', () => {
    const gdpr = ROWS.filter((r) => r.framework.id === 'GDPR')
    expect(nextMilestone(buildProgress(gdpr, 2026), 2026)).toBeNull()
  })
})
