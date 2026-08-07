#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * precache-budget.ts — guards the service-worker install payload.
 *
 * WHY THIS EXISTS
 *
 * Between 2026-03 and 2026-08 the PWA precache grew to 289 MB across 927 files
 * without a single alarm. Offline capability only exists once the install
 * COMPLETES, and at that size it took 81 seconds on desktop broadband and
 * consumed 302 MB — a third of Safari's fixed 1 GB per-origin budget. Most
 * visits never finished it, so most visitors had no offline mode at all.
 *
 * Nothing caught it because the only guard in place —
 * `injectManifest.maximumFileSizeToCacheInBytes` — is PER FILE. It cannot see
 * 927 small files adding up. It fired three times as individual chunks grew and
 * was raised each time (15 → 20 → 32 → 48 MB), which cleared the build error and
 * left the cause untouched.
 *
 * This script measures the things that actually matter: the TOTAL payload, the
 * entry COUNT, whether the app can still boot offline at all, and the size of the
 * landing page's eager JS graph.
 *
 * IF THIS FAILS, DO NOT RAISE THE BUDGET. Move the asset to a runtime cache in
 * src/sw.ts (see `wasm-cache` / `chunk-cache` / `image-cache`), or split the
 * chunk. Raising the number is how the 289 MB happened.
 *
 * Runs at the end of `npm run build`, so it checks the artifact at the moment it
 * is produced and can never be stale. CI runs `npm run build`, so CI is covered
 * without adding a separate job.
 *
 * Exit codes:
 *   0 — within budget (warnings may still be printed)
 *   1 — over budget, or the app could not boot offline from this precache
 *   2 — could not read the build output
 */
import { readFileSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

// ── Budgets ────────────────────────────────────────────────────────────────
// Set against the measured 2026-08-07 baseline of 16.6 MB / 103 entries, with
// roughly 50% headroom. These are ceilings for a BOOT SHELL — if a change needs
// more than this, the change is precaching something that is not boot-critical.
const MAX_BYTES = 25 * 1024 * 1024
const WARN_BYTES = 20 * 1024 * 1024
const MAX_ENTRIES = 150
const WARN_ENTRIES = 125

// The landing page's eager JS (index.html's modulepreload set). Measured at
// 11.17 MB after the search stack was made lazy; 15 MB leaves room without
// letting another 21 MB data chunk quietly rejoin the critical path.
const MAX_EAGER_BYTES = 15 * 1024 * 1024

const DIST = path.resolve(process.cwd(), 'dist')
const MB = (n: number) => `${(n / 1048576).toFixed(2)} MB`

function fail(msg: string, code = 1): never {
  console.error(`\n✖ ${msg}`)
  process.exit(code)
}

// ── Read the injected precache manifest out of the built worker ────────────
const swPath = path.join(DIST, 'sw.js')
if (!existsSync(swPath)) fail(`no ${swPath} — run \`npm run build\` first`, 2)
const sw = readFileSync(swPath, 'utf8')

let urls = [...sw.matchAll(/\{"?revision"?:[^}]*?"?url"?:"([^"]+)"/g)].map((m) => m[1])
if (urls.length === 0) urls = [...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map((m) => m[1])
if (urls.length === 0) {
  fail('could not parse a precache manifest out of dist/sw.js — has the SW build changed?', 2)
}

let total = 0
const sized: { url: string; bytes: number }[] = []
const missing: string[] = []
for (const url of urls) {
  const rel = url.replace(/^\//, '').split('?')[0]
  try {
    const bytes = statSync(path.join(DIST, rel)).size
    total += bytes
    sized.push({ url, bytes })
    // A 0-byte asset returns HTTP 200 and looks fine in every check except this
    // one. One shipped to production on 2026-08-03 (an empty infographic PNG).
    if (bytes === 0) missing.push(`${url} (0 bytes)`)
  } catch {
    missing.push(`${url} (not on disk)`)
  }
}

const duplicates = urls.filter((u, i) => urls.indexOf(u) !== i)

// ── Boot assertion: the entry module MUST be precached ─────────────────────
// Without this the precache can look small and healthy while being unable to
// start the app offline. `feat/bplus-programme-wave0` shipped exactly that
// config: its globIgnores excluded `assets/index-*.js`, the entry module.
const indexPath = path.join(DIST, 'index.html')
let entryOk: boolean | null = null
let entrySrc = ''
let eagerBytes = 0
let eagerCount = 0
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, 'utf8')
  const entry = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)
  if (entry) {
    entrySrc = entry[1]
    const needle = entrySrc.replace(/^\//, '')
    entryOk = urls.some((u) => u.replace(/^\//, '') === needle)
  }
  const preloads = [...html.matchAll(/rel="modulepreload"[^>]+href="([^"]+)"/g)].map((m) => m[1])
  for (const p of new Set(preloads)) {
    try {
      eagerBytes += statSync(path.join(DIST, p.replace(/^\//, ''))).size
      eagerCount++
    } catch {
      /* a preload for a file we cannot stat is reported by the missing check */
    }
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
console.log('\n── PWA precache budget ────────────────────────────────────────')
console.log(
  `  payload      ${MB(total).padStart(10)}  (warn ${MB(WARN_BYTES)}, max ${MB(MAX_BYTES)})`
)
console.log(
  `  entries      ${String(urls.length).padStart(10)}  (warn ${WARN_ENTRIES}, max ${MAX_ENTRIES})`
)
console.log(
  `  eager JS     ${MB(eagerBytes).padStart(10)}  over ${eagerCount} files (max ${MB(MAX_EAGER_BYTES)})`
)
console.log(
  `  entry chunk  ${entryOk === null ? '   (no index.html)' : entryOk ? '  precached ✔' : '  MISSING ✖'}`
)

const byExt: Record<string, { bytes: number; n: number }> = {}
for (const { url, bytes } of sized) {
  const ext = url.split('.').pop()!.split('?')[0]
  byExt[ext] ??= { bytes: 0, n: 0 }
  byExt[ext].bytes += bytes
  byExt[ext].n++
}
console.log('\n  by type:')
for (const [ext, v] of Object.entries(byExt).sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`    ${MB(v.bytes).padStart(10)}  ${String(v.n).padStart(4)}  .${ext}`)
}

const errors: string[] = []
const warnings: string[] = []

if (total > MAX_BYTES)
  errors.push(`precache payload ${MB(total)} exceeds the ${MB(MAX_BYTES)} budget`)
else if (total > WARN_BYTES)
  warnings.push(`precache payload ${MB(total)} is over the ${MB(WARN_BYTES)} warning line`)

if (urls.length > MAX_ENTRIES)
  errors.push(`precache holds ${urls.length} entries, over the ${MAX_ENTRIES} budget`)
else if (urls.length > WARN_ENTRIES)
  warnings.push(`precache holds ${urls.length} entries, over the ${WARN_ENTRIES} warning line`)

if (eagerBytes > MAX_EAGER_BYTES) {
  errors.push(
    `landing page eagerly preloads ${MB(eagerBytes)} of JS, over the ${MB(MAX_EAGER_BYTES)} budget — ` +
      `something heavy rejoined the critical path (check for a new static import in MainLayout or App)`
  )
}

if (entryOk === false) {
  errors.push(
    `the entry module ${entrySrc} is NOT in the precache — the app cannot boot offline. ` +
      `Check SHELL_SEED_MODULES and the precache-shell-allowlist plugin in vite.config.ts`
  )
}

if (duplicates.length) {
  warnings.push(
    `${new Set(duplicates).size} duplicated manifest entries: ${[...new Set(duplicates)].slice(0, 5).join(', ')}`
  )
}
if (missing.length) {
  errors.push(
    `${missing.length} precache entries are missing or empty: ${missing.slice(0, 5).join(', ')}`
  )
}

if (warnings.length) {
  console.log('')
  for (const w of warnings) console.log(`  ⚠ ${w}`)
}

if (errors.length) {
  console.log('\n  largest precached assets:')
  for (const { url, bytes } of sized.sort((a, b) => b.bytes - a.bytes).slice(0, 5)) {
    console.log(`    ${MB(bytes).padStart(10)}  ${url}`)
  }
  console.error('\n✖ PRECACHE BUDGET EXCEEDED\n')
  for (const e of errors) console.error(`  • ${e}`)
  console.error(
    '\n  DO NOT raise the budget to make this pass. Raising the per-file limit is how this\n' +
      '  codebase reached a 289 MB / 927-entry install that took 81s to activate. Move the\n' +
      '  asset to a runtime CacheFirst route in src/sw.ts, or split the chunk.\n'
  )
  process.exit(1)
}

console.log('\n✔ precache within budget\n')
