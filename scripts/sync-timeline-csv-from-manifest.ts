#!/usr/bin/env tsx
/**
 * scripts/sync-timeline-csv-from-manifest.ts
 *
 * Bumps the timeline CSV to a new dated copy with `local_file` filled in for
 * rows that were fetched via `npm run download:timeline-evidence:fetch` but
 * still have a blank `local_file` column in the latest CSV.
 *
 * Honours project CSV conventions (see CLAUDE.md):
 *   - never edit in place; always cut a new dated file
 *   - keep 2 versions in src/data/ for New/Updated tracking
 *   - rows are NEVER deleted; only updated
 *
 * Match key: (Country, OrgName, Title, StartYear) — assumed unique.
 *
 * Run via:
 *   npx tsx scripts/sync-timeline-csv-from-manifest.ts
 *   npx tsx scripts/sync-timeline-csv-from-manifest.ts --dry-run
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CSV_DIR = join(ROOT, 'src/data')
const MANIFEST_PATH = join(ROOT, 'public/timeline/evidence/manifest.json')

const DRY_RUN = process.argv.slice(2).includes('--dry-run')

interface ManifestEntry {
  country: string
  org: string
  title: string
  start_year: number
  csv_local_file: string | null
  resolved_local_file: string | null
  download_status: string
}

interface Manifest {
  entries: ManifestEntry[]
}

function findLatestTimelineCsv(): string {
  const files = readdirSync(CSV_DIR)
    .filter((f) => /^timeline_\d{8}(?:_r\d+)?\.csv$/.test(f))
    .map((f) => {
      const m = f.match(/timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      const [, month, day, year, rev] = m
      return {
        file: f,
        date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
        revision: rev ? parseInt(rev) : 0,
      }
    })
    .filter((x): x is { file: string; date: Date; revision: number } => x !== null)
    .sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) return b.date.getTime() - a.date.getTime()
      return b.revision - a.revision
    })
  if (files.length === 0) throw new Error('No timeline_*.csv found in src/data/')
  return join(CSV_DIR, files[0].file)
}

function todayStamp(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${mm}${dd}${yyyy}`
}

function matchKey(country: string, org: string, title: string, startYear: string | number): string {
  return `${country}${org}${title}${startYear}`
}

function main(): void {
  const sourceCsvPath = findLatestTimelineCsv()
  const sourceCsvName = sourceCsvPath.split('/').pop() as string
  console.log(`Source CSV: ${sourceCsvName}`)

  if (!existsSync(MANIFEST_PATH)) {
    console.error('Manifest missing — run `npm run download:timeline-evidence` first.')
    process.exit(1)
  }
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))

  // Build lookup: matchKey → resolved_local_file (only entries that have a path AND were not already in CSV)
  const fillIns = new Map<string, string>()
  for (const e of manifest.entries) {
    if (!e.resolved_local_file) continue
    if (e.csv_local_file && e.csv_local_file.trim()) continue
    fillIns.set(matchKey(e.country, e.org, e.title, e.start_year), e.resolved_local_file)
  }

  if (fillIns.size === 0) {
    console.log(
      'Nothing to sync — every manifest entry with resolved_local_file already has csv_local_file set.'
    )
    process.exit(0)
  }
  console.log(`Will update ${fillIns.size} CSV row(s) with local_file paths.`)

  const csvText = readFileSync(sourceCsvPath, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length) {
    console.error('CSV parse errors:', parsed.errors.slice(0, 3))
    process.exit(1)
  }

  let updated = 0
  const unmatched = new Set(fillIns.keys())
  for (const row of parsed.data) {
    const key = matchKey(row.Country, row.OrgName, row.Title, row.StartYear)
    const fill = fillIns.get(key)
    if (!fill) continue
    if ((row.local_file || '').trim()) continue
    row.local_file = fill
    updated += 1
    unmatched.delete(key)
  }

  if (unmatched.size) {
    console.warn(
      `⚠ ${unmatched.size} manifest entries did not match any CSV row (printing first 5):`
    )
    Array.from(unmatched)
      .slice(0, 5)
      // eslint-disable-next-line no-control-regex
      .forEach((k) => console.warn('   ' + k.replace(//g, ' | ')))
  }

  // Write to today's dated file.
  const stamp = todayStamp()
  const outName = `timeline_${stamp}.csv`
  const outPath = join(CSV_DIR, outName)
  if (existsSync(outPath) && !DRY_RUN) {
    console.log(`(${outName} already exists — will overwrite)`)
  }

  const fields = parsed.meta.fields ?? Object.keys(parsed.data[0] ?? {})
  const csvOut = Papa.unparse(parsed.data, { columns: fields })

  if (DRY_RUN) {
    console.log(
      `DRY-RUN — would write ${outName} (${updated} updated rows of ${parsed.data.length})`
    )
  } else {
    writeFileSync(outPath, csvOut + '\n', 'utf-8')
    console.log(`Wrote ${outName} (${updated} updated rows of ${parsed.data.length})`)
  }
}

main()
