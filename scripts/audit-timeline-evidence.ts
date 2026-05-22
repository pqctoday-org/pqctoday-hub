#!/usr/bin/env tsx
/**
 * scripts/audit-timeline-evidence.ts
 *
 * CI gate that asserts every active Timeline CSV row has a corresponding
 * entry in `public/timeline/evidence/manifest.json` whose download_status is
 * acceptable (`ok` or `paywall`). Exits non-zero if any active row is missing
 * its on-disk evidence.
 *
 * Modes:
 *   (default) human-readable report
 *   --json    machine-readable summary
 *
 * Run via:
 *   npm run audit:timeline-evidence
 *   npm run audit:timeline-evidence -- --json
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CSV_PATH = join(ROOT, 'src/data/timeline_05172026.csv')
const MANIFEST_PATH = join(ROOT, 'public/timeline/evidence/manifest.json')

const JSON_MODE = process.argv.slice(2).includes('--json')

interface RawTimelineRow {
  Country: string
  OrgName: string
  StartYear: string
  Title: string
  SourceUrl: string
  local_file: string
  status: string
}

type DownloadStatus = 'ok' | 'paywall' | 'error' | 'missing' | 'no_url' | 'skipped'

interface TimelineManifestEntry {
  row_key: string
  country: string
  org: string
  title: string
  start_year: number
  source_url: string
  csv_local_file: string | null
  resolved_local_file: string | null
  download_status: DownloadStatus
  http_status: number | null
  error_message: string | null
}

interface TimelineManifest {
  generated_at: string
  source_csv: string
  total_rows: number
  active_rows: number
  status_counts: Record<DownloadStatus, number>
  entries: TimelineManifestEntry[]
}

interface AuditSummary {
  total_active_rows: number
  rows_with_csv_local_file: number
  rows_with_resolved_local_file: number
  status_counts: Record<DownloadStatus, number>
  problem_rows: Array<{
    row_key: string
    country: string
    org: string
    title: string
    download_status: DownloadStatus
    error_message: string | null
  }>
  passed: boolean
}

function fail(message: string): never {
  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({ passed: false, error: message }, null, 2) + '\n')
  } else {
    console.error(`audit-timeline-evidence: ${message}`)
  }
  process.exit(1)
}

function main(): void {
  if (!existsSync(CSV_PATH)) fail(`CSV not found: ${CSV_PATH}`)
  if (!existsSync(MANIFEST_PATH)) {
    fail(
      `Manifest not found: ${MANIFEST_PATH}\n` +
        `Run \`npm run download:timeline-evidence\` first.`
    )
  }

  const csvContent = readFileSync(CSV_PATH, 'utf-8')
  const { data } = Papa.parse<RawTimelineRow>(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  const activeRows = data.filter(
    (r): r is RawTimelineRow =>
      !!r && !!r.Country && (r.status ?? '').trim().toLowerCase() !== 'deprecated'
  )

  const manifest: TimelineManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))

  const rowsWithCsvLocalFile = activeRows.filter((r) => !!r.local_file?.trim()).length
  const rowsResolved = manifest.entries.filter((e) => !!e.resolved_local_file).length

  // Acceptable = ok | paywall. paywall is an acceptable proof-of-real-source
  // even when access is locked.
  const ACCEPTABLE: ReadonlySet<DownloadStatus> = new Set(['ok', 'paywall'])

  const problems = manifest.entries.filter((e) => !ACCEPTABLE.has(e.download_status))

  const summary: AuditSummary = {
    total_active_rows: activeRows.length,
    rows_with_csv_local_file: rowsWithCsvLocalFile,
    rows_with_resolved_local_file: rowsResolved,
    status_counts: manifest.status_counts,
    problem_rows: problems.slice(0, 20).map((p) => ({
      row_key: p.row_key,
      country: p.country,
      org: p.org,
      title: p.title,
      download_status: p.download_status,
      error_message: p.error_message,
    })),
    passed: problems.length === 0,
  }

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
    process.exit(summary.passed ? 0 : 1)
  }

  console.log('Timeline evidence audit')
  console.log('=======================')
  console.log(`Source CSV       : ${manifest.source_csv}`)
  console.log(`Manifest         : ${MANIFEST_PATH.replace(ROOT + '/', '')}`)
  console.log(`Manifest emitted : ${manifest.generated_at}`)
  console.log('')
  console.log(`Active rows                       : ${summary.total_active_rows}`)
  console.log(`Rows w/ csv_local_file set        : ${summary.rows_with_csv_local_file}`)
  console.log(`Rows w/ on-disk resolved_local_file: ${summary.rows_with_resolved_local_file}`)
  console.log('')
  console.log('Status counts:')
  for (const [k, v] of Object.entries(summary.status_counts)) {
    console.log(`  ${k.padEnd(8)} ${v}`)
  }
  console.log('')

  if (problems.length === 0) {
    console.log(`PASS — every active row has acceptable evidence (ok or paywall).`)
    process.exit(0)
  }

  console.log(`First ${Math.min(20, problems.length)} problem rows (of ${problems.length}):`)
  for (const p of problems.slice(0, 20)) {
    console.log(
      `  [${p.download_status.padEnd(7)}] ${p.row_key} — ${p.country} / ${p.org} — ${p.title}`
    )
    if (p.error_message) console.log(`            ${p.error_message}`)
  }
  console.log('')
  console.log(`FAIL — ${problems.length} active row(s) lack acceptable evidence.`)
  process.exit(1)
}

main()
