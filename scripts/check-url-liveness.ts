// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-url-liveness.ts
 *
 * Lightweight HTTP HEAD checker for all source URLs across 7 CSV datasets.
 * Respects existing skip-lists (public/{collection}/skip-list.json) and rate-limits
 * per domain to avoid hammering hosts.
 *
 * NOT intended for CI — manual/scheduled use only.
 *
 * Usage:
 *   npx tsx scripts/check-url-liveness.ts [--json] [--verbose] [--timeout 10000] [--concurrency 10]
 *
 * Exit codes:
 *   0 — all reachable
 *   1 — some URLs unreachable (warnings)
 */

import fs from 'fs'
import path from 'path'
import { loadCSV, isValidUrl } from './validators/data-loader.js'
import type { CheckResult, Finding } from './validators/types.js'

// ── CLI flags ────────────────────────────────────────────────────────────────

const IS_JSON = process.argv.includes('--json')
const VERBOSE = process.argv.includes('--verbose')

function getArgValue(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : fallback
}

const TIMEOUT = parseInt(getArgValue('--timeout', '10000'), 10)
const CONCURRENCY = parseInt(getArgValue('--concurrency', '10'), 10)
const LIMIT = parseInt(getArgValue('--limit', '0'), 10)

// ── Skip-list loading ────────────────────────────────────────────────────────

const ROOT = path.resolve(process.cwd())

const SKIP_LIST_PATHS = [
  'public/library/skip-list.json',
  'public/timeline/skip-list.json',
  'public/threats/skip-list.json',
  'public/products/skip-list.json',
]

function loadSkipLists(): Set<string> {
  const urls = new Set<string>()
  for (const rel of SKIP_LIST_PATHS) {
    const p = path.join(ROOT, rel)
    if (!fs.existsSync(p)) continue
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
      for (const url of Object.keys(data)) urls.add(url)
    } catch {
      // skip malformed
    }
  }
  return urls
}

// ── URL extraction from CSVs ─────────────────────────────────────────────────

interface UrlEntry {
  source: string
  id: string
  url: string
  field: string
  csvFile: string
  row: number
}

interface UrlCheckConfig {
  source: string
  prefix: string
  idField: string
  urlFields: string[]
}

const URL_CONFIGS: UrlCheckConfig[] = [
  { source: 'library', prefix: 'library_', idField: 'reference_id', urlFields: ['download_url'] },
  { source: 'timeline', prefix: 'timeline_', idField: 'Title', urlFields: ['SourceUrl'] },
  { source: 'compliance', prefix: 'compliance_', idField: 'id', urlFields: ['website'] },
  {
    source: 'threats',
    prefix: 'quantum_threats_hsm_industries_',
    idField: 'threat_id',
    urlFields: ['source_url'],
  },
  {
    source: 'leaders',
    prefix: 'leaders_',
    idField: 'Name',
    urlFields: ['WebsiteUrl', 'LinkedinUrl'],
  },
  {
    source: 'migrate',
    prefix: 'quantum_safe_cryptographic_software_reference_',
    idField: 'software_name',
    urlFields: ['authoritative_source', 'repository_url'],
  },
  {
    source: 'authoritative_sources',
    prefix: 'pqc_authoritative_sources_reference_',
    idField: 'Source_Name',
    urlFields: ['Primary_URL'],
  },
]

function extractUrls(skipList: Set<string>): UrlEntry[] {
  const entries: UrlEntry[] = []
  const seen = new Set<string>()

  for (const config of URL_CONFIGS) {
    const data = loadCSV(config.prefix)
    if (data.rows.length === 0) continue

    data.rows.forEach((row, i) => {
      const id = row[config.idField] || `row-${i + 2}`
      for (const field of config.urlFields) {
        const url = row[field]?.trim()
        if (!url || !isValidUrl(url) || skipList.has(url) || seen.has(url)) continue
        seen.add(url)
        entries.push({
          source: config.source,
          id,
          url,
          field,
          csvFile: data.file,
          row: i + 2,
        })
      }
    })
  }

  return entries
}

