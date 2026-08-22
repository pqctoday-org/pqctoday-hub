#!/usr/bin/env tsx
/**
 * scripts/generate-data-filenames.ts
 *
 * Emits `src/data/generated/dataFilenames.generated.ts` — the current dated
 * CSV FILENAME (not content) of the ten data sources the "What's New" data
 * fingerprint tracks.
 *
 * WHY THIS EXISTS — BUNDLE SIZE, NOT CONVENIENCE. `useVersionStore.ts` is
 * reachable statically from `main.tsx`, so everything it imports is eager
 * first-paint JS. It used to import ten data loaders (libraryData,
 * timelineData, migrateData, threatsData, leadersData, complianceData,
 * algorithmsData, authoritativeSourcesData, certificationXrefData,
 * quizDataLoader) purely to read `.filename` off each one's metadata export.
 * Every one of those loaders inlines its whole CSV as a raw string via
 * `import.meta.glob({ eager: true, query: '?raw' })`, so ten FILENAME lookups
 * were dragging ~7.2 MB of CSV text into the eager bundle. `gate:precache`
 * caps eager JS at 15.00 MB and the build measured 14.98 MB — the next dated
 * CSV any maintenance skill wrote would have broken every build.
 *
 * The filenames are fully determined at build time, so they are resolved here
 * and emitted as ten plain string constants (a few hundred bytes) instead.
 *
 * HOW IT STAYS FAITHFUL TO THE LOADERS. Each entry below pairs a source id
 * with an anchored filename regex that is the loader's own `import.meta.glob`
 * prefix joined to the loader's own `loadLatestCSV` regex — the two halves
 * that together decide which file wins at runtime. Selection itself is NOT
 * reimplemented: `latestDatedCsv()` delegates to the app's own
 * `sortCSVFiles()` (src/data/csvUtils.ts), the exact function the loaders use,
 * so date-descending / revision-descending precedence can never drift.
 *
 * A source with no matching file emits `null`, which `useVersionStore`'s
 * `?? null` fallbacks already expect (an unresolvable source is simply never
 * reported as changed).
 *
 * Run via: npm run generate:data-filenames  (wired into `predev` and `build`)
 * Writes:  src/data/generated/dataFilenames.generated.ts
 * `--check`: drift gate — fails if the committed file is stale.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { basename, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { format, resolveConfig } from 'prettier'
import { latestDatedCsv } from './lib/latestDatedCsv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src/data')
const OUT_FILE = join(ROOT, 'src/data/generated/dataFilenames.generated.ts')

/**
 * source id → anchored filename regex.
 *
 * Each regex = the loader's glob prefix + the loader's own dated-CSV regex.
 * Keep the comment on each line pointing at the loader it mirrors; if a
 * loader's glob or regex changes, the matching line here must change with it.
 */
const SOURCES: { id: string; re: RegExp; loader: string }[] = [
  // libraryData.ts — glob './library_*.csv'
  { id: 'library', re: /^library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/, loader: 'libraryData' },
  // timelineData.ts — glob './timeline_*.csv'
  {
    id: 'timeline',
    re: /^timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    loader: 'timelineData',
  },
  // migrateData.ts — glob './pqc_product_catalog_*.csv'
  {
    id: 'migrate',
    re: /^pqc_product_catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    loader: 'migrateData',
  },
  // threatsData.ts — glob './quantum_threats_hsm_industries_*.csv'
  {
    id: 'threats',
    re: /^quantum_threats_hsm_industries_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    loader: 'threatsData',
  },
  // leadersData.ts — glob './leaders_*.csv'
  { id: 'leaders', re: /^leaders_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/, loader: 'leadersData' },
  // complianceData.ts — glob './compliance_[0-9]*.csv'
  {
    id: 'compliance',
    re: /^compliance_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    loader: 'complianceData',
  },
  // algorithmsData.ts — glob './algorithms_transitions_*.csv'
  {
    id: 'algorithms',
    re: /^algorithms_transitions_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    loader: 'algorithmsData',
  },
  // authoritativeSourcesData.ts — glob './pqc_authoritative_sources_reference_*.csv'
  {
    id: 'authoritativeSources',
    re: /^pqc_authoritative_sources_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    loader: 'authoritativeSourcesData',
  },
  // certificationXrefData.ts — glob './migrate_certification_xref_*.csv'
  {
    id: 'certificationXref',
    re: /^migrate_certification_xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    loader: 'certificationXrefData',
  },
  // quizDataLoader.ts — glob './pqcquiz_*.csv'
  { id: 'quiz', re: /^pqcquiz_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/, loader: 'quizDataLoader' },
]

