// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { REGION_ITEMS } from './AlgorithmFilters'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data')

/** Finds the CSV in src/data the loaders would actually pick — same
 *  (date desc, revision desc) precedence as `loadLatestCSV`/`loadLatestCSVAsync`
 *  in csvUtils.ts — so this test tracks whichever snapshot is actually wired
 *  even when an older un-archived snapshot is still present alongside it.
 *  Mirrors the helper in algorithmStatusTier.driftguard.test.ts. */
function findWiredCsv(pattern: RegExp): string {
  const matches = readdirSync(dataDir)
    .filter((f) => pattern.test(f))
    .map((f) => {
      const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      const date = m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : new Date(0)
      const revision = m?.[4] ? parseInt(m[4], 10) : 0
      return { file: f, date, revision }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.revision - a.revision)
  expect(
    matches.length,
    `expected at least one CSV matching ${pattern} in src/data`
  ).toBeGreaterThan(0)
  return join(dataDir, matches[0].file)
}

function parseRows(path: string): Record<string, string>[] {
  const content = readFileSync(path, 'utf-8')
  const { data } = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  return data
}

// Grade-A remediation Phase 2 (PLAN-04-ALGORITHMS.md §6): the region filter
// bar is shared across both Algorithms sub-tabs, but Detailed Comparison and
// Transition Guide read from two DIFFERENT CSVs with two different `region`
// vocabularies (see the comment above REGION_ITEMS in AlgorithmFilters.tsx
// for the full history). This guard fails loudly — instead of silently
// shipping a zero-result dropdown option — the moment either:
//  (1) a REGION_ITEMS id stops matching any row in BOTH wired CSVs, or
//  (2) a future CSV snapshot introduces a new distinct region value that
//      REGION_ITEMS doesn't yet offer as a filter option.
describe('AlgorithmFilters REGION_ITEMS — drift guard', () => {
  const referenceRows = parseRows(
    findWiredCsv(/^pqc_complete_algorithm_reference_\d{8}(?:_r\d+)?\.csv$/)
  )
  const transitionRows = parseRows(findWiredCsv(/^algorithms_transitions_\d{8}(?:_r\d+)?\.csv$/))

  const referenceRegions = new Set(
    referenceRows.map((r) => (r.region || '').trim()).filter(Boolean)
  )
  const transitionRegions = new Set(
    transitionRows.map((r) => (r.Region || '').trim()).filter(Boolean)
  )

  it('every non-"All" REGION_ITEMS id matches at least one row in the reference CSV or the transitions CSV', () => {
    const offenders = REGION_ITEMS.filter((item) => item.id !== 'All').filter(
      (item) => !referenceRegions.has(item.id) && !transitionRegions.has(item.id)
    )
    expect(offenders.map((o) => o.id)).toEqual([])
  })

  it('every distinct real region value in either wired CSV has a matching REGION_ITEMS id', () => {
    const knownIds = new Set(REGION_ITEMS.map((item) => item.id))
    const allRealRegions = new Set([...referenceRegions, ...transitionRegions])
    const missing = [...allRealRegions].filter((region) => !knownIds.has(region))
    expect(missing).toEqual([])
  })
})
