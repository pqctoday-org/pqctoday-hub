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
    // Pins the module, NOT its date. Pinning '2026-08-21' for the canary broke on
    // 2026-08-22 the moment emit_revision.py bumped it — which read as a review doing
    // exactly what it should. A fixture that fails on correct behaviour trains people
    // to edit the fixture, and the next time it fails for a real reason they will edit
    // it again. What actually needs guarding is that a specific id resolves at all, so
    // a glob or id-derivation change that stops finding it must fail here — and that
    // the value is a date PARSED out of content.ts rather than a placeholder.
    //
    // THE CANARY MOVED from `sbom` to `pqc-101` on 2026-08-23. `sbom` postdates the
    // 2026-03-28 baseline and has never actually been reviewed; the bump that used to
    // keep it in this map was an EDIT being recorded as a review, which is the whole
    // defect the lastReviewed/lastEdited split removed. Its absence here is now correct,
    // so the canary has to be a module that genuinely has a review record. Do not move
    // it back, and do not pick a module from moduleReviewHonesty.test.ts's
    // never-reviewed list.
    expect(Object.keys(MODULE_LAST_REVIEWED)).toContain('pqc-101')
    const reviewed = MODULE_LAST_REVIEWED['pqc-101']
    expect(reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(reviewed).getTime(), 'a parsed date, not an epoch/placeholder').toBeGreaterThan(
      new Date('2026-01-01').getTime()
    )
  })
})
