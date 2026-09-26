// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guardrail (local-only, not run in CI): `manual_category` must not carry two
 * spellings of the same category.
 *
 * The live defect, found 2026-08-21: 4 active rows read `Government Policy`
 * while 81 read `Government & Policy`. Nothing compared them, so the minority
 * spelling was simply a separate category as far as every consumer was
 * concerned. It matters because the column feeds `detectPurpose` in
 * libraryData.ts, which drives the Library's purpose doors — a stray spelling
 * silently sends its rows through a different door.
 *
 * This checks ONE thing: that no two distinct values reduce to the same set of
 * significant words. It deliberately does NOT police the vocabulary's size.
 * The catalogue currently carries 83 distinct values across 842 active rows,
 * 44 of them used exactly once ('Policy', 'Gov Policy', 'Government Strategy'
 * and 'Policy & Governance' are all separate categories today). Consolidating
 * that is a curation decision for a human, not something a gate should force —
 * and failing on it here would leave this test red for months, which teaches
 * everyone to ignore it.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { DATA_FILENAMES } from './generated/dataFilenames.generated'
import { LIBRARY_CATEGORIES, libraryData } from './libraryData'

interface Row {
  reference_id?: string
  manual_category?: string
  status?: string
}

/** Significant words only: case-folded, punctuation dropped, and `and`/`&`
 *  treated as noise — that pair is exactly what the live defect turned on. */
function shape(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && w !== 'and')
    .sort()
    .join(' ')
}

function activeRows(): Row[] {
  const file = DATA_FILENAMES.library
  if (!file) throw new Error('DATA_FILENAMES.library is null — run generate:data-filenames')
  const csv = fs.readFileSync(path.join(__dirname, file), 'utf8')
  const parsed = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true })
  return parsed.data.filter((r) => (r.status ?? 'active').trim().toLowerCase() !== 'deprecated')
}

describe('library manual_category vocabulary', () => {
  it('never carries two spellings of one category', () => {
    const byShape = new Map<string, Set<string>>()
    for (const row of activeRows()) {
      const value = (row.manual_category ?? '').trim()
      if (!value) continue
      const key = shape(value)
      if (!key) continue
      const seen = byShape.get(key) ?? new Set<string>()
      seen.add(value)
      byShape.set(key, seen)
    }

    const collisions = [...byShape.values()]
      .filter((variants) => variants.size > 1)
      .map((variants) => [...variants].sort().join('  |  '))

    expect(
      collisions,
      `near-duplicate manual_category spellings:\n  ${collisions.join('\n  ')}`
    ).toEqual([])
  })

  it('every active row is reachable from at least one LIBRARY_CATEGORIES chip', () => {
    // Added 2026-08-22 with the consolidation from 82 distinct values to 13.
    //
    // RE-AIMED 2026-09-25. It used to read the raw `manual_category` CELL and
    // fail on any value outside LIBRARY_CATEGORIES, blanks included. That is not
    // the thing it set out to protect, and it cannot pass as written — because
    // the cell is not what the chips filter on:
    //
    //   * `parseLibraryCSV` (libraryData.ts) maps the cell through
    //     CATEGORY_ALIASES, and where the cell is blank or still unrecognised it
    //     falls back to `detectCategories(title, documentType)`. The resolved set
    //     lands on `item.categories`.
    //   * `useLibraryPipeline` filters, counts and builds every chip from
    //     `item.categories` — `manual_category` appears nowhere in it.
    //
    // So a blank or aliased cell is by design, not a defect, and demanding a
    // literal LIBRARY_CATEGORIES value in the CSV asks the data to stop using two
    // mechanisms the loader deliberately provides. The check ran red from the day
    // the catalogue resumed growing (blank actives: 97 on 08-31, 129 on 09-13,
    // 263 on 09-25) while the user-visible hole it named — "matches NO chip,
    // reachable only under All" — was empty the whole time.
    //
    // Measured here instead on the signal the consumer actually reads. Today
    // that is 0 unreachable rows out of 1177 active, and 0 resolved categories
    // outside the vocabulary. This version still fails the moment a row really
    // does become chip-less, which the cell-level version could not distinguish
    // from a blank the loader had already covered.
    const allowed = new Set<string>(LIBRARY_CATEGORIES)
    const active = libraryData.filter(
      (item) => (item.status ?? 'active').trim().toLowerCase() !== 'deprecated'
    )
    expect(active.length, 'libraryData resolved to nothing — a vacuous pass').toBeGreaterThan(500)

    const unreachable = active
      .filter((item) => !(item.categories ?? []).some((c) => allowed.has(c)))
      .map((item) => `${item.referenceId} (categories: ${JSON.stringify(item.categories)})`)
    expect(
      unreachable,
      `active rows reachable from no category chip:\n  ${unreachable.join('\n  ')}`
    ).toEqual([])

    const offVocabulary = [
      ...new Set(active.flatMap((item) => (item.categories ?? []).filter((c) => !allowed.has(c)))),
    ].sort()
    expect(
      offVocabulary,
      `resolved categories outside LIBRARY_CATEGORIES (they render no chip):\n  ${offVocabulary.join(', ')}`
    ).toEqual([])
  })

  it('reports raw manual_category cells the loader had to rescue, without failing', () => {
    // Reporting only, and deliberately: the loader covering a cell is not a bug,
    // but a cell the CURATOR never filled is still a curation debt, and it should
    // be countable without holding a gate red. The two named spellings below are
    // one-offs; the blanks are the accumulating half.
    const allowed = new Set<string>(LIBRARY_CATEGORIES)
    let blank = 0
    const outside = new Map<string, number>()
    for (const row of activeRows()) {
      const value = (row.manual_category ?? '').trim()
      if (!value) blank++
      else if (!allowed.has(value)) outside.set(value, (outside.get(value) ?? 0) + 1)
    }
    if (blank || outside.size) {
      console.warn(
        `[library categories] ${blank} active rows have a blank manual_category and ` +
          `${outside.size} carry a value outside LIBRARY_CATEGORIES ` +
          `(${[...outside].map(([v, n]) => `${v} ×${n}`).join('; ') || 'none'}). ` +
          `All are rescued by CATEGORY_ALIASES / detectCategories today — curation debt, not a rendering hole.`
      )
    }
    expect(typeof blank).toBe('number')
  })

  it('reduces the two spellings of the live defect to one shape', () => {
    // Fixes the meaning of `shape` so a future simplification cannot quietly
    // stop catching the case this gate was written for.
    expect(shape('Government Policy')).toBe(shape('Government & Policy'))
    expect(shape('Standards & Compliance')).toBe(shape('standards and compliance'))
  })

  it('does not merge genuinely different categories', () => {
    expect(shape('Government & Policy')).not.toBe(shape('Policy'))
    expect(shape('NIST Standards')).not.toBe(shape('International Standards'))
    expect(shape('PQC KEM Draft')).not.toBe(shape('PQC Signature Draft'))
  })
})
