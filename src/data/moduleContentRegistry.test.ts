// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { MODULE_LAST_REVIEWED } from './moduleContentRegistry'

describe('moduleContentRegistry', () => {
  it('discovers lastReviewed dates for a substantial share of modules', () => {
    // 61 of 64 module dirs have a content.ts as of this remediation — guard against
    // the glob silently finding nothing (e.g. a path typo) without hard-coding the count.
    expect(Object.keys(MODULE_LAST_REVIEWED).length).toBeGreaterThan(50)
  })

  it('every discovered date is a well-formed ISO date', () => {
    const isoDate = /^\d{4}-\d{2}-\d{2}$/
    for (const [moduleId, date] of Object.entries(MODULE_LAST_REVIEWED)) {
      expect(date, `${moduleId}.lastReviewed`).toMatch(isoDate)
    }
  })

  it('includes a known module with a real date parsed out of its content.ts', () => {
    // This exists to prove the glob returns PARSED values, not placeholders —
    // so it checks that sbom resolves to a plausible date, not to one exact day.
    // It used to assert '2026-08-21' literally, and broke on 2026-08-22 the
    // first time sbom was legitimately re-reviewed: a passing review is not a
    // regression, and a test that treats it as one trains people to edit the
    // date rather than read the failure.
    const reviewed = MODULE_LAST_REVIEWED['sbom']
    expect(reviewed, 'sbom must be discovered by the glob').toBeDefined()
    expect(reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(reviewed).getTime(), 'a parsed date, not an epoch/placeholder').toBeGreaterThan(
      new Date('2026-01-01').getTime()
    )
  })
})
