#!/usr/bin/env tsx
/**
 * scripts/wayback-snapshot-timeline.ts
 *
 * Fallback recovery for timeline evidence URLs that the primary download
 * script cannot fetch (WAF-blocked, TLS-incompatible, etc). Queries the
 * Wayback Machine availability API for each skip-list entry that does not
 * yet have a local file, fetches the closest archived snapshot via the
 * raw-form (`id_`) URL, and writes it to `public/timeline/` if it meets
 * MIN_PROOF_BYTES.
 *
 * Result: skip-list entries gain a `localFile` field pointing at the saved
 * snapshot. The next `npm run download:timeline-evidence` audit-only run
 * picks the file up via the existing skip-list manual-download path, and
 * those rows reclassify from `skipped` → `ok` in the manifest.
 *
 * No CSV mutation. No mutation of skip-list entries that already have a
 * `localFile` (those are the manually-sourced cases — leave them alone).
 *
 * Usage:
 *   npx tsx scripts/wayback-snapshot-timeline.ts
 *   npx tsx scripts/wayback-snapshot-timeline.ts --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SKIP_LIST_PATH = join(ROOT, 'public/timeline/skip-list.json')
const TIMELINE_DIR = join(ROOT, 'public/timeline')

const MIN_PROOF_BYTES = 5_000
const AVAILABILITY_TIMEOUT = 15_000
const SNAPSHOT_TIMEOUT = 30_000
const POLITE_DELAY_MS = 1_000
const UA = 'Mozilla/5.0 (compatible; pqctoday-timeline-archive/1.0)'
const DRY_RUN = process.argv.slice(2).includes('--dry-run')

interface SkipListEntry {
  reason: string
  note?: string
  date: string
  label?: string
  localFile?: string
  refId?: string
  resolved?: string
}

type SkipList = Record<string, SkipListEntry>

interface WaybackAvailability {
  archived_snapshots?: {
    closest?: {
      available: boolean
      url: string
      timestamp: string
      status: string
    }
  }
}

async function findClosestSnapshot(
  url: string
): Promise<{ archiveUrl: string; timestamp: string } | null> {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`
  try {
    const r = await fetch(api, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(AVAILABILITY_TIMEOUT),
    })
    if (!r.ok) return null
    const data = (await r.json()) as WaybackAvailability
    const c = data.archived_snapshots?.closest
    if (!c || !c.available || c.status !== '200') return null
    return { archiveUrl: c.url, timestamp: c.timestamp }
  } catch {
    return null
  }
}

async function fetchSnapshot(
  archiveUrl: string
): Promise<{ buf: Buffer; contentType: string } | null> {
  // Wayback raw-form URL (id_): bypasses the Wayback wrapper UI banners and
  // serves the original bytes verbatim. Wrapper form is
  //   https://web.archive.org/web/<timestamp>/<orig>
  // raw form is
  //   https://web.archive.org/web/<timestamp>id_/<orig>
  const raw = archiveUrl.replace(/\/web\/(\d{14})\//, '/web/$1id_/')
  try {
    const r = await fetch(raw, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT),
    })
    if (!r.ok) return null
    const ab = await r.arrayBuffer()
    return { buf: Buffer.from(ab), contentType: r.headers.get('content-type') ?? '' }
  } catch {
    return null
  }
}

function extensionFor(buf: Buffer, contentType: string): 'pdf' | 'html' {
  if (buf.subarray(0, 4).toString('binary') === '%PDF') return 'pdf'
  if (contentType.includes('pdf')) return 'pdf'
  return 'html'
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function derivedFilename(url: string, ext: 'pdf' | 'html'): string {
  try {
    const u = new URL(url)
    const host = slug(u.hostname)
    // Use the last meaningful path segment, or 'index' if none.
    const segments = u.pathname.split('/').filter(Boolean)
    const tail = segments.length > 0 ? segments[segments.length - 1] : 'index'
    const tailSlug = slug(tail) || 'index'
    return `Wayback_${host}_${tailSlug}.${ext}`
  } catch {
    return `Wayback_${slug(url)}.${ext}`
  }
}

interface Result {
  url: string
  outcome:
    | 'recovered'
    | 'no-snapshot'
    | 'fetch-failed'
    | 'too-small'
    | 'has-local'
    | 'manual-already'
  archiveUrl?: string
  timestamp?: string
  bytes?: number
  filename?: string
}

async function main(): Promise<void> {
  if (!existsSync(SKIP_LIST_PATH)) {
    console.error(`Skip-list not found: ${SKIP_LIST_PATH}`)
    process.exit(1)
  }
  const skipList: SkipList = JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8'))

  // Candidates: entries without a `localFile`. Manual-download entries already
  // have a file on disk — leave them alone.
  const candidates = Object.entries(skipList).filter(([, v]) => !v.localFile)
  console.log(
    `Skip-list entries: ${Object.keys(skipList).length} total, ${candidates.length} without localFile${DRY_RUN ? ' (DRY-RUN)' : ''}`
  )

  const results: Result[] = []
  for (const [url, entry] of candidates) {
    const snap = await findClosestSnapshot(url)
    if (!snap) {
      results.push({ url, outcome: 'no-snapshot' })
      console.log(`  ✗ no Wayback snapshot for ${url.slice(0, 80)}`)
      await new Promise((r) => setTimeout(r, POLITE_DELAY_MS))
      continue
    }
    const fetched = await fetchSnapshot(snap.archiveUrl)
    if (!fetched) {
      results.push({
        url,
        outcome: 'fetch-failed',
        archiveUrl: snap.archiveUrl,
        timestamp: snap.timestamp,
      })
      console.log(
        `  ✗ snapshot exists (${snap.timestamp}) but fetch failed for ${url.slice(0, 60)}`
      )
      await new Promise((r) => setTimeout(r, POLITE_DELAY_MS))
      continue
    }
    const bytes = fetched.buf.length
    if (bytes < MIN_PROOF_BYTES) {
      results.push({
        url,
        outcome: 'too-small',
        archiveUrl: snap.archiveUrl,
        timestamp: snap.timestamp,
        bytes,
      })
      console.log(`  ✗ snapshot too small (${bytes}b) for ${url.slice(0, 60)}`)
      await new Promise((r) => setTimeout(r, POLITE_DELAY_MS))
      continue
    }

    const ext = extensionFor(fetched.buf, fetched.contentType)
    const filename = derivedFilename(url, ext)
    const outAbs = join(TIMELINE_DIR, filename)

    if (!DRY_RUN) {
      writeFileSync(outAbs, fetched.buf)
      // Update skip-list entry in-memory.
      const now = new Date().toISOString()
      const note = `Wayback snapshot ${snap.timestamp} (${bytes}b) saved as ${filename}.`
      // eslint-disable-next-line security/detect-object-injection
      skipList[url] = {
        ...entry,
        localFile: filename,
        resolved: now,
        note: entry.note ? `${entry.note} ${note}` : note,
      }
    }

    results.push({
      url,
      outcome: 'recovered',
      archiveUrl: snap.archiveUrl,
      timestamp: snap.timestamp,
      bytes,
      filename,
    })
    console.log(`  ✓ ${snap.timestamp} ${bytes.toString().padStart(7)}b → ${filename}`)
    // Be polite to archive.org — 1 req/sec is well within fair-use.
    await new Promise((r) => setTimeout(r, POLITE_DELAY_MS))
  }

  if (!DRY_RUN) {
    writeFileSync(SKIP_LIST_PATH, JSON.stringify(skipList, null, 2) + '\n')
  }

  const recovered = results.filter((r) => r.outcome === 'recovered').length
  const noSnap = results.filter((r) => r.outcome === 'no-snapshot').length
  const fetchFail = results.filter((r) => r.outcome === 'fetch-failed').length
  const tooSmall = results.filter((r) => r.outcome === 'too-small').length
  console.log('')
  console.log(`Recovered via Wayback : ${recovered} / ${candidates.length}`)
  console.log(`No snapshot in archive: ${noSnap}`)
  console.log(`Snapshot fetch failed : ${fetchFail}`)
  console.log(`Snapshot too small    : ${tooSmall}`)
  if (DRY_RUN) console.log('(dry-run — skip-list and files not written)')
}

main().catch((e) => {
  console.error('wayback-snapshot-timeline failed:', e)
  process.exit(1)
})
