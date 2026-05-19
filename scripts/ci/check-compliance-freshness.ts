// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-compliance-freshness.ts
 *
 * Warns when public/data/compliance-data.json is older than a threshold.
 * Designed to run in CI (or via `npm run check:compliance-fresh`) so the
 * Records tab doesn't silently serve month-old certification data.
 *
 * Context: the daily compliance scraper workflow was intentionally removed
 * on 2026-04-25 (commit 9fa3a84a — "compliance scraping is private; runs
 * locally via build-data.sh before pushing"). Without an automated refresh,
 * staleness creeps in unnoticed. This check is the watchdog.
 *
 * Usage:
 *   npx tsx scripts/check-compliance-freshness.ts            # default 14-day threshold
 *   npx tsx scripts/check-compliance-freshness.ts --max-days 21
 *   npx tsx scripts/check-compliance-freshness.ts --json     # machine-readable output
 *
 * Exit codes:
 *   0  data is fresh
 *   1  data is stale (over threshold)
 *   2  data file missing or unreadable
 */

import fs from 'fs'
import path from 'path'

interface Args {
  maxDays: number
  json: boolean
}

function parseArgs(argv: string[]): Args {
  let maxDays = 14
  let json = false
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--max-days') {
      maxDays = Number(argv[i + 1])
      i++
    } else if (argv[i] === '--json') {
      json = true
    }
  }
  if (!Number.isFinite(maxDays) || maxDays <= 0) {
    console.error('check-compliance-freshness: --max-days must be a positive number')
    process.exit(2)
  }
  return { maxDays, json }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const file = path.resolve(process.cwd(), 'public/data/compliance-data.json')

  if (!fs.existsSync(file)) {
    const msg = `compliance-data.json missing at ${file}`
    if (args.json) {
      console.log(JSON.stringify({ ok: false, error: 'missing', file, message: msg }))
    } else {
      console.error('[freshness] ' + msg)
    }
    process.exit(2)
  }

  const stat = fs.statSync(file)
  const ageMs = Date.now() - stat.mtimeMs
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  const isStale = ageDays > args.maxDays

  // Records count for visibility
  let recordCount: number | null = null
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
    if (Array.isArray(data)) recordCount = data.length
  } catch {
    // ignore — staleness check works without record count
  }

  if (args.json) {
    console.log(
      JSON.stringify({
        ok: !isStale,
        file,
        ageDays: Number(ageDays.toFixed(1)),
        maxDays: args.maxDays,
        modified: new Date(stat.mtimeMs).toISOString(),
        recordCount,
        ...(isStale && {
          hint: 'Run `./build-data.sh` (private full pipeline) or `npx tsx scripts/scrape-compliance.ts --force` to refresh.',
        }),
      })
    )
  } else {
    const tag = isStale ? '[freshness][STALE]' : '[freshness][OK]'
    console.log(
      `${tag} compliance-data.json age=${ageDays.toFixed(1)}d threshold=${args.maxDays}d records=${recordCount ?? 'unknown'} modified=${new Date(stat.mtimeMs).toISOString()}`
    )
    if (isStale) {
      console.error(
        '\nThe compliance-data.json is older than the threshold. The Records tab on /compliance ' +
          'is serving stale certification data. Run the local scraper to refresh:\n\n' +
          '    ./build-data.sh\n' +
          '\nor just the scrape + cert-match (faster):\n\n' +
          '    npx tsx scripts/scrape-compliance.ts --force\n' +
          '    python3 scripts/match_certifications.py\n'
      )
    }
  }

  process.exit(isStale ? 1 : 0)
}

main()
