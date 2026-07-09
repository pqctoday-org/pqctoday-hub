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

  it('includes a known module with its known lastReviewed date', () => {
    expect(MODULE_LAST_REVIEWED['sbom']).toBe('2026-07-08')
  })
})
