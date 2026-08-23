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

  it('carries a real date for a named module, not just any populated map', () => {
    // Pins the module, NOT its date. Pinning '2026-08-21' for `sbom` broke on
    // 2026-08-22 the moment emit_revision.py bumped it — which is a review doing
    // exactly what it should, not a regression. A fixture that fails on correct
    // behaviour trains people to edit the fixture, and the next time it fails for
    // a real reason they will edit it again. What actually needs guarding is that
    // this specific id resolves at all: `sbom` is a real module directory, so a
    // glob or id-derivation change that stops finding it must fail here — and that
    // the value is a date PARSED out of content.ts rather than a placeholder.
    expect(Object.keys(MODULE_LAST_REVIEWED)).toContain('sbom')
    const reviewed = MODULE_LAST_REVIEWED['sbom']
    expect(reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(reviewed).getTime(), 'a parsed date, not an epoch/placeholder').toBeGreaterThan(
      new Date('2026-01-01').getTime()
    )
  })
})
