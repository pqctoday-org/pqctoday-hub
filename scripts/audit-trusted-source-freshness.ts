// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-trusted-source-freshness.ts — weekly trusted-source freshness audit.
 *
 * Iterates every entry in the latest `src/data/trusted_sources_*.csv`,
 * fetches its `primary_url` (rate-limited, polite UA), computes a SHA-256
 * of the response body, and compares against a stored baseline at
 * `public/data/trusted-source-hashes.json`.
 *
 * Outputs:
 *  - `public/data/trusted-source-hashes.json` — baseline registry
 *  - `public/data/trusted-source-drift-report.md` — human-readable diff
 *
 * Usage:
 *   npx tsx scripts/audit-trusted-source-freshness.ts             # check + report
 *   npx tsx scripts/audit-trusted-source-freshness.ts --baseline  # establish baseline
 *   npx tsx scripts/audit-trusted-source-freshness.ts --limit 20  # cap for testing
 *
 * Designed for invocation from a weekly GitHub Actions cron
 * (.github/workflows/trusted-source-freshness.yml).
 *
 * Honours the `public/(library|timeline|threats)/skip-list.json` files
 * (paywalled URLs are not re-fetched).
 *
 * Exit codes (kept distinct so CI can tell drift from a crash):
 *   0  — audit ran, no drift
 *   20 — audit ran, drift detected (report written)
 *   2  — configuration error (no trusted_sources CSV found)
 *   anything else — unexpected crash; CI must treat as failure, NOT drift
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import Papa from 'papaparse'

const REPO_ROOT = path.resolve(process.cwd())
const HASHES_PATH = path.join(REPO_ROOT, 'public/data/trusted-source-hashes.json')
const REPORT_PATH = path.join(REPO_ROOT, 'public/data/trusted-source-drift-report.md')
const SKIP_LIST_PATHS = [
  'public/library/skip-list.json',
  'public/timeline/skip-list.json',
  'public/threats/skip-list.json',
]

const EXIT_DRIFT = 20

const USER_AGENT = 'pqctoday-freshness-audit/1.0 (+https://pqctoday.com)'
const REQUEST_TIMEOUT_MS = 15_000
const POLITE_DELAY_MS = 750

interface BaselineEntry {
  sourceId: string
  url: string
  sha256: string
  contentLength: number
  fetchedAt: string
  status: 'ok' | 'error' | 'skipped'
  errorMessage?: string
}

interface Baseline {
  generatedAt: string
  entries: Record<string, BaselineEntry>
}

interface TrustedSourceRow {
  source_id: string
  source_name: string
  primary_url: string
}

function loadSkipList(): Set<string> {
  const skip = new Set<string>()
  for (const p of SKIP_LIST_PATHS) {
    const abs = path.join(REPO_ROOT, p)
    if (!existsSync(abs)) continue
    try {
      const list = JSON.parse(readFileSync(abs, 'utf-8'))
      const urls = Array.isArray(list) ? list : (list.entries ?? [])
      for (const item of urls) {
        if (typeof item === 'string') skip.add(item)
        else if (item?.url) skip.add(item.url)
      }
    } catch {
      // ignore malformed skip-lists — they only widen the fetch set
    }
  }
  return skip
}

function loadBaseline(): Baseline {
  if (!existsSync(HASHES_PATH)) {
    return { generatedAt: new Date().toISOString(), entries: {} }
  }
  return JSON.parse(readFileSync(HASHES_PATH, 'utf-8'))
}

function findLatestTrustedSourcesCsv(): string | null {
  const dataDir = path.join(REPO_ROOT, 'src/data')
  if (!existsSync(dataDir)) return null
  const matches = readdirSync(dataDir)
    .filter((f) => /^trusted_sources_.*\.csv$/.test(f))
    .sort()
  const latest = matches.at(-1)
  return latest ? path.join('src/data', latest) : null
}

