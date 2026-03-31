#!/usr/bin/env node
/**
 * scripts/download-google-refs.js
 *
 * Downloads evidence documents from the parsed Google references manifest.
 * Uses the same conventions as download-products.js / download-library.js:
 *  - Products → public/products/{SafeName}.{ext}
 *  - Library → public/library/{SafeName}.{ext}
 *  - Timeline → public/timeline/{SafeName}.{ext}
 *  - Compliance/Policy → public/timeline/{SafeName}.{ext} (same dir as timeline)
 *
 * Supports _docN suffix for additional files when a file already exists.
 *
 * Usage:
 *   node scripts/download-google-refs.js                # download all
 *   node scripts/download-google-refs.js --dry-run      # plan only
 *   node scripts/download-google-refs.js --source migrate  # filter by target source
 *   node scripts/download-google-refs.js --limit 20     # first N records
 *   node scripts/download-google-refs.js --match exact  # only exact matches
 *   node scripts/download-google-refs.js --match fuzzy  # only fuzzy matches
 *   node scripts/download-google-refs.js --match none   # only new records
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MANIFEST_PATH = join(ROOT, 'scripts/google-refs-manifest.json')
const DELAY_MS = 600

// Output directories
const DIRS = {
  migrate: join(ROOT, 'public/products'),
  library: join(ROOT, 'public/library'),
  timeline: join(ROOT, 'public/timeline'),
  compliance: join(ROOT, 'public/timeline'), // compliance docs go to timeline dir
}

// ─── CLI args ────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run')

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1 || idx + 1 >= process.argv.length) return null
  return process.argv[idx + 1]
}

const FILTER_SOURCE = getArgValue('--source')
const FILTER_MATCH = getArgValue('--match')
const LIMIT = getArgValue('--limit') ? parseInt(getArgValue('--limit'), 10) : 0

// ─── Helpers ─────────────────────────────────────────────────────────────────
function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, '_').replace(/_+/g, '_')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function extFromContentType(ct) {
  if (!ct) return '.html'
  if (ct.includes('pdf')) return '.pdf'
  if (ct.includes('json')) return '.json'
  if (ct.includes('markdown') || ct.includes('text/plain')) return '.md'
  return '.html'
}

function findNextDocSuffix(dir, baseName, ext) {
  // If base file doesn't exist, use it directly
  const baseFile = `${baseName}${ext}`
  if (!existsSync(join(dir, baseFile))) return baseFile

  // Find next available _docN suffix
  for (let i = 1; i <= 20; i++) {
    const candidate = `${baseName}_doc${i}${ext}`
    if (!existsSync(join(dir, candidate))) return candidate
  }
  return `${baseName}_doc_google${ext}`
}

async function fetchUrl(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    return resp
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

// ─── Main download logic ─────────────────────────────────────────────────────
async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('Manifest not found. Run parse-google-references.ts first.')
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
  let records = manifest.records

  // Apply filters
  if (FILTER_SOURCE) {
    records = records.filter((r) => r.targetSources.includes(FILTER_SOURCE))
    console.log(`Filtered to source="${FILTER_SOURCE}": ${records.length} records`)
  }
  if (FILTER_MATCH) {
    records = records.filter((r) => r.matchType === FILTER_MATCH)
    console.log(`Filtered to match="${FILTER_MATCH}": ${records.length} records`)
  }
  // Filter out non-downloadable
  records = records.filter((r) => r.downloadable)
  console.log(`Downloadable records: ${records.length}`)

  if (LIMIT > 0) {
    records = records.slice(0, LIMIT)
    console.log(`Limited to first ${LIMIT} records`)
  }

  // Ensure output dirs exist
  for (const dir of Object.values(DIRS)) {
    mkdirSync(dir, { recursive: true })
  }

  const results = {
    downloaded: 0,
    skipped: 0,
    failed: 0,
    blocked: 0,
    entries: [],
  }

  // Load existing skip lists
  const skipLists = {}
  for (const [source, dir] of Object.entries(DIRS)) {
    const skipPath = join(dir, 'skip-list.json')
    if (existsSync(skipPath)) {
      try {
        skipLists[source] = JSON.parse(readFileSync(skipPath, 'utf-8'))
      } catch {
        skipLists[source] = {}
      }
    } else {
      skipLists[source] = {}
    }
  }

  for (let i = 0; i < records.length; i++) {
    const rec = records[i]
    const url = rec.evidenceUrl
    const primarySource = rec.targetSources[0]
    const dir = DIRS[primarySource] || DIRS.migrate

    // Check skip list
    if (skipLists[primarySource]?.[url]) {
      const reason = skipLists[primarySource][url].reason
      console.log(`  [SKIP] ${rec.productName} — ${reason}`)
      results.skipped++
      results.entries.push({
        productName: rec.productName,
        url,
        status: 'skipped',
        reason,
        matchType: rec.matchType,
        existingMatch: rec.existingMatch,
      })
      continue
    }

    // Determine filename based on match type
    let baseName
    if (rec.matchType === 'exact' && rec.existingMatch) {
      baseName = safeFilename(rec.existingMatch)
    } else if (rec.matchType === 'fuzzy' && rec.existingMatch) {
      baseName = safeFilename(rec.existingMatch)
    } else {
      baseName = safeFilename(rec.productName)
    }

    if (DRY_RUN) {
      const ext = url.toLowerCase().endsWith('.pdf') ? '.pdf' : '.html'
      const filename = findNextDocSuffix(dir, baseName, ext)
      console.log(
        `  [DRY] ${rec.productName} → ${dir.replace(ROOT + '/', '')}/${filename} (${rec.matchType})`
      )
      results.entries.push({
        productName: rec.productName,
        url,
        status: 'would-fetch',
        filename,
        matchType: rec.matchType,
        existingMatch: rec.existingMatch,
        targetDir: dir.replace(ROOT + '/', ''),
      })
      continue
    }

    // Fetch the URL
    try {
      console.log(`  [${i + 1}/${records.length}] ${rec.productName} ...`)
      const resp = await fetchUrl(url)

      if (resp.status === 403 || resp.status === 401) {
        console.log(`    BLOCKED (${resp.status}) — adding to skip list`)
        skipLists[primarySource][url] = {
          name: rec.productName,
          reason: resp.status === 403 ? 'forbidden' : 'auth-required',
          date: new Date().toISOString(),
        }
        results.blocked++
        results.entries.push({
          productName: rec.productName,
          url,
          status: 'blocked',
          reason: `http-${resp.status}`,
          matchType: rec.matchType,
          existingMatch: rec.existingMatch,
        })
        await sleep(DELAY_MS)
        continue
      }

      if (!resp.ok) {
        console.log(`    FAILED (${resp.status})`)
        results.failed++
        results.entries.push({
          productName: rec.productName,
          url,
          status: 'failed',
          reason: `http-${resp.status}`,
          matchType: rec.matchType,
        })
        await sleep(DELAY_MS)
        continue
      }

      const ct = resp.headers.get('content-type') || ''
      const ext = extFromContentType(ct)
      const filename = findNextDocSuffix(dir, baseName, ext)
      const filePath = join(dir, filename)

      const body = ct.includes('pdf') ? Buffer.from(await resp.arrayBuffer()) : await resp.text()

      // Check for paywall/login redirect heuristic
      if (typeof body === 'string' && body.length < 5000) {
        const lower = body.toLowerCase()
        if (
          (lower.includes('sign in') || lower.includes('log in') || lower.includes('login')) &&
          !lower.includes('post-quantum') &&
          !lower.includes('pqc')
        ) {
          console.log(`    PAYWALL detected — skipping`)
          skipLists[primarySource][url] = {
            name: rec.productName,
            reason: 'paywall-redirect',
            date: new Date().toISOString(),
          }
          results.blocked++
          results.entries.push({
            productName: rec.productName,
            url,
            status: 'blocked',
            reason: 'paywall-redirect',
            matchType: rec.matchType,
          })
          await sleep(DELAY_MS)
          continue
        }
      }

      writeFileSync(filePath, body)
      const size = typeof body === 'string' ? Buffer.byteLength(body) : body.length
      console.log(`    OK → ${filename} (${(size / 1024).toFixed(1)}KB)`)
      results.downloaded++
      results.entries.push({
        productName: rec.productName,
        url,
        status: 'downloaded',
        filename,
        sizeBytes: size,
        contentType: ct.split(';')[0],
        matchType: rec.matchType,
        existingMatch: rec.existingMatch,
        targetDir: dir.replace(ROOT + '/', ''),
      })
    } catch (err) {
      console.log(`    ERROR: ${err.message}`)
      results.failed++
      results.entries.push({
        productName: rec.productName,
        url,
        status: 'failed',
        reason: err.message,
        matchType: rec.matchType,
      })
    }

    await sleep(DELAY_MS)
  }

  // Save updated skip lists
  if (!DRY_RUN) {
    for (const [source, skipData] of Object.entries(skipLists)) {
      const dir = DIRS[source]
      if (dir && Object.keys(skipData).length > 0) {
        writeFileSync(join(dir, 'skip-list.json'), JSON.stringify(skipData, null, 2))
      }
    }
  }

  // Save download report
  const report = {
    generated: new Date().toISOString(),
    source: 'scripts/google-refs-manifest.json',
    dryRun: DRY_RUN,
    summary: {
      total: records.length,
      downloaded: results.downloaded,
      skipped: results.skipped,
      failed: results.failed,
      blocked: results.blocked,
    },
    entries: results.entries,
  }

  const reportPath = join(ROOT, 'scripts/google-refs-download-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n═══ Download Summary ═══`)
  console.log(`Total:      ${records.length}`)
  console.log(`Downloaded: ${results.downloaded}`)
  console.log(`Skipped:    ${results.skipped}`)
  console.log(`Failed:     ${results.failed}`)
  console.log(`Blocked:    ${results.blocked}`)
  console.log(`Report:     ${reportPath}`)

  // List blocked URLs for manual download
  const blocked = results.entries.filter((e) => e.status === 'blocked')
  if (blocked.length > 0) {
    console.log(`\n── URLs needing manual download (${blocked.length}) ──`)
    for (const b of blocked) {
      console.log(`  ${b.productName}: ${b.url} (${b.reason})`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
