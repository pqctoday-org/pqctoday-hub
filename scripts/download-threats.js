#!/usr/bin/env node
/**
 * scripts/download-threats.js
 *
 * Downloads PQC threat reference documents to public/threats/.
 *
 * Features:
 *  - Detects and skips generic homepage URLs (no document to fetch)
 *  - Tracks paywalled / auth-required URLs in a persistent skip list
 *    so they are never retried on subsequent runs
 *  - Writes a manifest.json with the status of every entry
 *
 * Usage:
 *   node scripts/download-threats.js
 *   node scripts/download-threats.js --dry-run   # print plan, no downloads
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src/data')
const OUTPUT_DIR = join(ROOT, 'public/threats')
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

// ─── Find the latest threats CSV ─────────────────────────────────────────────
function findLatestThreatsCSV() {
  const files = readdirSync(DATA_DIR).filter((f) =>
    /^quantum_threats_hsm_industries_\d{8}\.csv$/.test(f)
  )
  if (files.length === 0)
    throw new Error('No quantum_threats_hsm_industries_MMDDYYYY.csv found in src/data/')
  files.sort((a, b) => {
    const parse = (name) => {
      const m = name.match(/quantum_threats_hsm_industries_(\d{2})(\d{2})(\d{4})\.csv$/)
      return new Date(`${m[3]}-${m[1]}-${m[2]}`)
    }
    return parse(b) - parse(a)
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

// ─── Safe filename from threat_id ─────────────────────────────────────────────
function safeFilename(threatId) {
  return threatId.replace(/[^a-zA-Z0-9_\-.]/g, '_')
}

// ─── Check whether a cached file already exists on disk ──────────────────────
function cachedFilePath(threatId) {
  for (const ext of ['.pdf', '.html', '.txt']) {
    const p = join(OUTPUT_DIR, safeFilename(threatId) + ext)
    if (existsSync(p)) return p
  }
  return null
}

// ─── Download a single URL ────────────────────────────────────────────────────
async function downloadURL(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PQCThreatsBot/1.0 (research; contact: pqctoday@antigravity.dev)',
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
  console.log('⚠️   PQC Threats Reference Downloader')
  if (DRY_RUN) console.log('    (DRY RUN — no files will be written)\n')
  else console.log()

  if (!DRY_RUN) mkdirSync(OUTPUT_DIR, { recursive: true })

  // Load persistent skip list (URLs that previously returned auth/paywall errors)
  const skipList =
    !DRY_RUN && existsSync(SKIP_LIST_PATH) ? JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8')) : {}
  if (Object.keys(skipList).length) {
    console.log(`Loaded skip list: ${Object.keys(skipList).length} persisted entries\n`)
  }

  // Load CSV
  const csvPath = findLatestThreatsCSV()
  console.log(`Source CSV: ${csvPath.replace(ROOT + '/', '')}\n`)
  const content = readFileSync(csvPath, 'utf-8')
  const { rows } = parseCSV(content)

  const manifest = {
    generated: new Date().toISOString(),
    source: csvPath.replace(ROOT + '/', ''),
    summary: { downloaded: 0, skipped: 0, failed: 0, persisted_skip: 0 },
    entries: [],
  }

  for (const row of rows) {
    const threatId = (row.threat_id ?? '').trim()
    const url = (row.source_url ?? '').trim()
    const title = (row.main_source ?? '').trim()

    if (!threatId || !url) {
      manifest.entries.push({ threatId, url, status: 'skipped', reason: 'missing-data' })
      manifest.summary.skipped++
      continue
    }

    // Skip rows already cached on disk
    const cached = cachedFilePath(threatId)
    if (cached) {
      const rel = cached.replace(ROOT + '/', '')
      console.log(`📁  CACHED        ${threatId}  →  ${rel}`)
      manifest.entries.push({ threatId, title, url, status: 'cached', file: rel })
      manifest.summary.skipped++
      continue
    }

    // Check persistent skip list
    // eslint-disable-next-line security/detect-object-injection
    if (skipList[url]) {
      // eslint-disable-next-line security/detect-object-injection
      const reason = skipList[url].reason
      console.log(`🔒  PERSIST-SKIP  ${threatId}  (${reason})`)
      manifest.entries.push({
        threatId,
        title,
        url,
        status: 'skipped',
        reason: `persisted: ${reason}`,
      })
      manifest.summary.persisted_skip++
      manifest.summary.skipped++
      continue
    }

    // Classify URL
    const classification = classifyURL(url)
    if (classification.skip) {
      console.log(`⏭   SKIP         ${threatId}  (${classification.reason})`)
      manifest.entries.push({
        threatId,
        title,
        url,
        status: 'skipped',
        reason: classification.reason,
      })
      manifest.summary.skipped++
      continue
    }

    // Dry run — just report what would be fetched
    if (DRY_RUN) {
      console.log(`🔍  WOULD-FETCH   ${threatId}  →  ${url.substring(0, 70)}`)
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
      console.log(`${icon}  FAIL         ${threatId}  —  ${result.reason}`)

      if (isPersistent) {
        // eslint-disable-next-line security/detect-object-injection
        skipList[url] = { threatId, reason: result.reason, date: new Date().toISOString() }
        console.log(`    → Added to skip list (will not retry)`)
      }

      manifest.entries.push({
        threatId,
        title,
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
    const filename = safeFilename(threatId) + result.ext
    const outputPath = join(OUTPUT_DIR, filename)
    writeFileSync(outputPath, result.buffer)
    const sizeKB = (result.size / 1024).toFixed(1)
    console.log(`✅  OK           ${threatId}  →  ${filename}  (${sizeKB} KB)`)

    manifest.entries.push({
      threatId,
      title,
      url,
      status: 'downloaded',
      file: `public/threats/${filename}`,
      sizeBytes: result.size,
      contentType: result.contentType,
    })
    manifest.summary.downloaded++
    await sleep(DELAY_MS)
  }

  if (!DRY_RUN) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
    writeFileSync(SKIP_LIST_PATH, JSON.stringify(skipList, null, 2))
    console.log(`\nManifest:  public/threats/manifest.json`)
    console.log(`Skip list: public/threats/skip-list.json`)
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
