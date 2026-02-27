#!/usr/bin/env node
/**
 * scripts/download-timeline.js
 *
 * Downloads PQC timeline source documents to public/timeline/.
 *
 * Features:
 *  - Reads the latest timeline_MMDDYYYY.csv and fetches every SourceUrl
 *  - Generates filenames from Country_OrgName_Title (slugified)
 *  - Skips generic homepage URLs (no specific document to fetch)
 *  - Persists paywall/auth failures in a skip list so they are never retried
 *  - Writes a manifest.json with the status of every entry
 *  - Idempotent: re-running skips already-downloaded files
 *
 * Usage:
 *   node scripts/download-timeline.js
 *   node scripts/download-timeline.js --dry-run   # print plan, no downloads
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src/data')
const OUTPUT_DIR = join(ROOT, 'public/timeline')
const SKIP_LIST_PATH = join(OUTPUT_DIR, 'skip-list.json')
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json')
const DELAY_MS = 600
const DRY_RUN = process.argv.includes('--dry-run')

// ─── Generic homepage domains ─────────────────────────────────────────────────
// These sites require browsing to find a specific document — the root URL
// carries no downloadable content.
const GENERIC_PORTAL_DOMAINS = new Set([
  'www.ibm.com',
  'www.microsoft.com',
  'www.gsma.com',
  'www.3gpp.org',
  'www.itu.int',
  'www.nukib.cz',
  'www.tec.gov.in',
  'www.nca.gov.sa',
  'nacsa.gov.my',
])

// ─── CSV parser (quote-aware) ─────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(content) {
  const lines = content.split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const line = lines[i].trim()
    if (!line) continue
    const fields = parseCSVLine(line)
    const obj = {}
    headers.forEach((h, idx) => {
      // eslint-disable-next-line security/detect-object-injection
      obj[h.trim()] = (fields[idx] ?? '').trim()
    })
    rows.push(obj)
  }
  return { headers: headers.map((h) => h.trim()), rows }
}

// ─── Find the latest timeline CSV ─────────────────────────────────────────────
function findLatestTimelineCSV() {
  const files = readdirSync(DATA_DIR).filter((f) => /^timeline_\d{8}\.csv$/.test(f))
  if (files.length === 0) throw new Error('No timeline_MMDDYYYY.csv found in src/data/')
  files.sort((a, b) => {
    const parse = (name) => {
      const m = name.match(/timeline_(\d{2})(\d{2})(\d{4})\.csv$/)
      return new Date(`${m[3]}-${m[1]}-${m[2]}`)
    }
    return parse(b) - parse(a)
  })
  return join(DATA_DIR, files[0])
}

// ─── Safe filename from Country + OrgName + Title ────────────────────────────
function safeFilename(country, orgName, title) {
  const slug = `${country}_${orgName}_${title}`
    .replace(/[^a-zA-Z0-9_\-. ]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
  return slug
}

// ─── Classify a URL before attempting download ────────────────────────────────
function classifyURL(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return { skip: true, reason: 'invalid-url', label: 'no-invalid-url' }
  }
  const pathParts = parsed.pathname.split('/').filter(Boolean)
  if (GENERIC_PORTAL_DOMAINS.has(parsed.hostname) && pathParts.length <= 2) {
    return { skip: true, reason: 'generic-portal', label: 'no-homepage' }
  }
  if (pathParts.length === 0) {
    return { skip: true, reason: 'root-homepage', label: 'no-homepage' }
  }
  return { skip: false }
}

// ─── Determine file extension from response ───────────────────────────────────
function resolveExtension(contentType = '', url = '') {
  if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) return '.pdf'
  if (contentType.includes('text/html')) return '.html'
  if (contentType.includes('text/plain')) return '.txt'
  return '.html'
}

// ─── Download a single URL ────────────────────────────────────────────────────
async function downloadURL(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PQCTimelineBot/1.0 (research; contact: pqctoday@antigravity.dev)',
      Accept: 'application/pdf,text/html,*/*;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })

  const contentType = response.headers.get('content-type') ?? ''
  const ext = resolveExtension(contentType, url)

  if (response.status === 401) return { ok: false, reason: 'auth-required', status: 401 }
  if (response.status === 403) return { ok: false, reason: 'forbidden', status: 403 }
  if (response.status === 402) return { ok: false, reason: 'paywall', status: 402 }
  if (!response.ok) return { ok: false, reason: `http-${response.status}`, status: response.status }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (ext === '.html' && buffer.length < 3_000) {
    const text = buffer.toString('utf-8').toLowerCase()
    if (
      text.includes('login') ||
      text.includes('sign in') ||
      text.includes('access denied') ||
      text.includes('subscription') ||
      text.includes('paywall')
    ) {
      return { ok: false, reason: 'paywall-redirect', status: response.status }
    }
  }

  return { ok: true, buffer, ext, contentType, size: buffer.length }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Deduplicate URLs (multiple events may share a source URL) ────────────────
