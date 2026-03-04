#!/usr/bin/env node
/**
 * scripts/download-library.js
 *
 * Downloads PQC library reference documents to public/library/.
 *
 * Features:
 *  - Detects and skips generic homepage URLs (no document to fetch)
 *  - Tracks paywalled / auth-required URLs in a persistent skip list
 *    so they are never retried on subsequent runs
 *  - Writes a manifest.json with the status of every entry
 *  - Updates the library CSV with a `downloadable` column and a
 *    `local_file` column pointing to the saved filename
 *
 * Usage:
 *   node scripts/download-library.js
 *   node scripts/download-library.js --dry-run   # print plan, no downloads
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src/data')
const OUTPUT_DIR = join(ROOT, 'public/library')
const SKIP_LIST_PATH = join(OUTPUT_DIR, 'skip-list.json')
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json')
const DELAY_MS = 600
const DRY_RUN = process.argv.includes('--dry-run')

// ─── Generic homepage domains ────────────────────────────────────────────────
// These sites require browsing to find a specific document — the root URL
// carries no downloadable content.
const GENERIC_PORTAL_DOMAINS = new Set([
  'www.gsma.com',
  'cabforum.org',
  'standards.ieee.org',
  'www.3gpp.org',
  'www.itu.int',
  'www.gmbz.org.cn',
  'www.gb688.cn',
  'www.ccsa.org.cn',
  'www.cacrnet.org.cn',
  'www.imda.gov.sg',
  'www.cyber.gov.au',
  'cyber.gc.ca',
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
    if (fields.length < headers.length) continue
    const obj = {}
    headers.forEach((h, idx) => {
      // eslint-disable-next-line security/detect-object-injection
      obj[h.trim()] = (fields[idx] ?? '').trim()
    })
    rows.push(obj)
  }
  return { headers: headers.map((h) => h.trim()), rows }
}

// ─── CSV serialiser (quote fields that contain commas, quotes, or newlines) ──
function serializeCSV(headers, rows) {
  const quoteField = (v) => {
    const s = String(v ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
  const lines = [headers.map(quoteField).join(',')]
  for (const row of rows) {
    // eslint-disable-next-line security/detect-object-injection
    lines.push(headers.map((h) => quoteField(row[h] ?? '')).join(','))
  }
  return lines.join('\n') + '\n'
}

// ─── Find the latest library CSV ─────────────────────────────────────────────
function findLatestLibraryCSV() {
  const files = readdirSync(DATA_DIR).filter((f) => /^library_\d{8}(_r\d+)?\.csv$/.test(f))
  if (files.length === 0) throw new Error('No library_MMDDYYYY.csv found in src/data/')
  files.sort((a, b) => {
    const parse = (name) => {
      const m = name.match(/library_(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$/)
      return { date: new Date(`${m[3]}-${m[1]}-${m[2]}`), rev: m[5] ? parseInt(m[5], 10) : 0 }
    }
    const pa = parse(a)
    const pb = parse(b)
    return pb.date - pa.date || pb.rev - pa.rev
  })
  return join(DATA_DIR, files[0])
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
  if (GENERIC_PORTAL_DOMAINS.has(parsed.hostname) && pathParts.length <= 1) {
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

// ─── Safe filename from reference_id ─────────────────────────────────────────
function safeFilename(refId) {
  return refId.replace(/[^a-zA-Z0-9_\-.]/g, '_')
}

// ─── Download a single URL ────────────────────────────────────────────────────
async function downloadURL(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PQCLibraryBot/1.0 (research; contact: pqctoday@antigravity.dev)',
      Accept: 'application/pdf,text/html,*/*;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })

  const contentType = response.headers.get('content-type') ?? ''
  const ext = resolveExtension(contentType, url)

  // Detect paywall / auth patterns from status codes
  if (response.status === 401) return { ok: false, reason: 'auth-required', status: 401 }
  if (response.status === 403) return { ok: false, reason: 'forbidden', status: 403 }
  if (response.status === 402) return { ok: false, reason: 'paywall', status: 402 }
  if (!response.ok) return { ok: false, reason: `http-${response.status}`, status: response.status }

  // Heuristic: small HTML response from a paywall/login redirect
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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📚  PQC Library Document Downloader')
  if (DRY_RUN) console.log('    (DRY RUN — no files will be written)\n')
  else console.log()

  if (!DRY_RUN) mkdirSync(OUTPUT_DIR, { recursive: true })

  // Load persistent skip list (URLs that previously returned auth/paywall errors)
  const skipList = existsSync(SKIP_LIST_PATH)
    ? JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8'))
    : {}
  if (Object.keys(skipList).length) {
    console.log(`Loaded skip list: ${Object.keys(skipList).length} persisted entries\n`)
  }

  // Load CSV
  const csvPath = findLatestLibraryCSV()
  console.log(`Source CSV: ${csvPath.replace(ROOT + '/', '')}\n`)
  const content = readFileSync(csvPath, 'utf-8')
  const { headers, rows } = parseCSV(content)

  // Ensure the two new columns exist in headers
  const newHeaders = [...headers]
  if (!newHeaders.includes('downloadable')) newHeaders.push('downloadable')
  if (!newHeaders.includes('local_file')) newHeaders.push('local_file')

  const manifest = {
    generated: new Date().toISOString(),
    source: csvPath.replace(ROOT + '/', ''),
    summary: { downloaded: 0, skipped: 0, failed: 0, persisted_skip: 0 },
    entries: [],
  }

  const updatedRows = []

  for (const row of rows) {
    const refId = (row.reference_id ?? '').trim()
    const url = (row.download_url ?? '').trim()
    const title = (row.document_title ?? '').trim()

    const newRow = {
      ...row,
      downloadable: row.downloadable ?? '',
      local_file: row.local_file ?? '',
    }

    // Skip rows already fully cached on disk — avoid re-downloading 100+ existing files
    if (row.local_file && existsSync(join(ROOT, row.local_file))) {
      updatedRows.push(newRow)
      continue
    }

    if (!refId || !url) {
      newRow.downloadable = 'no-missing-data'
      manifest.entries.push({ refId, url, status: 'skipped', reason: 'missing-data' })
      manifest.summary.skipped++
      updatedRows.push(newRow)
      continue
    }

    // Check persistent skip list first
    // eslint-disable-next-line security/detect-object-injection
    if (skipList[url]) {
      // eslint-disable-next-line security/detect-object-injection
      const reason = skipList[url].reason
      console.log(`🔒  PERSIST-SKIP  ${refId}  (${reason})`)
      newRow.downloadable = `no-${reason}`
      newRow.local_file = ''
      manifest.entries.push({
        refId,
        title,
        url,
        status: 'skipped',
        reason: `persisted: ${reason}`,
      })
      manifest.summary.persisted_skip++
      manifest.summary.skipped++
      updatedRows.push(newRow)
      continue
    }

    // Classify URL
    const classification = classifyURL(url)
    if (classification.skip) {
      console.log(`⏭   SKIP         ${refId}  (${classification.reason})`)
      newRow.downloadable = classification.label
      newRow.local_file = ''
      manifest.entries.push({ refId, title, url, status: 'skipped', reason: classification.reason })
      manifest.summary.skipped++
      updatedRows.push(newRow)
      continue
    }

    // Attempt download
    if (DRY_RUN) {
      console.log(`🔍  WOULD-FETCH   ${refId}  →  ${url.substring(0, 70)}`)
      newRow.downloadable = 'pending'
      updatedRows.push(newRow)
      continue
    }

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
      console.log(`${icon}  FAIL         ${refId}  —  ${result.reason}`)

      if (isPersistent) {
        // eslint-disable-next-line security/detect-object-injection
        skipList[url] = { refId, reason: result.reason, date: new Date().toISOString() }
        console.log(`    → Added to skip list (will not retry)`)
      }

      newRow.downloadable = `no-${result.reason}`
      newRow.local_file = ''
      manifest.entries.push({
        refId,
        title,
        url,
        status: 'failed',
        reason: result.reason,
        persistent: isPersistent,
      })
      manifest.summary.failed++
      updatedRows.push(newRow)
      await sleep(DELAY_MS)
      continue
    }

    // Success — save file
    const filename = safeFilename(refId) + result.ext
    const outputPath = join(OUTPUT_DIR, filename)
    writeFileSync(outputPath, result.buffer)
    const sizeKB = (result.size / 1024).toFixed(1)
    console.log(`✅  OK           ${refId}  →  ${filename}  (${sizeKB} KB)`)

    newRow.downloadable = 'yes'
    newRow.local_file = `public/library/${filename}`
    manifest.entries.push({
      refId,
      title,
      url,
      status: 'downloaded',
      filename,
      sizeBytes: result.size,
      contentType: result.contentType,
    })
    manifest.summary.downloaded++
    updatedRows.push(newRow)
    await sleep(DELAY_MS)
  }

  if (!DRY_RUN) {
    // Write manifest
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

    // Write updated skip list
    writeFileSync(SKIP_LIST_PATH, JSON.stringify(skipList, null, 2))

    // Write to a new dated CSV — never edit in place (CLAUDE.md rule)
    const updatedCSV = serializeCSV(newHeaders, updatedRows)
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const yyyy = today.getFullYear()
    const newCsvName = `library_${mm}${dd}${yyyy}.csv`
    const newCsvPath = join(DATA_DIR, newCsvName)
    writeFileSync(newCsvPath, updatedCSV)
    console.log(`\nWrote new CSV: src/data/${newCsvName}`)
    console.log(`Manifest:      public/library/manifest.json`)
    console.log(`Skip list:     public/library/skip-list.json`)
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
