#!/usr/bin/env tsx
/**
 * scripts/snapshot-timeline-via-playwright.ts
 *
 * Headless-browser fallback for timeline skip-list URLs that neither the
 * direct download (Akamai/WAF blocked) nor Wayback (no usable snapshot)
 * could fetch. Drives a real Chromium with a desktop UA, waits for the
 * page to settle (Cloudflare-challenge / SPA-hydration grace period),
 * snapshots the rendered HTML (or PDF binary if Content-Type is PDF).
 *
 * For each skip-list entry that does NOT already have a `localFile`, runs
 * Playwright. On success (snapshot >= MIN_PROOF_BYTES), updates the
 * skip-list entry with `localFile`, `resolved` timestamp, and an updated
 * `note`. Next `npm run download:timeline-evidence` audit-only run will
 * reclassify that row from `skipped` → `ok`.
 *
 * No CSV mutation. No mutation of entries that already have a `localFile`
 * (manual-download + Wayback recoveries are preserved).
 *
 * Usage:
 *   npx playwright install chromium                              # one-time
 *   npx tsx scripts/snapshot-timeline-via-playwright.ts
 *   npx tsx scripts/snapshot-timeline-via-playwright.ts --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { chromium, type BrowserContext } from '@playwright/test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SKIP_LIST_PATH = join(ROOT, 'public/timeline/skip-list.json')
const TIMELINE_DIR = join(ROOT, 'public/timeline')

const MIN_PROOF_BYTES = 5_000
const NAV_TIMEOUT = 90_000
const PDF_TIMEOUT = 30_000
const SETTLE_MS = 5_000
const DRY_RUN = process.argv.slice(2).includes('--dry-run')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

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

interface Result {
  url: string
  status: 'recovered' | 'still-failed' | 'too-small'
  filename?: string
  bytes?: number
  error?: string
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
    const segments = u.pathname.split('/').filter(Boolean)
    const tail = segments.length > 0 ? segments[segments.length - 1] : 'index'
    return `Playwright_${host}_${slug(tail) || 'index'}.${ext}`
  } catch {
    return `Playwright_${slug(url)}.${ext}`
  }
}

async function snapshotOne(ctx: BrowserContext, url: string): Promise<Result> {
  // PDF heuristic — fetch via the browser's HTTP stack to inherit UA/cookies.
  const isPdfHint = /\.pdf(\?|$)/i.test(url)
  if (isPdfHint) {
    try {
      const resp = await ctx.request.get(url, {
        timeout: PDF_TIMEOUT,
        headers: {
          Accept: 'application/pdf,application/octet-stream,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      if (!resp.ok()) return { url, status: 'still-failed', error: `HTTP ${resp.status()}` }
      const buf = await resp.body()
      const head = buf.subarray(0, 4).toString('binary')
      const ext: 'pdf' | 'html' = head.startsWith('%PDF') ? 'pdf' : 'html'
      const filename = derivedFilename(url, ext)
      if (!DRY_RUN) writeFileSync(join(TIMELINE_DIR, filename), buf)
      return {
        url,
        status: buf.length >= MIN_PROOF_BYTES ? 'recovered' : 'too-small',
        filename,
        bytes: buf.length,
      }
    } catch (e) {
      return { url, status: 'still-failed', error: String(e).slice(0, 120) }
    }
  }

  // HTML render path
  const page = await ctx.newPage()
  try {
    // `domcontentloaded` lets the page advance past Cloudflare's interstitial
    // and SPA bootstrap without waiting for trackers/analytics to go quiet.
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
    if (!resp || !resp.ok()) {
      await page.close()
      return { url, status: 'still-failed', error: `HTTP ${resp?.status() ?? 'no-response'}` }
    }
    // Give SPAs / WAF JS challenges a beat to settle.
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(SETTLE_MS)
    const html = await page.content()
    const filename = derivedFilename(url, 'html')
    if (!DRY_RUN) writeFileSync(join(TIMELINE_DIR, filename), html, 'utf-8')
    await page.close()
    return {
      url,
      status: html.length >= MIN_PROOF_BYTES ? 'recovered' : 'too-small',
      filename,
      bytes: html.length,
    }
  } catch (e) {
    await page.close().catch(() => {})
    return { url, status: 'still-failed', error: String(e).slice(0, 120) }
  }
}

async function main(): Promise<void> {
  if (!existsSync(SKIP_LIST_PATH)) {
    console.error(`Skip-list not found: ${SKIP_LIST_PATH}`)
    process.exit(1)
  }
  const skipList: SkipList = JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8'))
  const candidates = Object.entries(skipList).filter(([, v]) => !v.localFile)
  console.log(
    `Skip-list entries: ${Object.keys(skipList).length} total, ${candidates.length} without localFile${DRY_RUN ? ' (DRY-RUN)' : ''}`
  )

  // --disable-http2: some servers (e.g. Akamai-fronted cyber.gov.au) reject
  // browser HTTP/2 fingerprints with ERR_HTTP2_PROTOCOL_ERROR; HTTP/1.1 is
  // a softer wire that occasionally slips past.
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-http2'],
  })
  const ctx = await browser.newContext({
    userAgent: UA,
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
    },
  })

  const results: Result[] = []
  for (const [url, entry] of candidates) {
    const r = await snapshotOne(ctx, url)
    results.push(r)
    const tag = r.status === 'recovered' ? '✓' : r.status === 'too-small' ? '⚠' : '✗'
    console.log(
      `  ${tag} ${(r.bytes ?? 0).toString().padStart(7)}b  ${url.slice(0, 70)}${r.error ? ' — ' + r.error : ''}`
    )
    if (r.status === 'recovered' && !DRY_RUN && r.filename) {
      const note = `Playwright snapshot (${r.bytes}b) saved as ${r.filename}.`
      // eslint-disable-next-line security/detect-object-injection
      skipList[url] = {
        ...entry,
        localFile: r.filename,
        resolved: new Date().toISOString(),
        note: entry.note ? `${entry.note} ${note}` : note,
      }
    }
  }

  await ctx.close()
  await browser.close()

  if (!DRY_RUN) {
    writeFileSync(SKIP_LIST_PATH, JSON.stringify(skipList, null, 2) + '\n')
  }

  const recovered = results.filter((r) => r.status === 'recovered').length
  const tooSmall = results.filter((r) => r.status === 'too-small').length
  const stillFailed = results.filter((r) => r.status === 'still-failed').length
  console.log('')
  console.log(`Recovered via Playwright: ${recovered} / ${candidates.length}`)
  console.log(`Snapshot too small      : ${tooSmall}`)
  console.log(`Still failed            : ${stillFailed}`)
  if (DRY_RUN) console.log('(dry-run — skip-list and files not written)')
}

main().catch((e) => {
  console.error('snapshot-timeline-via-playwright failed:', e)
  process.exit(1)
})
