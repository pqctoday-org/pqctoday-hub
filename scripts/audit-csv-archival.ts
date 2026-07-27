#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-csv-archival.ts
 *
 * Enforces the documented CSV-maintenance convention (CSVmaintenance.md:
 * "Keep 2 versions in src/data/ for status tracking... Archive older files
 * to src/data/archive/") — a rule that was previously enforced by nothing
 * but human memory.
 *
 * Why this matters beyond tidiness: every dated-CSV loader
 * (libraryData.ts, timelineData.ts, etc.) uses `import.meta.glob('./
 * prefix_*.csv', { eager: true })`, which statically bundles every
 * matched file's raw content into the production JS build — not just the
 * newest one. Left un-archived, this scales linearly and silently: on
 * 2026-07-26, 8 sources had accumulated 3-42 files each (80+ excess
 * files total), which produced one 65 MB JS chunk and broke the
 * production build (vite-plugin-pwa's injectManifest step refuses to
 * precache an asset that large). See
 * pqctoday-priv/maintenance/REVISIONS-INTEGRITY-REMEDIATION-PLAN-07262026.md
 * for the incident this gate exists to prevent recurring.
 *
 * Usage:
 *   npx tsx scripts/audit-csv-archival.ts          # human report
 *   npx tsx scripts/audit-csv-archival.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — every prefix has at most MAX_VERSIONS files
 *   1 — one or more prefixes exceed it
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

export const MAX_VERSIONS = 2

/** Strip the trailing MMDDYYYY(_rN)?.csv suffix to get a source's prefix.
 *  Same convention pqctoday-priv/scripts/archive-csvs.sh already uses —
 *  one rule, not two independently-maintained copies of it. */
export function csvPrefix(filename: string): string {
  return filename.replace(/\d{8}(_r\d+)?\.csv$/, '')
}

export interface ArchivalFinding {
  prefix: string
  count: number
  excess: string[]
}

/** Group every *.csv in dataDir by prefix; report any group over
 *  maxVersions with the exact files that should be archived (oldest
 *  first — everything past the newest `maxVersions`, sorted the same
 *  date+revision-aware way archive-csvs.sh sorts). Files already under
 *  dataDir/archive/ are not read (fs.readdirSync on dataDir itself is
 *  non-recursive, so this is automatic, not a filter to maintain). */
export function findExcess(dataDir: string, maxVersions: number = MAX_VERSIONS): ArchivalFinding[] {
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.csv'))
  const byPrefix = new Map<string, string[]>()
  for (const f of files) {
    const prefix = csvPrefix(f)
    const group = byPrefix.get(prefix) ?? []
    group.push(f)
    byPrefix.set(prefix, group)
  }

  const findings: ArchivalFinding[] = []
  for (const [prefix, group] of byPrefix) {
    if (group.length <= maxVersions) continue
    // Newest-first: date+revision descending, same tuple-sort the
    // recovery_util.find_latest_csv (priv) convention already uses —
    // plain lexicographic sort misorders _r9 after _r24.
    const sorted = [...group].sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
    findings.push({
      prefix,
      count: group.length,
      excess: sorted.slice(maxVersions),
    })
  }
  return findings.sort((a, b) => a.prefix.localeCompare(b.prefix))
}

/** MMDDYYYY_rNN → YYYYMMDD_NNN, zero-padded so string comparison sorts
 *  correctly (matches archive-csvs.sh's awk '{printf "%s%s%s_%03d", ...}'). */
function sortKey(filename: string): string {
  const m = filename.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
  if (!m) return filename
  const [, mm, dd, yyyy, rev] = m
  return `${yyyy}${mm}${dd}_${(rev ?? '0').padStart(3, '0')}`
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')

function main(): void {
  const wantJson = process.argv.includes('--json')
  const findings = findExcess(DATA_DIR)

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n')
    process.exit(findings.length > 0 ? 1 : 0)
  }

  if (findings.length === 0) {
    console.log(`PASS CSV archival clean — every prefix has at most ${MAX_VERSIONS} files.`)
    process.exit(0)
  }

  console.log(`FAIL ${findings.length} source(s) exceed ${MAX_VERSIONS} un-archived versions:\n`)
  for (const f of findings) {
    console.log(`  ${f.prefix}* — ${f.count} files, ${f.excess.length} to archive:`)
    for (const e of f.excess) console.log(`    ${e}`)
  }
  console.log(`\nRun: (cd pqctoday-hub && bash ../pqctoday-priv/scripts/archive-csvs.sh)`)
  process.exit(1)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
