#!/usr/bin/env tsx
/**
 * scripts/audit-timeline-evidence.ts
 *
 * CI gate that asserts every active Timeline CSV row has real, verifiable
 * evidence. A row passes when at least one of the following holds:
 *
 *   (a) its `local_file` exists on disk under public/timeline/
 *   (b) it has an entry in `public/timeline/manifest.json` — the lineage
 *       manifest, keyed by refId = event_id — whose status is `downloaded`,
 *       `recaptured` or `paywall` and which carries a sha256. (Repointed
 *       2026-09-24, timeline remediation r2 T-E1: this audit used to read the
 *       older public/timeline/evidence/manifest.json — composite-keyed, no
 *       hashes, built from a different CSV snapshot than the one it audited.
 *       That file is deleted, as threats' was on 2026-08-21.)
 *   (c) its SourceUrl is listed in `public/timeline/skip-list.json`
 *       (operator-acknowledged: manually-verified real source, auto-fetch
 *       blocked — e.g. WAF or TLS incompatibility)
 *
 * The audit is driven by the LATEST dated src/data/timeline_*.csv — not by the
 * manifest — so newly added rows with no evidence are caught even when the
 * manifest is stale. Exits non-zero if any active row fails all three checks.
 *
 * Modes:
 *   (default) human-readable report
 *   --json    machine-readable summary
 *
 * Run via:
 *   npm run audit:timeline-evidence
 *   npm run audit:timeline-evidence -- --json
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
// RELOCATED 2026-07-12 (see pqctoday-priv/maintenance/LOCAL-FILES-
// REMEDIATION-PLAN-07122026.md) — raw evidence docs live in
// pqctoday-priv/local-evidence-cache/, not hub's public/. Missed in the
// original migration sweep — this script's own localFilePath() still
// resolved against public/timeline/ until found via a real audit run
// misreporting 15 rows as dead links that all had real, live sources
// (confirmed by re-fetching each one via fetch_resilient.py).
const LOCAL_CACHE_ROOT = join(ROOT, '..', 'pqctoday-priv', 'local-evidence-cache')

function findLatestTimelineCsv(): string {
  const dir = join(ROOT, 'src/data')
  const matches = readdirSync(dir)
    .map((f) => {
      // eslint-disable-next-line security/detect-unsafe-regex
      const m = f.match(/^timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      const [, month, day, year, rev] = m
      return {
        path: join(dir, f),
        date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime(),
        revision: rev ? parseInt(rev) : 0,
      }
    })
    .filter((x): x is { path: string; date: number; revision: number } => x !== null)
    .sort((a, b) => (a.date !== b.date ? b.date - a.date : b.revision - a.revision))
  if (matches.length === 0) throw new Error('No timeline_*.csv in src/data/')
  return matches[0].path
}

const CSV_PATH = findLatestTimelineCsv()
const MANIFEST_PATH = join(ROOT, 'public/timeline/manifest.json')
const SKIP_LIST_PATH = join(ROOT, 'public/timeline/skip-list.json')

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
  refId?: string
  url?: string
  status?: string
  sha256?: string
  file?: string
}

interface TimelineManifest {
  csv?: string
  entries: TimelineManifestEntry[]
}

interface AuditSummary {
  total_active_rows: number
  rows_with_csv_local_file: number
  rows_with_resolved_local_file: number
  status_counts: Record<DownloadStatus, number>
  problem_rows: Array<{
    event_id: string
    country: string
    org: string
    title: string
    download_status: DownloadStatus
    error_message: string | null
  }>
  passed: boolean
}

// Lineage-manifest statuses that prove a real, hashed capture. paywall is an
// acceptable proof-of-real-source even when access is locked. A skip-list entry
// (check (c)) is the audit trail for a manually verified source that auto-fetch
// cannot reach (WAF, TLS incompatibility).
const HEALTHY_MANIFEST: ReadonlySet<string> = new Set(['downloaded', 'recaptured', 'paywall'])

function fail(message: string): never {
  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({ passed: false, error: message }, null, 2) + '\n')
  } else {
    console.error(`audit-timeline-evidence: ${message}`)
  }
  process.exit(1)
}

/** Resolve a CSV local_file value to an absolute path in the local evidence cache. */
function localFilePath(lf: string): string {
  const rel = lf.startsWith('public/') ? lf.slice('public/'.length) : lf
  return join(LOCAL_CACHE_ROOT, rel)
}