// ── Rate-limited HEAD checker ────────────────────────────────────────────────

interface LivenessResult {
  entry: UrlEntry
  status: number | null
  ok: boolean
  error: string | null
  durationMs: number
}

/** Per-domain queue timestamps for rate limiting (1 req/sec/domain). */
const domainLastRequest = new Map<string, number>()

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

async function waitForDomainSlot(domain: string): Promise<void> {
  const last = domainLastRequest.get(domain) || 0
  const elapsed = Date.now() - last
  if (elapsed < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed))
  }
  domainLastRequest.set(domain, Date.now())
}

async function checkUrl(entry: UrlEntry): Promise<LivenessResult> {
  const domain = getDomain(entry.url)
  await waitForDomainSlot(domain)

  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)

    const response = await fetch(entry.url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'PQCUrlChecker/1.0 (+https://pqctoday.com)',
      },
    })
    clearTimeout(timer)

    // Some servers don't support HEAD — retry with GET if 405
    if (response.status === 405) {
      const controller2 = new AbortController()
      const timer2 = setTimeout(() => controller2.abort(), TIMEOUT)
      const getResp = await fetch(entry.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller2.signal,
        headers: {
          'User-Agent': 'PQCUrlChecker/1.0 (+https://pqctoday.com)',
        },
      })
      clearTimeout(timer2)
      // Consume the body to avoid memory leaks
      await getResp.text().catch(() => {})
      return {
        entry,
        status: getResp.status,
        ok: getResp.ok,
        error: null,
        durationMs: Date.now() - start,
      }
    }

    return {
      entry,
      status: response.status,
      ok: response.ok,
      error: null,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      entry,
      status: null,
      ok: false,
      error: msg.includes('abort') ? 'TIMEOUT' : msg,
      durationMs: Date.now() - start,
    }
  }
}

// ── Concurrency pool ─────────────────────────────────────────────────────────