/** TS string literal, or the `null` keyword. */
function lit(value: string | null): string {
  return value === null ? 'null' : `'${value.replace(/'/g, "\\'")}'`
}

async function main(): Promise<void> {
  const resolved = SOURCES.map(({ id, re, loader }) => {
    const path = latestDatedCsv(DATA_DIR, re)
    return { id, loader, filename: path === null ? null : basename(path) }
  })

  const missing = resolved.filter((r) => r.filename === null)
  if (missing.length > 0) {
    // Not fatal — `useVersionStore` treats a null filename as "never changed",
    // exactly as it did when a loader's metadata came back null. Loud, though:
    // a source going null usually means its glob/regex pair drifted.
    console.warn(
      `[generate-data-filenames] No dated CSV matched for: ${missing
        .map((m) => `${m.id} (${m.loader}.ts)`)
        .join(', ')}`
    )
  }

  const generated = `// SPDX-License-Identifier: GPL-3.0-only
/**
 * GENERATED — do not edit by hand.
 * Source: the latest dated CSV of each tracked data source in src/data/.
 * Regenerate: npm run generate:data-filenames
 *
 * Filenames ONLY. This module exists so \`useVersionStore\` can fingerprint the
 * data sources without importing ten CSV-inlining loaders into the eager
 * first-paint bundle (that cost ~7.2 MB against a 15 MB \`gate:precache\` cap).
 * See scripts/generate-data-filenames.ts for the full reasoning.
 */

/** Current dated CSV filename per tracked source; \`null\` if none resolved. */
export interface GeneratedDataFilenames {
${resolved.map((r) => `  ${r.id}: string | null`).join('\n')}
}

export const DATA_FILENAMES: GeneratedDataFilenames = {
${resolved.map((r) => `  ${r.id}: ${lit(r.filename)},`).join('\n')}
}
`

  const prettierConfig = await resolveConfig(OUT_FILE)
  const formatted = await format(generated, {
    ...prettierConfig,
    filepath: OUT_FILE,
    parser: 'typescript',
  })

  // --check: drift gate, same contract as generate-role-board-content.ts. Only
  // `predev` and `build` regenerate, so a commit that adds a dated CSV without
  // regenerating leaves the committed module stale — the production bundle
  // stays correct (build regenerates) while local runs and tests read the OLD
  // filename and would not surface the source as changed.
  if (process.argv.includes('--check')) {
    const onDisk = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf8') : null
    if (onDisk === formatted) {
      console.log(`✓ ${OUT_FILE.replace(ROOT + '/', '')} is in sync with src/data/`)
      return
    }
    console.error(
      `✗ ${OUT_FILE.replace(ROOT + '/', '')} is STALE relative to src/data/.\n` +
        `  ${onDisk === null ? 'The generated file does not exist.' : 'A tracked CSV has been added or archived since it was last generated.'}\n` +
        `  Run: npm run generate:data-filenames`
    )
    process.exit(1)
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, formatted)
  console.log(`Wrote ${OUT_FILE.replace(ROOT + '/', '')}`)
  for (const r of resolved) {
    console.log(`  ${r.id.padEnd(21)} ${r.filename ?? '(none)'}`)
  }
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e)
  process.exit(1)
})
