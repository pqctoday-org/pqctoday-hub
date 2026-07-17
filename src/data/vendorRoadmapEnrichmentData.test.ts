// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parseFileDate } from './vendorRoadmapEnrichmentData'

describe('parseFileDate', () => {
  // Regression: migrate-process remediation Phase 5 (U9) — sorting these
  // filenames as plain strings puts a 2027 file BEFORE a 2026 file
  // ("01152027" < "12312026" lexicographically), so a later-dated
  // enrichment file would silently lose to an earlier one when merged.
  it('a later year sorts after an earlier year, unlike plain string sort', () => {
    const early = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_12312026.md')
    const late = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_01152027.md')
    expect(late.date).toBeGreaterThan(early.date)
    // Sanity: confirm this is exactly the case plain string sort gets wrong.
    expect(
      'vendor_roadmap_enrichments_01152027.md' < 'vendor_roadmap_enrichments_12312026.md'
    ).toBe(true)
  })

  it('same-day files are ordered by _rN revision', () => {
    const base = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_07142026.md')
    const rev = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_07142026_r2.md')
    expect(rev.rev).toBeGreaterThan(base.rev)
    expect(rev.date).toBe(base.date)
  })

  it('an unparseable filename sorts first (date/rev both 0)', () => {
    expect(parseFileDate('./doc-enrichments/nonsense.md')).toEqual({ date: 0, rev: 0 })
  })
})
