// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import {
  isCertifiedTier,
  isDraftTier,
  isStatusFilterTier,
  parseStatusTier,
} from './algorithmStatusTier'

const dataDir = dirname(fileURLToPath(import.meta.url))

/** Finds the CSV in src/data the loaders would actually pick — same
 *  (date desc, revision desc) precedence as `loadLatestCSV`/`loadLatestCSVAsync`
 *  in csvUtils.ts — so this test tracks whichever snapshot is actually wired
 *  even when an older un-archived snapshot is still present alongside it. */
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

// WORKSTREAMS.md §WS-A drift guard: the tier is a field of the data. Every row
// of the two wired CSVs (retired rows included, so a revival cannot arrive
// without one) must carry a `status_tier` that is one of the governed tiers.
// A future CSV snapshot that adds a row without a tier fails here and in the
// app's data load, instead of silently falling through to "Certified".
describe('algorithm status tier — drift guard (WS-A)', () => {
  it('gives every row of the reference CSV a valid status_tier', () => {
    const csvPath = findWiredCsv(/^pqc_complete_algorithm_reference_\d{8}(?:_r\d+)?\.csv$/)
    const rows = parseRows(csvPath)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(
        () => parseStatusTier(row.status_tier, row.algorithm),
        `reference row ${JSON.stringify(row.algorithm)} (status ${JSON.stringify(row.status)}) has no valid status_tier`
      ).not.toThrow()
    }
  })

  it('gives every row of the transitions CSV a valid status_tier', () => {
    const csvPath = findWiredCsv(/^algorithms_transitions_\d{8}(?:_r\d+)?\.csv$/)
    const rows = parseRows(csvPath)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(
        () => parseStatusTier(row.status_tier, row.classical_algorithm),
        `transition row ${JSON.stringify(row.classical_algorithm)} -> ${JSON.stringify(row.pqc_replacement)} (Status ${JSON.stringify(row.Status)}) has no valid status_tier`
      ).not.toThrow()
    }
  })

  it('refuses a blank or unknown status_tier', () => {
    expect(() => parseStatusTier('', 'x')).toThrow(/status_tier/)
    expect(() => parseStatusTier(undefined, 'x')).toThrow(/status_tier/)
    expect(() => parseStatusTier('certified', 'x')).toThrow(/status_tier/)
    expect(parseStatusTier(' final ', 'x')).toBe('final')
  })
})

describe('certified vs status-filter tiers must stay separate', () => {
  // Two deliberately different questions:
  //   isCertifiedTier      — "is this genuinely final?"  drives the green
  //                          badge, the sort order, and the Playground's
  //                          Draft warning on the key-generation picker.
  //   isStatusFilterTier   — "should this show in the default view?"  one
  //                          tier broader, so NIST's own selections (HQC,
  //                          FN-DSA) are not hidden from migration planning.
  //
  // The failure mode this guards is someone tidying the two into one. Widening
  // isCertifiedTier to match the filter would put a green "Certified" badge on
  // a pre-final algorithm AND suppress the Playground's Draft warning while a
  // user generates keys with it. Narrowing the filter to match isCertifiedTier
  // would re-hide FN-DSA-512, which personaConfig.ts lists as a headline
  // executive algorithm.

  it('fips-draft shows in the default filter but is NOT treated as certified', () => {
    expect(isStatusFilterTier('fips-draft')).toBe(true)
    expect(isCertifiedTier('fips-draft')).toBe(false)
    // The Playground's Draft badge keys off isDraftTier — it MUST still fire.
    expect(isDraftTier('fips-draft')).toBe(true)
  })

  it('the two predicates are not the same function', () => {
    const tiers = ['final', 'regional', 'fips-draft'] as const
    const certified = tiers.filter(isCertifiedTier)
    const filtered = tiers.filter(isStatusFilterTier)
    expect(filtered.length).toBeGreaterThan(certified.length)
    // Every certified tier must also pass the filter — the filter is a
    // superset, never a different set.
    for (const t of certified) {
      expect(isStatusFilterTier(t), `${t} is certified but hidden by the filter`).toBe(true)
    }
  })

  it('genuinely final tiers are certified under both', () => {
    for (const t of ['final', 'regional'] as const) {
      expect(isCertifiedTier(t)).toBe(true)
      expect(isStatusFilterTier(t)).toBe(true)
      expect(isDraftTier(t)).toBe(false)
    }
  })

  it('non-standardized and placeholder stay out of both', () => {
    for (const t of ['non-standardized', 'placeholder'] as const) {
      expect(isCertifiedTier(t)).toBe(false)
      expect(isStatusFilterTier(t), `${t} must not appear in the default view`).toBe(false)
    }
  })
})