async function fetchWithTimeout(url: string): Promise<{ buffer: Buffer; status: number } | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html, application/pdf, */*' },
      redirect: 'follow',
    })
    if (!res.ok) return { buffer: Buffer.alloc(0), status: res.status }
    const ab = await res.arrayBuffer()
    return { buffer: Buffer.from(ab), status: res.status }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main(): Promise<number> {
  const isBaseline = process.argv.includes('--baseline')
  const limitIdx = process.argv.indexOf('--limit')
  const limit = limitIdx > -1 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity

  const csvPath = findLatestTrustedSourcesCsv()
  if (!csvPath) {
    console.error('No trusted_sources_*.csv found.')
    return 2
  }
  const raw = readFileSync(path.join(REPO_ROOT, csvPath), 'utf-8')
  const { data: rows } = Papa.parse<TrustedSourceRow>(raw, { header: true, skipEmptyLines: true })

  const skip = loadSkipList()
  const baseline = loadBaseline()
  const newBaseline: Baseline = { generatedAt: new Date().toISOString(), entries: {} }

  const drifts: Array<{ sourceId: string; url: string; old: string; new: string }> = []
  const newSources: Array<{ sourceId: string; url: string }> = []
  const errors: Array<{ sourceId: string; url: string; reason: string }> = []

  let processed = 0
  for (const row of rows) {
    if (processed >= limit) break
    const url = row.primary_url?.trim()
    if (!url || !/^https?:\/\//.test(url)) continue
    if (skip.has(url)) {
      newBaseline.entries[row.source_id] = {
        sourceId: row.source_id,
        url,
        sha256: '',
        contentLength: 0,
        fetchedAt: new Date().toISOString(),
        status: 'skipped',
        errorMessage: 'paywalled / on skip-list',
      }
      continue
    }

    processed++
    const r = await fetchWithTimeout(url)
    await sleep(POLITE_DELAY_MS)

    if (!r) {
      errors.push({ sourceId: row.source_id, url, reason: 'fetch error / timeout' })
      newBaseline.entries[row.source_id] = {
        sourceId: row.source_id,
        url,
        sha256: '',
        contentLength: 0,
        fetchedAt: new Date().toISOString(),
        status: 'error',
        errorMessage: 'fetch-error',
      }
      continue
    }
    if (r.status >= 400) {
      errors.push({ sourceId: row.source_id, url, reason: `http-${r.status}` })
      newBaseline.entries[row.source_id] = {
        sourceId: row.source_id,
        url,
        sha256: '',
        contentLength: 0,
        fetchedAt: new Date().toISOString(),
        status: 'error',
        errorMessage: `http-${r.status}`,
      }
      continue
    }

    const hash = crypto.createHash('sha256').update(r.buffer).digest('hex')
    const entry: BaselineEntry = {
      sourceId: row.source_id,
      url,
      sha256: hash,
      contentLength: r.buffer.length,
      fetchedAt: new Date().toISOString(),
      status: 'ok',
    }
    newBaseline.entries[row.source_id] = entry

    const prev = baseline.entries[row.source_id]
    if (!prev || prev.status !== 'ok') {
      newSources.push({ sourceId: row.source_id, url })
    } else if (prev.sha256 !== hash) {
      drifts.push({ sourceId: row.source_id, url, old: prev.sha256, new: hash })
    }
  }

  // Always write the new baseline
  writeFileSync(HASHES_PATH, JSON.stringify(newBaseline, null, 2) + '\n', 'utf-8')

  // Write drift report
  const lines: string[] = [
    `# Trusted-Source Freshness Report`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${isBaseline ? 'baseline (initial run)' : 'audit'}`,
    `Sources audited: ${processed} / ${rows.length}`,
    ``,
    `## Drift detected (${drifts.length})`,
    ``,
    drifts.length === 0
      ? '_None._'
      : drifts
          .map(
            (d) =>
              `- **${d.sourceId}** — ${d.url}\n  - old: \`${d.old.slice(0, 16)}…\`\n  - new: \`${d.new.slice(0, 16)}…\``
          )
          .join('\n'),
    ``,
    `## New sources (${newSources.length})`,
    ``,
    newSources.length === 0
      ? '_None._'
      : newSources.map((s) => `- ${s.sourceId} — ${s.url}`).join('\n'),
    ``,
    `## Errors (${errors.length})`,
    ``,
    errors.length === 0
      ? '_None._'
      : errors.map((e) => `- ${e.sourceId} — ${e.url} — ${e.reason}`).join('\n'),
  ]
  writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf-8')

  console.log(
    `Audited ${processed} sources; ${drifts.length} drift, ${newSources.length} new, ${errors.length} errors.`
  )
  console.log(`Report: ${path.relative(REPO_ROOT, REPORT_PATH)}`)
  console.log(`Baseline: ${path.relative(REPO_ROOT, HASHES_PATH)}`)

  // Distinct exit code on drift (non-baseline run) so CI can tell
  // "drift detected" apart from "the script itself crashed" (generic exit 1).
  if (!isBaseline && drifts.length > 0) return EXIT_DRIFT
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code))
}
