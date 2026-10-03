// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { CRQC_ESTIMATES, getCrqcMigrationDeadlines } from './quantumConstants'

describe('CRQC_ESTIMATES (the Threats sources list)', () => {
  it('every source label is unique (the list keys rows by it)', () => {
    const labels = CRQC_ESTIMATES.map((e) => e.source)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('every entry has a sane range, an https source link and a review date', () => {
    for (const e of CRQC_ESTIMATES) {
      expect(e.yearLow, e.source).toBeLessThanOrEqual(e.yearHigh)
      expect(e.url, e.source).toMatch(/^https:\/\//)
      expect(e.lastReviewed, e.source).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(e.confidence.trim(), e.source).not.toBe('')
      expect(e.notes.trim(), e.source).not.toBe('')
    }
  })

  it('a government migration entry is never labelled as a forecast of arrival', () => {
    for (const e of getCrqcMigrationDeadlines())
      expect(e.confidence + ' ' + e.notes, e.source).not.toMatch(/predicts? (a )?CRQC arrival/i)
  })

  it('BSI shows the dates its guideline gives, with no 2040', () => {
    const bsi = CRQC_ESTIMATES.filter((e) => e.source.startsWith('BSI'))
    expect(bsi.length).toBeGreaterThan(0)
    for (const e of bsi) {
      expect(e.yearHigh, e.source).toBeLessThanOrEqual(2035)
      expect(e.source, e.source).toMatch(/TR-02102-1/)
    }
  })

  it('NSA names both documents, marks the newer one, and keeps the 2030–2033 range', () => {
    const nsa = CRQC_ESTIMATES.find((e) => e.source.startsWith('NSA CNSA 2.0'))!
    expect(nsa.source).toMatch(/2022.*FAQ version 2\.1, December 2024/)
    expect(nsa.notes).toMatch(/version 1\.0/)
    expect(nsa.notes).toMatch(/December 2024 FAQ is the newer/)
    expect([nsa.yearLow, nsa.yearHigh]).toEqual([2030, 2033])
    expect(nsa.kind).toBe('migration-deadline')
  })
})