async function checkAllUrls(entries: UrlEntry[], concurrency: number): Promise<LivenessResult[]> {
  const results: LivenessResult[] = []
  let idx = 0
  const total = entries.length

  async function worker(): Promise<void> {
    while (idx < total) {
      const current = idx++
      if (!IS_JSON) {
        const pct = Math.round(((current + 1) / total) * 100)
        process.stderr.write(`\r  Checking ${current + 1}/${total} (${pct}%)`)
      }
      results.push(await checkUrl(entries[current]))
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker())
  await Promise.all(workers)

  if (!IS_JSON) process.stderr.write('\n')
  return results
}

// ── Build CheckResults ───────────────────────────────────────────────────────

function buildResults(livenessResults: LivenessResult[]): CheckResult[] {
  // Group by source
  const bySource = new Map<string, LivenessResult[]>()
  for (const r of livenessResults) {
    const src = r.entry.source
    if (!bySource.has(src)) bySource.set(src, [])
    bySource.get(src)!.push(r)
  }

  const results: CheckResult[] = []

  for (const [source, items] of bySource) {
    const failures = items.filter((r) => !r.ok)
    const findings: Finding[] = failures.map((r) => ({
      csv: r.entry.csvFile,
      row: r.entry.row,
      field: r.entry.field,
      value: r.entry.url,
      message: r.error ? `${r.entry.id}: ${r.error}` : `${r.entry.id}: HTTP ${r.status}`,
    }))

    results.push({
      id: `N25-url-liveness-${source}`,
      category: 'url-coverage',
      description: `${source} URL liveness (${items.length} checked, ${failures.length} failed)`,
      sourceA: source,
      sourceB: null,
      severity: 'WARNING',
      status: failures.length === 0 ? 'PASS' : 'FAIL',
      findings,
    })
  }

  return results
}

// ── Console output ───────────────────────────────────────────────────────────

function printConsole(
  results: CheckResult[],
  totalUrls: number,
  skippedCount: number,
  livenessResults: LivenessResult[]
) {
  const totalChecked = livenessResults.length
  const totalFailed = livenessResults.filter((r) => !r.ok).length
  const totalOk = totalChecked - totalFailed
  const avgMs =
    totalChecked > 0
      ? Math.round(livenessResults.reduce((s, r) => s + r.durationMs, 0) / totalChecked)
      : 0

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║              URL Liveness Check Report                    ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  console.log(`  Total URLs found:    ${totalUrls}`)
  console.log(`  Skipped (skip-list): ${skippedCount}`)
  console.log(`  Checked:             ${totalChecked}`)
  console.log(`  Reachable:           ${totalOk}`)
  console.log(`  Unreachable:         ${totalFailed}`)
  console.log(`  Avg response time:   ${avgMs} ms\n`)

  for (const result of results) {
    const icon = result.status === 'PASS' ? '\x1b[32m PASS\x1b[0m' : '\x1b[33m FAIL\x1b[0m'
    console.log(`  [${icon}] ${result.id}: ${result.description}`)
    if (result.findings.length > 0 && VERBOSE) {
      for (const f of result.findings) {
        console.log(`         \x1b[33m!\x1b[0m ${f.message}`)
        console.log(`           ${f.value}`)
      }
    } else if (result.findings.length > 0) {
      console.log(`         (${result.findings.length} failures — use --verbose to see details)`)
    }
  }

  // Status codes breakdown
  if (VERBOSE) {
    const statusCounts = new Map<string, number>()
    for (const r of livenessResults) {
      const key = r.error || `HTTP ${r.status}`
      statusCounts.set(key, (statusCounts.get(key) || 0) + 1)
    }
    console.log('\n  Status breakdown:')
    for (const [status, count] of [...statusCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${count.toString().padStart(4)} × ${status}`)
    }
  }

  console.log('')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const skipList = loadSkipLists()
  if (!IS_JSON) {
    console.log(`\n  Loading URLs from 7 CSV datasets...`)
    console.log(`  Skip-list: ${skipList.size} known-inaccessible URLs`)
    console.log(`  Concurrency: ${CONCURRENCY}, Timeout: ${TIMEOUT}ms\n`)
  }

  const allEntries = extractUrls(skipList)
  const skippedCount = (() => {
    // Count how many valid URLs were skipped
    let count = 0
    for (const config of URL_CONFIGS) {
      const data = loadCSV(config.prefix)
      data.rows.forEach((row) => {
        for (const field of config.urlFields) {
          const url = row[field]?.trim()
          if (url && isValidUrl(url) && skipList.has(url)) count++
        }
      })
    }
    return count
  })()

  const totalUrls = allEntries.length + skippedCount

  if (!IS_JSON) {
    console.log(`  Found ${allEntries.length} unique URLs to check (${skippedCount} skipped)\n`)
  }

  const entriesToCheck = LIMIT > 0 ? allEntries.slice(0, LIMIT) : allEntries
  if (LIMIT > 0 && !IS_JSON) {
    console.log(`  --limit ${LIMIT}: checking first ${entriesToCheck.length} URLs only\n`)
  }

  const livenessResults = await checkAllUrls(entriesToCheck, CONCURRENCY)
  const checkResults = buildResults(livenessResults)

  if (IS_JSON) {
    const report = {
      timestamp: new Date().toISOString(),
      totalUrls,
      skipped: skippedCount,
      checked: livenessResults.length,
      reachable: livenessResults.filter((r) => r.ok).length,
      unreachable: livenessResults.filter((r) => !r.ok).length,
      results: checkResults,
      failures: livenessResults
        .filter((r) => !r.ok)
        .map((r) => ({
          source: r.entry.source,
          id: r.entry.id,
          url: r.entry.url,
          status: r.status,
          error: r.error,
          durationMs: r.durationMs,
        })),
    }
    console.log(JSON.stringify(report, null, 2))
  } else {
    printConsole(checkResults, totalUrls, skippedCount, livenessResults)
  }

  const hasFailures = checkResults.some((r) => r.status === 'FAIL')
  process.exit(hasFailures ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(2)
})
