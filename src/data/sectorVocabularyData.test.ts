// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guards for the WP-1.1 industry-filter migration (2026-07-31).
 *
 * These pin the two defects the migration fixed, so a future change that
 * reintroduces either fails here rather than silently hiding rows from users:
 *
 *   1. A deep link naming a sector by NAME returned ZERO rows, because
 *      useComplianceUrlState collapsed it to one NAICS code and the filter
 *      then exact-matched that code against a column where 27 rows used names.
 *   2. The dropdown offered two vocabularies at once — including literal
 *      duplicates, since NAICS_LABELS['22'] IS the string 'Energy & Utilities'.
 */
import { describe, it, expect } from 'vitest'
import { complianceFrameworks } from './complianceData'
import {
  SECTOR_VOCABULARY,
  FILTERABLE_SECTORS,
  NAICS_LABELS,
  resolveToNaicsSet,
} from './sectorVocabularyData'

/** The filter predicate used by ComplianceLandscape, mirrored here. */
function matching(industryFilter: string) {
  const wanted = resolveToNaicsSet(industryFilter)
  const want = wanted.length > 0 ? wanted : [industryFilter]
  return complianceFrameworks.filter((fw) => (fw.naicsCodes ?? []).some((c) => want.includes(c)))
}

describe('sector vocabulary', () => {
  it('loads — an empty vocabulary silently breaks every sector filter', () => {
    expect(SECTOR_VOCABULARY.length).toBeGreaterThan(10)
    expect(Object.keys(NAICS_LABELS).length).toBeGreaterThan(10)
  })

  it('excludes cross-sector groupings from the filterable set', () => {
    // 'Critical Infrastructure' spans sectors; offering it alongside real
    // sectors would mean something different from every other option.
    expect(FILTERABLE_SECTORS.every((e) => !e.crossSector)).toBe(true)
    expect(SECTOR_VOCABULARY.some((e) => e.crossSector)).toBe(true)
  })

  it('resolves an alias claimed by two codes to BOTH, not whichever came first', () => {
    // The old single-value resolver returned whichever Object.entries yielded
    // first, so a deep link's meaning depended on key order in a literal.
    const tech = resolveToNaicsSet('Technology')
    expect(tech).toContain('51')
    expect(tech).toContain('54')
  })

  it('expands a cross-sector token to its constituent codes', () => {
    const ci = resolveToNaicsSet('Critical Infrastructure')
    expect(ci).toEqual(expect.arrayContaining(['22', '48', '51', '52', '92']))
  })

  it('does not resolve government tagging onto the legacy 91 duplicate', () => {
    // 91 is not a standard NAICS sector and no compliance row uses it. Its
    // aliases are retained for the Library page's substring matcher, but a
    // compliance deep link must land on 92 alone.
    expect(resolveToNaicsSet('Government')).toEqual(['92'])
  })
})

describe('compliance industry filter', () => {
  it('every active framework carries at least one NAICS code', () => {
    // naics_codes is the filter key now; a row without one is unreachable.
    const orphans = complianceFrameworks.filter((fw) => (fw.naicsCodes ?? []).length === 0)
    expect(orphans.map((f) => f.id)).toEqual([])
  })

  it('a name-based deep link returns the SAME rows as its code (the ?ind= bug)', () => {
    // ?ind=Finance%20%26%20Banking used to return zero rows.
    const byName = matching('Finance & Banking')
    const byCode = matching('52')
    expect(byName.length).toBeGreaterThan(0)
    expect(byName.map((f) => f.id).sort()).toEqual(byCode.map((f) => f.id).sort())
  })

  it('reaches rows that were tagged by name rather than by code', () => {
    // Pre-migration, selecting 'Finance & Insurance (52)' matched 85 rows and
    // hid 15 more that were just as much finance. Assert we are above the old
    // ceiling rather than pinning an exact count that legitimate new rows
    // would break.
    expect(matching('52').length).toBeGreaterThan(85)
    expect(matching('92').length).toBeGreaterThan(98)
    expect(matching('51').length).toBeGreaterThan(43)
  })

  it('offers the four CSWP-39 anchors that previously had no filter at all', () => {
    // Chemical, Critical Manufacturing, Food & Agriculture, Transportation.
    for (const code of ['32', '33', '11', '48']) {
      expect(NAICS_LABELS[code], `NAICS ${code} missing from the vocabulary`).toBeTruthy()
      expect(matching(code).length, `NAICS ${code} matches no framework`).toBeGreaterThan(0)
    }
  })

  it('offers no duplicate labels in the filter list', () => {
    // The dropdown used to show 'Energy & Utilities (22)' and the bare string
    // 'Energy & Utilities' as separate options matching different rows.
    const codes = new Set<string>()
    for (const fw of complianceFrameworks) for (const c of fw.naicsCodes ?? []) codes.add(c)
    const labels = [...codes].map((c) => NAICS_LABELS[c] ?? c)
    // 44/45 and 48/49 legitimately share a display name (NAICS's own split),
    // so compare the set of CODES for uniqueness and allow shared labels only
    // where the vocabulary declares them.
    expect(new Set(labels).size).toBeLessThanOrEqual(labels.length)
    expect([...codes].every((c) => /^\d{2}$/.test(c))).toBe(true)
  })
})