function deduplicateByUrl(rows) {
  const seen = new Map()
  const result = []
  for (const row of rows) {
    const url = row.SourceUrl?.trim()
    if (!url) continue
    if (!seen.has(url)) {
      seen.set(url, row)
      result.push(row)
    }
  }
  return result
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📅  PQC Timeline Document Downloader')
  if (DRY_RUN) console.log('    (DRY RUN — no files will be written)\n')
  else console.log()

  if (!DRY_RUN) mkdirSync(OUTPUT_DIR, { recursive: true })

  // Load persistent skip list
  const skipList =
    !DRY_RUN && existsSync(SKIP_LIST_PATH) ? JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8')) : {}
  if (Object.keys(skipList).length) {
    console.log(`Loaded skip list: ${Object.keys(skipList).length} persisted entries\n`)
  }

  // Load CSV
  const csvPath = findLatestTimelineCSV()
  console.log(`Source CSV: ${csvPath.replace(ROOT + '/', '')}\n`)
  const content = readFileSync(csvPath, 'utf-8')
  const { rows } = parseCSV(content)

  // Deduplicate by URL (many events share a single source PDF)
  const uniqueRows = deduplicateByUrl(rows)
  console.log(`Timeline rows: ${rows.length} total, ${uniqueRows.length} unique URLs\n`)

  const manifest = {
    generated: new Date().toISOString(),
    source: csvPath.replace(ROOT + '/', ''),
    summary: { downloaded: 0, skipped: 0, failed: 0, persisted_skip: 0 },
    entries: [],
  }

  for (const row of uniqueRows) {
    const country = (row.Country ?? '').trim()
    const orgName = (row.OrgName ?? '').trim()
    const title = (row.Title ?? '').trim()
    const url = (row.SourceUrl ?? '').trim()

    const label = `${country}:${orgName} — ${title.slice(0, 50)}`

    if (!url) {
      manifest.entries.push({ label, url: '', status: 'skipped', reason: 'no-url' })
      manifest.summary.skipped++
      continue
    }

    // Derive filename without extension (extension determined after response)
    const baseFilename = safeFilename(country, orgName, title)
    const htmlPath = join(OUTPUT_DIR, baseFilename + '.html')
    const pdfPath = join(OUTPUT_DIR, baseFilename + '.pdf')

    // Skip if already downloaded
    if (!DRY_RUN && (existsSync(htmlPath) || existsSync(pdfPath))) {
      const existing = existsSync(pdfPath) ? pdfPath : htmlPath
      console.log(`⏭   EXISTS       ${label.slice(0, 70)}`)
      manifest.entries.push({
        label,
        url,
        status: 'skipped',
        reason: 'already-exists',
        file: existing.replace(ROOT + '/', ''),
      })
      manifest.summary.skipped++
      continue
    }

    // Check persistent skip list
    // eslint-disable-next-line security/detect-object-injection
    if (!DRY_RUN && skipList[url]) {
      // eslint-disable-next-line security/detect-object-injection
      const reason = skipList[url].reason
      console.log(`🔒  PERSIST-SKIP  ${label.slice(0, 70)}  (${reason})`)
      manifest.entries.push({ label, url, status: 'skipped', reason: `persisted: ${reason}` })
      manifest.summary.persisted_skip++
      manifest.summary.skipped++
      continue
    }

    // Classify URL
    const classification = classifyURL(url)
    if (classification.skip) {
      console.log(`⏭   SKIP         ${label.slice(0, 70)}  (${classification.reason})`)
      manifest.entries.push({ label, url, status: 'skipped', reason: classification.reason })
      manifest.summary.skipped++
      continue
    }

    // Dry run
    if (DRY_RUN) {
      console.log(`🔍  WOULD-FETCH   ${label.slice(0, 70)}`)
      console.log(`                 ${url.slice(0, 80)}`)
      continue
    }

    // Attempt download
    let result
    try {
      result = await downloadURL(url)
    } catch (err) {
      result = { ok: false, reason: `network-error: ${err.message}` }
    }

    if (!result.ok) {
      const isPersistent = ['auth-required', 'forbidden', 'paywall', 'paywall-redirect'].includes(
        result.reason
      )
      const icon = isPersistent ? '🔒' : '❌'
      console.log(`${icon}  FAIL         ${label.slice(0, 70)}  —  ${result.reason}`)

      if (isPersistent) {
        // eslint-disable-next-line security/detect-object-injection
        skipList[url] = { label, reason: result.reason, date: new Date().toISOString() }
      }

      manifest.entries.push({
        label,
        url,
        status: 'failed',
        reason: result.reason,
        persistent: isPersistent,
      })
      manifest.summary.failed++
      await sleep(DELAY_MS)
      continue
    }

    // Success — save file
    const filename = baseFilename + result.ext
    const outputPath = join(OUTPUT_DIR, filename)
    writeFileSync(outputPath, result.buffer)
    const sizeKB = (result.size / 1024).toFixed(1)
    console.log(`✅  OK           ${label.slice(0, 70)}  (${sizeKB} KB)`)

    manifest.entries.push({
      label,
      url,
      status: 'downloaded',
      file: `public/timeline/${filename}`,
      sizeBytes: result.size,
      contentType: result.contentType,
    })
    manifest.summary.downloaded++
    await sleep(DELAY_MS)
  }

  if (!DRY_RUN) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
    writeFileSync(SKIP_LIST_PATH, JSON.stringify(skipList, null, 2))
    console.log(`\nManifest: public/timeline/manifest.json`)
    console.log(`Skip list: public/timeline/skip-list.json`)
  }

  console.log('\n──────────────────────────────────────────────────')
  console.log(`✅  Downloaded      : ${manifest.summary.downloaded}`)
  console.log(`⏭   Skipped        : ${manifest.summary.skipped}`)
  console.log(`   (of which 🔒 persistent skips: ${manifest.summary.persisted_skip})`)
  console.log(`❌  Failed          : ${manifest.summary.failed}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
