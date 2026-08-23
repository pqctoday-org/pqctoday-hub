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
import { LIBRARY_CATEGORIES } from './libraryData'

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

  it('every active row uses a value from LIBRARY_CATEGORIES', () => {
    // Added 2026-08-22 with the consolidation from 82 distinct values to 13.
    // useLibraryPipeline builds its filter chips from LIBRARY_CATEGORIES, so a
    // row carrying anything else matches NO chip and is reachable only under
    // "All" — 163 rows were in that state, silently.
    const allowed = new Set<string>(LIBRARY_CATEGORIES)
    const offenders = new Map<string, string[]>()
    for (const row of activeRows()) {
      const value = (row.manual_category ?? '').trim()
      const id = (row.reference_id ?? '?').trim()
      if (!value) {
        offenders.set('(blank)', [...(offenders.get('(blank)') ?? []), id])
      } else if (!allowed.has(value)) {
        offenders.set(value, [...(offenders.get(value) ?? []), id])
      }
    }
    const report = [...offenders.entries()]
      .map(([v, ids]) => `${v} (${ids.length}): ${ids.slice(0, 3).join(', ')}`)
      .join('\n  ')
    expect(offenders.size, `manual_category values outside LIBRARY_CATEGORIES:\n  ${report}`).toBe(
      0
    )
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
