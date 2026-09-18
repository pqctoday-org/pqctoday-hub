// SPDX-License-Identifier: GPL-3.0-only
/**
 * Keep the LIVE site's boot chunks alive across a deploy.
 *
 * GitHub Pages replaces the whole site on every deploy and serves index.html
 * with a fixed `cache-control: max-age=600`. For up to ten minutes after a
 * release, new visitors can still receive the previous index.html — which
 * references entry/App/vendor chunks that the deploy just deleted. Result: a
 * blank page or a permanent "Initializing application modules…" splash.
 *
 * The set a stale index.html needs to BOOT is exactly what the service worker
 * precaches (vite.config.ts precacheShellAllowlist): ~35 chunks, ~15 MB. This
 * reads that set from the live sw.js and copies any chunk the new build no
 * longer produces into dist/assets/, so both generations boot. Route chunks are
 * not retained on purpose — lazyWithRetry reloads to a fresh index.html for
 * those. Keeping whole previous builds is not an option: dist/assets is ~210 MB
 * against the 1 GB Pages cap.
 *
 * Fails OPEN. A release must never be blocked because the live site was
 * unreachable; the worst case is the status quo.
 *
 *   npx tsx scripts/ci/retain-live-boot-assets.ts [--site https://…] [--dist path]
 */

import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback
}

const SITE = arg('--site', 'https://www.pqctoday.com').replace(/\/$/, '')
const DIST = resolve(arg('--dist', join(__dirname, '..', '..', 'dist')))
// Sanity ceiling well above the measured ~15 MB boot set. Tripping it means the
// precache allow-list grew into something this step was never meant to carry.
const MAX_RETAINED_BYTES = 60 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000

// Both spellings occur in the manifest: `"/assets/App-x.js"` (revision null,
// added by precacheShellAllowlist) and `"assets/index-x.css"` (globbed, with a
// revision). Only hashed JS/CSS under assets/ is a boot dependency.
const ASSET_RE = /"\/?(assets\/[A-Za-z0-9_.-]+\.(?:js|css))"/g

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'cache-control': 'no-cache' } })
  } finally {
    clearTimeout(t)
  }
}

async function main(): Promise<void> {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.log(`retain-live-boot-assets: no build at ${DIST} — skipping`)
    return
  }

  let manifestSource: string
  try {
    const res = await fetchWithTimeout(`${SITE}/sw.js`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    manifestSource = await res.text()
  } catch (err) {
    console.warn(
      `retain-live-boot-assets: could not read ${SITE}/sw.js (${String(err)}) — skipping`
    )
    return
  }

  const live = [...new Set([...manifestSource.matchAll(ASSET_RE)].map((m) => m[1]!))]
  if (live.length === 0) {
    console.warn('retain-live-boot-assets: live sw.js lists no assets/ entries — skipping')
    return
  }

  const missing = live.filter((p) => !existsSync(join(DIST, p)))
  console.log(
    `retain-live-boot-assets: live boot set ${live.length} files, ${missing.length} not in this build`
  )

  let retainedBytes = 0
  let retained = 0
  for (const p of missing) {
    let res: Response
    try {
      res = await fetchWithTimeout(`${SITE}/${p}`)
    } catch (err) {
      console.warn(`  ! ${p}: ${String(err)}`)
      continue
    }
    const type = res.headers.get('content-type') ?? ''
    // A 404 on GitHub Pages is an HTML page with a 404 status — never write that
    // (or any HTML) where a script is expected.
    if (!res.ok || type.includes('text/html')) {
      console.warn(`  ! ${p}: HTTP ${res.status} ${type} — not retained`)
      continue
    }
    const body = Buffer.from(await res.arrayBuffer())
    retainedBytes += body.length
    if (retainedBytes > MAX_RETAINED_BYTES) {
      console.warn(
        `retain-live-boot-assets: retained set would exceed ${MAX_RETAINED_BYTES / 1024 / 1024} MB — stopping`
      )
      break
    }
    const out = join(DIST, p)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, body)
    retained++
    console.log(`  + ${p} (${(statSync(out).size / 1024).toFixed(0)} KB)`)
  }

  console.log(
    `retain-live-boot-assets: retained ${retained}/${missing.length} files, ${(retainedBytes / 1024 / 1024).toFixed(1)} MB`
  )
}

main().catch((err) => {
  // Fail open — see header.
  console.warn(`retain-live-boot-assets: unexpected error, skipping: ${String(err)}`)
})
