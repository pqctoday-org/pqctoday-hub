#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-reference-cache-drift.ts — detect silent upstream changes to cached
 * reference documents
 *
 * Closes the gap noted in trust-engine-explainability §16 Weakness
 * "Reference-document caching is point-in-time" and Opportunity #14
 * "Per-document content hashes". The manifest entry schema already carries
 * a `sha256` field for every `downloaded` entry (3 library + 23 timeline +
 * 11 threats = 37 entries with full coverage as of 2026-05-14). What was
 * missing was the second half of the loop: a script that periodically
 * re-fetches each cached URL, hashes the response, and compares against
 * the manifest snapshot.
 *
 * For each `downloaded` entry in
 * `public/{library,timeline,threats}/manifest.json` the script:
 *
 *   1. Fetches the `url` with a short timeout
 *   2. Computes SHA-256 over the response body
 *   3. Compares against the stored `sha256`
 *   4. Classifies as: ok / drift / fetch-error / size-mismatch
 *
 * The report is written to `public/data/reference-cache-drift.json` for the
 * companion CI workflow to surface as a build artefact. The script ALWAYS
 * exits 0 when it completes (drift is a finding, not an error); exits 2 on
 * configuration / IO problems that prevent the audit from running at all.
 *
 * Usage:
 *   npx tsx scripts/audit-reference-cache-drift.ts [--collection library|timeline|threats|all]
 *                                                  [--concurrency 4]
 *                                                  [--timeout-ms 20000]
 *                                                  [--limit N] (audit only the first N entries — for smoke-tests)
 *                                                  [--dry-run] (don't write the report file)
 */
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

interface ManifestEntry {
  refId?: string
  title?: string
  url: string
  status: string
  filename?: string
  sizeBytes?: number
  contentType?: string
  sha256?: string
}

interface Manifest {
  generated?: string
  source?: string
  summary?: Record<string, number>
  entries: ManifestEntry[]
}

type DriftClassification = 'ok' | 'drift' | 'fetch-error' | 'size-mismatch' | 'no-stored-hash'

interface DriftFinding {
  collection: string
  refId: string
  title: string
  url: string
  classification: DriftClassification
  /** Stored hash from the manifest. */
  storedSha256: string | null
  /** Hash computed from the just-fetched bytes. Null on fetch error. */
  observedSha256: string | null
  /** Stored size from the manifest, when present. */
  storedSizeBytes: number | null
  /** Size of the just-fetched response body, in bytes. */
  observedSizeBytes: number | null
  errorMessage?: string
  checkedAt: string
}

interface DriftReport {
  generatedAt: string
  totalEntries: number
  fetched: number
  classifications: Record<DriftClassification, number>
  findings: DriftFinding[]
}

const COLLECTIONS = ['library', 'timeline', 'threats'] as const
type Collection = (typeof COLLECTIONS)[number]

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

interface CliOptions {
  collections: Collection[]
  concurrency: number
  timeoutMs: number
  limit: number | null
  dryRun: boolean
}

function parseCli(argv: string[]): CliOptions {
  const args = argv.slice(2)
  let collections: Collection[] = [...COLLECTIONS]
  let concurrency = 4
  let timeoutMs = 20000
  let limit: number | null = null
  let dryRun = false

  for (let i = 0; i < args.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- i is a monotonic loop counter into a string[]
    const a = args[i]
    if (a === '--collection') {
      const v = args[++i]
      if (v === 'all') collections = [...COLLECTIONS]
      else if (COLLECTIONS.includes(v as Collection)) collections = [v as Collection]
      else throw new Error(`--collection must be one of: ${COLLECTIONS.join(', ')}, all`)
    } else if (a === '--concurrency') {
      concurrency = Math.max(1, parseInt(args[++i], 10) || 4)
    } else if (a === '--timeout-ms') {
      timeoutMs = Math.max(1000, parseInt(args[++i], 10) || 20000)
    } else if (a === '--limit') {
      limit = Math.max(1, parseInt(args[++i], 10) || 1)
    } else if (a === '--dry-run') {
      dryRun = true
    }
  }
  return { collections, concurrency, timeoutMs, limit, dryRun }
}

// ---------------------------------------------------------------------------
// Fetch + classify — exported pure-ish helpers for testing
// ---------------------------------------------------------------------------

export interface FetchedResource {
  bytes: Uint8Array
  sha256: string
}

// eslint-disable-next-line no-unused-vars -- function-type parameters document the callback contract
export type FetchImpl = (url: string, timeoutMs: number) => Promise<FetchedResource>

const realFetch: FetchImpl = async (url, timeoutMs) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Identify ourselves clearly so upstream maintainers can spot the
      // crawl in their logs if they care to.
      headers: {
        'User-Agent':
          'pqctoday-reference-cache-drift/1.0 (+https://github.com/pqctoday-org/pqctoday-hub)',
        Accept: '*/*',
      },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    const buf = new Uint8Array(await res.arrayBuffer())
    const sha = createHash('sha256').update(buf).digest('hex')
    return { bytes: buf, sha256: sha }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Classifies a single entry. Pure: only depends on inputs + an injected
 * fetcher. Exported so the unit tests can pass deterministic fakes.
 */
export async function classifyEntry(
  collection: string,
  entry: ManifestEntry,
  fetcher: FetchImpl,
  timeoutMs: number,
  now: Date = new Date()
): Promise<DriftFinding> {
  const base: Omit<
    DriftFinding,
    'classification' | 'observedSha256' | 'observedSizeBytes' | 'errorMessage'
  > = {
    collection,
    refId: entry.refId ?? entry.filename ?? entry.url,
    title: entry.title ?? '',
    url: entry.url,
    storedSha256: entry.sha256 ?? null,
    storedSizeBytes: entry.sizeBytes ?? null,
    checkedAt: now.toISOString(),
  }

  if (!entry.sha256) {
    return {
      ...base,
      classification: 'no-stored-hash',
      observedSha256: null,
      observedSizeBytes: null,
    }
  }

  let result: FetchedResource
  try {
    result = await fetcher(entry.url, timeoutMs)
  } catch (e) {
    return {
      ...base,
      classification: 'fetch-error',
      observedSha256: null,
      observedSizeBytes: null,
      errorMessage: String((e as Error).message ?? e).slice(0, 200),
    }
  }

  const observedSize = result.bytes.byteLength
  if (result.sha256 === entry.sha256) {
    return {
      ...base,
      classification: 'ok',
      observedSha256: result.sha256,
      observedSizeBytes: observedSize,
    }
  }
  // Hash mismatch: distinguish full drift (different content) from a size-
  // only mismatch (rare but informative — same byte count yet different
  // bytes is a meaningful subset of drift).
  const sizeMatched = base.storedSizeBytes !== null && base.storedSizeBytes === observedSize
  return {
    ...base,
    classification: sizeMatched ? 'size-mismatch' : 'drift',
    observedSha256: result.sha256,
    observedSizeBytes: observedSize,
  }
}

// ---------------------------------------------------------------------------
// Pool — bounded-concurrency map
// ---------------------------------------------------------------------------

/* eslint-disable no-unused-vars -- function-type parameters document the callback contract */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  /* eslint-enable no-unused-vars */
  const results: R[] = new Array(items.length)
  let cursor = 0
  async function worker(): Promise<void> {
    for (;;) {
      const idx = cursor++
      if (idx >= items.length) return
      // eslint-disable-next-line security/detect-object-injection -- idx is a monotonically increasing integer
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface RunOptions {
  publicDir: string
  outPath: string
  collections: Collection[]
  concurrency: number
  timeoutMs: number
  limit: number | null
  dryRun: boolean
  fetcher: FetchImpl
  // eslint-disable-next-line no-unused-vars -- function-type parameter
  log?: (msg: string) => void
}

export async function run(opts: RunOptions): Promise<DriftReport> {
  const log = opts.log ?? ((m: string) => console.log(m))

  const findings: DriftFinding[] = []
  for (const collection of opts.collections) {
    const manifestPath = path.join(opts.publicDir, collection, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      log(`[drift] ${collection}: manifest.json missing at ${manifestPath} — skipping`)
      continue
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Manifest
    const downloaded = manifest.entries.filter((e) => e.status === 'downloaded')
    const subset = opts.limit !== null ? downloaded.slice(0, opts.limit) : downloaded
    log(
      `[drift] ${collection}: ${downloaded.length} downloaded entries (auditing ${subset.length})`
    )
    const collectionFindings = await mapPool(subset, opts.concurrency, async (entry) => {
      const finding = await classifyEntry(collection, entry, opts.fetcher, opts.timeoutMs)
      if (finding.classification !== 'ok') {
        log(`  ${finding.classification.padEnd(15)} ${finding.refId}`)
      }
      return finding
    })
    findings.push(...collectionFindings)
  }

  const classifications: Record<DriftClassification, number> = {
    ok: 0,
    drift: 0,
    'fetch-error': 0,
    'size-mismatch': 0,
    'no-stored-hash': 0,
  }
  for (const f of findings) classifications[f.classification]++

  const report: DriftReport = {
    generatedAt: new Date().toISOString(),
    totalEntries: findings.length,
    fetched: classifications.ok + classifications.drift + classifications['size-mismatch'],
    classifications,
    findings,
  }

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(opts.outPath), { recursive: true })
    fs.writeFileSync(opts.outPath, JSON.stringify(report, null, 2) + '\n', 'utf-8')
    log(`[drift] Wrote report → ${opts.outPath}`)
  }

  log(
    `[drift] Summary: ${classifications.ok} ok, ${classifications.drift} drift, ` +
      `${classifications['size-mismatch']} size-mismatch, ` +
      `${classifications['fetch-error']} fetch-error, ` +
      `${classifications['no-stored-hash']} no-stored-hash`
  )
  return report
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseCli(process.argv)
  await run({
    publicDir: path.resolve(process.cwd(), 'public'),
    outPath: path.resolve(process.cwd(), 'public/data/reference-cache-drift.json'),
    collections: opts.collections,
    concurrency: opts.concurrency,
    timeoutMs: opts.timeoutMs,
    limit: opts.limit,
    dryRun: opts.dryRun,
    fetcher: realFetch,
  })
}

if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('audit-reference-cache-drift.ts')
) {
  main().catch((err) => {
    console.error('[drift] Unexpected error:', err)
    process.exit(2)
  })
}