function main(): void {
  if (!existsSync(CSV_PATH)) fail(`CSV not found: ${CSV_PATH}`)
  if (!existsSync(MANIFEST_PATH)) {
    fail(
      `Manifest not found: ${MANIFEST_PATH}\n` +
        `Rebuild it: python3 maintenance/lineage/rebuild_manifest.py --source timeline (pqctoday-priv).`
    )
  }

  const csvContent = readFileSync(CSV_PATH, 'utf-8')
  const { data } = Papa.parse<RawTimelineRow>(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  const activeRows = data.filter(
    (r): r is RawTimelineRow =>
      !!r && !!r.Country && (r.status ?? '').trim().toLowerCase() === 'active'
  )
  if (activeRows.length === 0) {
    fail(`No active rows found in ${CSV_PATH} — a 0-row audit cannot pass.`)
  }

  const manifest: TimelineManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
  const byRefId = new Map<string, TimelineManifestEntry>()
  for (const e of manifest.entries) if (e.refId) byRefId.set(e.refId, e)

  const skipUrls: ReadonlySet<string> = existsSync(SKIP_LIST_PATH)
    ? new Set(Object.keys(JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8'))))
    : new Set()

  const statusCounts: Record<DownloadStatus, number> = {
    ok: 0,
    paywall: 0,
    error: 0,
    missing: 0,
    no_url: 0,
    skipped: 0,
  }
  let rowsWithCsvLocalFile = 0
  let rowsOnDisk = 0
  const problems: AuditSummary['problem_rows'] = []

  for (const row of activeRows) {
    const country = (row.Country ?? '').trim()
    const org = (row.OrgName ?? '').trim()
    const title = (row.Title ?? '').trim()
    const url = (row.SourceUrl ?? '').trim()
    const localFile = (row.local_file ?? '').trim()
    const key = (row.event_id ?? '').trim()

    if (localFile) rowsWithCsvLocalFile++

    // (a) evidence file on disk under public/timeline/
    const onDisk = !!localFile && existsSync(localFilePath(localFile))
    if (onDisk) rowsOnDisk++

    // (b) lineage-manifest entry for this event_id: a healthy status + a hash
    const entry = byRefId.get(key)
    const inManifestHealthy =
      !!entry && HEALTHY_MANIFEST.has(entry.status ?? '') && !!(entry.sha256 ?? '').trim()

    // (c) operator-acknowledged skip-list entry
    const inSkipList = !!url && skipUrls.has(url)

    const rowStatus: DownloadStatus = onDisk
      ? 'ok'
      : inManifestHealthy
        ? entry!.status === 'paywall'
          ? 'paywall'
          : 'ok'
        : inSkipList
          ? 'skipped'
          : entry
            ? 'error'
            : url
              ? 'missing'
              : 'no_url'
    statusCounts[rowStatus]++

    if (!onDisk && !inManifestHealthy && !inSkipList) {
      problems.push({
        event_id: key,
        country,
        org,
        title,
        download_status: rowStatus,
        error_message: entry
          ? `manifest entry status "${entry.status ?? ''}"${entry.sha256 ? '' : ', no sha256'}`
          : 'not on disk, not in public/timeline/manifest.json, not in skip-list — fetch the evidence, then rebuild the manifest',
      })
    }
  }

  const summary: AuditSummary = {
    total_active_rows: activeRows.length,
    rows_with_csv_local_file: rowsWithCsvLocalFile,
    rows_with_resolved_local_file: rowsOnDisk,
    status_counts: statusCounts,
    problem_rows: problems.slice(0, 20),
    passed: problems.length === 0,
  }

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
    process.exit(summary.passed ? 0 : 1)
  }

  console.log('Timeline evidence audit')
  console.log('=======================')
  console.log(`Source CSV       : ${CSV_PATH.replace(ROOT + '/', '')}`)
  console.log(`Manifest         : ${MANIFEST_PATH.replace(ROOT + '/', '')}`)
  console.log(`Manifest emitted : ${manifest.generated_at} (from ${manifest.source_csv})`)
  console.log('')
  console.log(`Active rows                       : ${summary.total_active_rows}`)
  console.log(`Rows w/ csv_local_file set        : ${summary.rows_with_csv_local_file}`)
  console.log(`Rows w/ evidence file on disk     : ${summary.rows_with_resolved_local_file}`)
  console.log('')
  console.log('Row evidence status counts:')
  for (const [k, v] of Object.entries(summary.status_counts)) {
    console.log(`  ${k.padEnd(8)} ${v}`)
  }
  console.log('')

  if (problems.length === 0) {
    console.log(
      `PASS — every active row has acceptable evidence (on disk, manifest ok/paywall/skipped, or skip-listed).`
    )
    process.exit(0)
  }

  console.log(`First ${Math.min(20, problems.length)} problem rows (of ${problems.length}):`)
  for (const p of problems.slice(0, 20)) {
    console.log(
      `  [${p.download_status.padEnd(7)}] ${p.event_id} — ${p.country} / ${p.org} — ${p.title}`
    )
    if (p.error_message) console.log(`            ${p.error_message}`)
  }
  console.log('')
  console.log(`FAIL — ${problems.length} active row(s) lack acceptable evidence.`)
  process.exit(1)
}

main()
