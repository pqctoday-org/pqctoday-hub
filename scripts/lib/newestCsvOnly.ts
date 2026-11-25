// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Production and dev builds leave out the older generations of dated data files that no code reads.
 *
 * Every `src/data/<family>_MMDDYYYY[_rN].csv` family keeps two generations (CSV maintenance rule), and a loader's
 * `import.meta.glob(..., { eager: true })` bundles both. Only a loader that asks for the previous generation (status
 * badges: New, Updated) reads the older one; for every other family the older text is dead weight in the entry chunk,
 * which the offline install precaches. The families listed here are those whose loaders never read an older
 * generation; a test scans the loaders and fails if one starts to. The older file still imports, as an empty string,
 * so the glob keeps its key. Vitest reads every file.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

export const NEWEST_CSV_ONLY_FAMILIES: readonly string[] = [
  'algo_product_xref',
  'algorithms_transitions',
  'concept_registry',
  'counter_claims',
  'industry_landscape',
  'industry_market_size',
  'industry_standards',
  'jurisdictions',
  'migrate_certification_xref',
  'migrate_cpe_xref',
  'migrate_hsm_capability_xref',
  'migrate_purl_xref',
  'migrate_saas_xref',
  'pqc_authoritative_sources_reference',
  'pqcassessment',
  'pqcquiz',
  'sector_vocabulary',
  'sim_missions',
  'source_organizations',
  'standard_implements_algo_xref',
  'trusted_source_xref',
  'trusted_sources',
  'vendor_partners',
  'vendors',
]

/** `<family>_MMDDYYYY[_rN].csv` names of one family, oldest first (date, then revision, both as numbers). */
export function csvGenerations(names: readonly string[], family: string): string[] {
  const rx = new RegExp(`^${family}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  return names
    .map((name) => {
      const m = name.match(rx)
      return m ? { name, date: Number(m[3] + m[1] + m[2]), rev: Number(m[4] ?? 0) } : null
    })
    .filter((x): x is { name: string; date: number; rev: number } => x !== null)
    .sort((a, b) => a.date - b.date || a.rev - b.rev)
    .map((x) => x.name)
}

/** The files of the listed families that are not the newest generation. */
export function olderGenerations(
  dir: string,
  families: readonly string[] = NEWEST_CSV_ONLY_FAMILIES,
  list: (dir: string) => string[] = (d) => readdirSync(d)
): string[] {
  const names = list(dir)
  return families.flatMap((family) => csvGenerations(names, family).slice(0, -1))
}

/** True when a loader's source asks for, or sorts out, a generation other than the newest. */
export function readsOlderGeneration(source: string): boolean {
  return (
    /previous|withPrevious|sortCSVFiles|\[1\]|slice\(1/i.test(source) ||
    /loadLatestCSV[^;]*?,\s*true\b/s.test(source)
  )
}

export function readLoaderSource(path: string): string {
  return readFileSync(path, 'utf8')
}

/** Vite plugin: the older generations of the listed families import as an empty string. */
export function newestCsvOnlyPlugin(
  dataDir: string,
  families: readonly string[] = NEWEST_CSV_ONLY_FAMILIES
): Plugin {
  let older = new Set<string>()
  return {
    name: 'newest-csv-only',
    // Build and dev serve; Vitest reads the full set.
    apply: (_config, env) => env.command === 'build' || !process.env.VITEST,
    enforce: 'pre',
    buildStart() {
      older = new Set(olderGenerations(dataDir, families).map((name) => join(dataDir, name)))
      console.log(
        `[newest-csv-only] ${older.size} older data-file generations left out of the bundle`
      )
    },
    load(id) {
      const [file, query] = id.split('?')
      if (query === 'raw' && older.has(file)) return 'export default ""'
      return null
    },
  }
}
