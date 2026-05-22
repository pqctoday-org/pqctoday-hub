#!/usr/bin/env tsx
/**
 * scripts/download-timeline-evidence.ts
 *
 * Mirrors the threats-evidence pattern for the Timeline page: every active
 * timeline CSV row is paired with an on-disk electronic-evidence file under
 * `public/timeline/` and a manifest entry under
 * `public/timeline/evidence/manifest.json`.
 *
 * Modes:
 *   --audit-only    (default) verify existing local_file paths on disk; no
 *                   network calls; no new evidence files written. Manifest
 *                   is still emitted.
 *   --fetch-missing fetch SourceUrl for rows where local_file is blank or
 *                   the file doesn't exist on disk. Honours concurrency 4.
 *   --full          fetch every row regardless of disk state.
 *
 * Run via:
 *   npm run download:timeline-evidence            # audit-only (default)
 *   npm run download:timeline-evidence -- --fetch-missing
 *   npm run download:timeline-evidence -- --full
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'fs'
import { createHash } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CSV_PATH = join(ROOT, 'src/data/timeline_05172026.csv')
const OUTPUT_DIR = join(ROOT, 'public/timeline')
const MANIFEST_DIR = join(OUTPUT_DIR, 'evidence')
const MANIFEST_PATH = join(MANIFEST_DIR, 'manifest.json')

const CONCURRENCY = 4
const TIMEOUT_MS = 20_000
const USER_AGENT = 'pqctoday-hub timeline-evidence/1.0'

// ─── Mode resolution ──────────────────────────────────────────────────────────

type Mode = 'audit-only' | 'fetch-missing' | 'full'

function resolveMode(argv: string[]): Mode {
  if (argv.includes('--full')) return 'full'
  if (argv.includes('--fetch-missing')) return 'fetch-missing'
  return 'audit-only'
}

const MODE: Mode = resolveMode(process.argv.slice(2))

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawTimelineRow {
  Country: string
  OrgName: string
  StartYear: string
  Title: string
  SourceUrl: string
  local_file: string
  source_url_quality: string
  confidence_score: string
  status: string
  deprecated_at: string
}

type DownloadStatus = 'ok' | 'paywall' | 'error' | 'missing' | 'no_url' | 'skipped'

interface TimelineManifestEntry {
  row_key: string
  country: string
  org: string
  title: string
  start_year: number
  source_url: string
  source_url_quality: string | null
  confidence_score: number | null
  csv_local_file: string | null
  resolved_local_file: string | null
  download_status: DownloadStatus
  content_type: string | null
  size_bytes: number | null
  http_status: number | null
  error_message: string | null
  downloaded_at: string
  pre_existed: boolean
}

interface TimelineManifest {
  generated_at: string
  source_csv: string
  total_rows: number
  active_rows: number
  status_counts: Record<DownloadStatus, number>
  entries: TimelineManifestEntry[]
}

// ─── Slug / row-key helpers ───────────────────────────────────────────────────

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 8)
}

function rowKey(country: string, org: string, startYear: number, title: string, url: string): string {
  return `TL-${slug(country)}-${slug(org)}-${startYear}-${shortHash(title + url)}`
}

// File-name convention matches the existing public/timeline/*.html|*.pdf set:
// `{Country}_{OrgName}_{Title}.{ext}` with non-alphanumerics → `_`, collapsed.
function safeBase(country: string, org: string, title: string): string {
  return `${country}_${org}_${title}`
    .replace(/[^a-zA-Z0-9_\-. ]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120)
}

function extFromContentType(ct: string | null): string {
  if (!ct) return '.bin'
  const lower = ct.toLowerCase()
  if (lower.includes('application/pdf')) return '.pdf'
  if (lower.includes('text/html')) return '.html'
  if (lower.includes('text/plain')) return '.txt'
  return '.bin'
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

interface FetchResult {
  ok: boolean
  status: number | null
  contentType: string | null
  buffer: Buffer | null
  errorMessage: string | null
}

async function fetchOnce(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/pdf,text/html,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const contentType = response.headers.get('content-type')
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        contentType,
        buffer: null,
        errorMessage: `HTTP ${response.status}`,
      }
    }
    const buf = Buffer.from(await response.arrayBuffer())
    return { ok: true, status: response.status, contentType, buffer: buf, errorMessage: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: null, contentType: null, buffer: null, errorMessage: message }
  }
}

async function fetchWithRetry(url: string): Promise<FetchResult> {
  const first = await fetchOnce(url)
  // Retry 5xx once.
  if (!first.ok && first.status !== null && first.status >= 500 && first.status < 600) {
    return fetchOnce(url)
  }
  return first
}

function classifyHttp(status: number | null): 'ok' | 'paywall' | 'error' {
  if (status === null) return 'error'
  if (status >= 200 && status < 300) return 'ok'
  if (status === 401 || status === 402 || status === 403) return 'paywall'
  return 'error'
}

// ─── Concurrency runner ───────────────────────────────────────────────────────

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (_item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function run(): Promise<void> {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      // eslint-disable-next-line security/detect-object-injection
      results[i] = await worker(items[i])
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => run())
  await Promise.all(workers)
  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface ProcessedRow {
  row: RawTimelineRow
  country: string
  org: string
  title: string
  startYear: number
  sourceUrl: string
}

async function processRow(p: ProcessedRow): Promise<TimelineManifestEntry> {
  const { row, country, org, title, startYear, sourceUrl } = p
  const csvLocalFile = row.local_file?.trim() || null
  const sourceUrlQuality = row.source_url_quality?.trim() || null
  const confidenceScore = row.confidence_score ? Number(row.confidence_score) : null

  const key = rowKey(country, org, startYear, title, sourceUrl || '')
  const nowIso = new Date().toISOString()

  // Check what's on disk for the CSV-declared path.
  let resolvedLocalFile: string | null = null
  let preExisted = false
  let onDiskBytes: number | null = null
  let onDiskCt: string | null = null

  if (csvLocalFile) {
    const abs = join(ROOT, csvLocalFile)
    if (existsSync(abs)) {
      try {
        const st = statSync(abs)
        if (st.isFile()) {
          resolvedLocalFile = csvLocalFile
          preExisted = true
          onDiskBytes = st.size
          if (csvLocalFile.endsWith('.pdf')) onDiskCt = 'application/pdf'
          else if (csvLocalFile.endsWith('.html')) onDiskCt = 'text/html'
          else if (csvLocalFile.endsWith('.txt')) onDiskCt = 'text/plain'
        }
      } catch {
        // fall through to missing
      }
    }
  }

  // Decide what to do based on mode.
  const shouldFetch =
    MODE === 'full' ||
    (MODE === 'fetch-missing' && !resolvedLocalFile && sourceUrl)

  if (!sourceUrl) {
    return {
      row_key: key,
      country,
      org,
      title,
      start_year: startYear,
      source_url: '',
      source_url_quality: sourceUrlQuality,
      confidence_score: confidenceScore,
      csv_local_file: csvLocalFile,
      resolved_local_file: resolvedLocalFile,
      download_status: resolvedLocalFile ? 'ok' : 'no_url',
      content_type: onDiskCt,
      size_bytes: onDiskBytes,
      http_status: null,
      error_message: resolvedLocalFile ? null : 'CSV row has no SourceUrl',
      downloaded_at: nowIso,
      pre_existed: preExisted,
    }
  }

  if (!shouldFetch) {
    // Audit-only path: report based purely on disk state.
    return {
      row_key: key,
      country,
      org,
      title,
      start_year: startYear,
      source_url: sourceUrl,
      source_url_quality: sourceUrlQuality,
      confidence_score: confidenceScore,
      csv_local_file: csvLocalFile,
      resolved_local_file: resolvedLocalFile,
      download_status: resolvedLocalFile ? 'ok' : csvLocalFile ? 'missing' : 'missing',
      content_type: onDiskCt,
      size_bytes: onDiskBytes,
      http_status: null,
      error_message: resolvedLocalFile
        ? null
        : csvLocalFile
          ? `CSV local_file path missing on disk: ${csvLocalFile}`
          : 'CSV local_file is blank',
      downloaded_at: nowIso,
      pre_existed: preExisted,
    }
  }

  // --fetch-missing or --full: do network.
  const result = await fetchWithRetry(sourceUrl)
  const classification = classifyHttp(result.status)

  if (classification === 'ok' && result.buffer) {
    const ext = extFromContentType(result.contentType)
    const base = safeBase(country, org, title)
    const filename = `${base}${ext}`
    const outRel = `public/timeline/${filename}`
    const outAbs = join(ROOT, outRel)
    try {
      writeFileSync(outAbs, result.buffer)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        row_key: key,
        country,
        org,
        title,
        start_year: startYear,
        source_url: sourceUrl,
        source_url_quality: sourceUrlQuality,
        confidence_score: confidenceScore,
        csv_local_file: csvLocalFile,
        resolved_local_file: resolvedLocalFile,
        download_status: 'error',
        content_type: result.contentType,
        size_bytes: null,
        http_status: result.status,
        error_message: `write failed: ${message}`,
        downloaded_at: nowIso,
        pre_existed: preExisted,
      }
    }
    return {
      row_key: key,
      country,
      org,
      title,
      start_year: startYear,
      source_url: sourceUrl,
      source_url_quality: sourceUrlQuality,
      confidence_score: confidenceScore,
      csv_local_file: csvLocalFile,
      resolved_local_file: outRel,
      download_status: 'ok',
      content_type: result.contentType,
      size_bytes: result.buffer.length,
      http_status: result.status,
      error_message: null,
      downloaded_at: nowIso,
      pre_existed: false,
    }
  }

  return {
    row_key: key,
    country,
    org,
    title,
    start_year: startYear,
    source_url: sourceUrl,
    source_url_quality: sourceUrlQuality,
    confidence_score: confidenceScore,
    csv_local_file: csvLocalFile,
    resolved_local_file: resolvedLocalFile,
    download_status: classification === 'paywall' ? 'paywall' : 'error',
    content_type: result.contentType,
    size_bytes: null,
    http_status: result.status,
    error_message: result.errorMessage,
    downloaded_at: nowIso,
    pre_existed: preExisted,
  }
}

async function main(): Promise<void> {
  console.log(`Timeline evidence pipeline — mode: ${MODE}`)
  console.log(`Source CSV: ${CSV_PATH.replace(ROOT + '/', '')}`)

  if (!existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`)
    process.exit(1)
  }

  const content = readFileSync(CSV_PATH, 'utf-8')
  const { data } = Papa.parse<RawTimelineRow>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  const allRows = data.filter((r): r is RawTimelineRow => !!r && !!r.Country)
  const activeRows = allRows.filter((r) => {
    const status = (r.status ?? '').trim().toLowerCase()
    return status !== 'deprecated'
  })

  console.log(`Rows: ${allRows.length} total, ${activeRows.length} active`)

  mkdirSync(MANIFEST_DIR, { recursive: true })

  const processed: ProcessedRow[] = activeRows.map((row) => {
    const country = (row.Country ?? '').trim()
    const org = (row.OrgName ?? '').trim()
    const title = (row.Title ?? '').trim()
    const startYear = Number.parseInt((row.StartYear ?? '0').trim(), 10) || 0
    const sourceUrl = (row.SourceUrl ?? '').trim()
    return { row, country, org, title, startYear, sourceUrl }
  })

  const entries: TimelineManifestEntry[] = await runWithConcurrency(
    processed,
    CONCURRENCY,
    (p) => processRow(p)
  )

  const statusCounts: Record<DownloadStatus, number> = {
    ok: 0,
    paywall: 0,
    error: 0,
    missing: 0,
    no_url: 0,
    skipped: 0,
  }
  for (const e of entries) {
    statusCounts[e.download_status] += 1
  }

  const manifest: TimelineManifest = {
    generated_at: new Date().toISOString(),
    source_csv: CSV_PATH.replace(ROOT + '/', ''),
    total_rows: allRows.length,
    active_rows: activeRows.length,
    status_counts: statusCounts,
    entries,
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')

  console.log('')
  console.log('Status counts:')
  for (const [k, v] of Object.entries(statusCounts)) {
    console.log(`  ${k.padEnd(8)} ${v}`)
  }
  console.log('')
  console.log(`Manifest: ${MANIFEST_PATH.replace(ROOT + '/', '')}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
