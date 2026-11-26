// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Keep the previous release's hashed files alive across a deploy.
 *
 * GitHub Pages replaces the whole site on every deploy. A visitor (or the edge,
 * which serves index.html with `max-age=600`) can still hold the PREVIOUS
 * release's page for a while after a release. That page asks for files by hashed
 * name; if the deploy deleted them the server answers 404 with an HTML page and
 * the page shows "Failed to fetch dynamically imported module". Two groups:
 *
 *   1. The boot chunks (what the previous service worker precached, read from the
 *      live sw.js) — without them the page cannot start at all.
 *   2. Every other hashed file under assets/ of the previous release — the lazily
 *      loaded split files a page asks for as the visitor navigates.
 *
 * This copies every such file that the new build no longer produces into
 * dist/assets/, for ONE release back:
 *
 *   - The release writes `release-assets.json` at the site root. It lists what
 *     the release itself BUILT (`built`) and what it carried over (`carried`).
 *   - The next release reads the live `built` list and carries only those files.
 *     The live `carried` list is ignored, so a file is kept for exactly one
 *     release and the site cannot grow without bound.
 *   - When the live site has no such file yet (the first release that runs this
 *     step) the previous release's files are found by following the references
 *     from the live index.html and sw.js through the live JS and CSS.
 *
 * It runs after `npm run build`, on the finished dist/. It never edits sw.js, so
 * nothing it adds enters the service worker precache.
 *
 * Bounded: at most MAX_RETAINED_BYTES are carried (the boot chunks first).
 *
 * Fails OPEN. A release must never be blocked because the live site was
 * unreachable; the worst case is the status quo. Every file is checked before it
 * is written: an HTML answer (a 404 page, a captive portal) is never saved where
 * a script is expected.
 *
 *   npx tsx scripts/ci/retain-live-boot-assets.ts [--site https://…] [--dist path]
 *                                                 [--dry-run] [--max-mb 150]
 *
 * `--dry-run` writes nothing and prints what would be carried.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Name of the per-release file list, at the site root. */
export const MANIFEST_NAME = 'release-assets.json'
/** Upper bound on bytes carried from the previous release (boot chunks first). */
export const MAX_RETAINED_BYTES = 150 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000
const CONCURRENCY = 6

/** A hashed file directly under assets/, e.g. `assets/LearnSection-q9K9GvJ_.js`. */
const SAFE_ASSET = /^assets\/[A-Za-z0-9_.@-]+\.[A-Za-z0-9]+$/
// Both spellings occur in the sw.js manifest: `"/assets/App-x.js"` (revision null,
// added by precacheShellAllowlist) and `"assets/index-x.css"` (globbed, with a
// revision).
const SW_ASSET_RE = /"\/?(assets\/[A-Za-z0-9_.-]+\.(?:js|css))"/g
// References inside the live JS/CSS: `"assets/X-hash.js"` (the preload map),
// `import("./X-hash.js")`, `url(/assets/X-hash.woff2)`. A hashed name is
// `<name>-<8 chars>.<ext>`; a stray match is harmless, it simply fails to fetch.
const REF_RE =
  /(?:\.\/|\/?assets\/)([A-Za-z0-9_.@-]+-[A-Za-z0-9_-]{8}\.(?:m?js|css|wasm|png|jpe?g|webp|avif|gif|svg|woff2?|ttf|json|csv|txt|bin|onnx))(?![A-Za-z0-9_.-])/g
const SCANNED_EXT = /\.(?:m?js|css)$/

export interface RetainOptions {
  site: string
  dist: string
  maxBytes?: number
  dryRun?: boolean
  log?: (message: string) => void
}

export interface RetainResult {
  /** Files under assets/ that this build produced. */
  built: string[]
  /** Previous-release files copied (or, in a dry run, that would be copied). */
  carried: string[]
  carriedBytes: number
  /** Where the previous release's list came from. */
  source: 'manifest' | 'crawl' | 'none'
  skipped: string[]
  stoppedAtLimit: boolean
}

interface Fetched {
  body: Buffer
  contentType: string
}

function listAssets(dist: string): string[] {
  const dir = join(dist, 'assets')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => statSync(join(dir, n)).isFile())
    .map((n) => `assets/${n}`)
    .sort()
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'cache-control': 'no-cache' } })
  } finally {
    clearTimeout(t)
  }
}

/** True when the bytes are an HTML document (a GitHub Pages 404, a portal page). */
function looksLikeHtml(body: Buffer): boolean {
  const head = body.subarray(0, 512).toString('utf8').trimStart().toLowerCase()
  return head.startsWith('<!doctype html') || head.startsWith('<html')
}

/** One fetch of a hashed asset; returns null (and says why) when it must not be kept. */
async function fetchAsset(
  site: string,
  name: string,
  log: (m: string) => void
): Promise<Fetched | null> {
  // One retry for a network error or a 5xx (a measured live run saw one transient
  // 503); a 404 is final.
  let res: Response | undefined
  let failure = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetchWithTimeout(`${site}/${name}`)
      if (res.status < 500) break
      failure = `HTTP ${res.status}`
    } catch (err) {
      res = undefined
      failure = String(err)
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 500))
  }
  if (!res || res.status >= 500) {
    log(`  ! ${name}: ${failure} — not retained`)
    return null
  }
  const contentType = res.headers.get('content-type') ?? ''
  // A 404 on GitHub Pages is an HTML page with a 404 status — never write that
  // (or any HTML) where a script is expected.
  if (!res.ok || contentType.includes('text/html')) {
    log(`  ! ${name}: HTTP ${res.status} ${contentType} — not retained`)
    return null
  }
  const body = Buffer.from(await res.arrayBuffer())
  if (body.length === 0 || looksLikeHtml(body)) {
    log(`  ! ${name}: ${body.length === 0 ? 'empty body' : 'HTML body'} — not retained`)
    return null
  }
  return { body, contentType }
}

async function fetchText(url: string): Promise<{ status: number; text: string } | null> {
  try {
    const res = await fetchWithTimeout(url)
    return { status: res.status, text: res.ok ? await res.text() : '' }
  } catch {
    return null
  }
}

/** Run `fn` over `items` with a small pool. */
async function pool<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      await fn(items[i]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
}

function readOwnManifest(dist: string): { built: string[]; carried: string[] } | null {
  try {
    const parsed = JSON.parse(readFileSync(join(dist, MANIFEST_NAME), 'utf8')) as {
      built?: unknown
      carried?: unknown
    }
    if (!Array.isArray(parsed.built)) return null
    const names = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((n): n is string => typeof n === 'string' && SAFE_ASSET.test(n))
        : []
    return { built: names(parsed.built), carried: names(parsed.carried) }
  } catch {
    return null
  }
}

function writeManifest(dist: string, built: string[], carried: string[]): void {
  const body = { schema: 1, built: [...built].sort(), carried: [...carried].sort() }
  writeFileSync(join(dist, MANIFEST_NAME), JSON.stringify(body, null, 2) + '\n')
}

export async function retainLiveAssets(opts: RetainOptions): Promise<RetainResult> {
  const site = opts.site.replace(/\/$/, '')
  const dist = resolve(opts.dist)
  const maxBytes = opts.maxBytes ?? MAX_RETAINED_BYTES
  const dryRun = opts.dryRun ?? false
  const log = opts.log ?? ((m: string) => console.log(m))
  const result: RetainResult = {
    built: [],
    carried: [],
    carriedBytes: 0,
    source: 'none',
    skipped: [],
    stoppedAtLimit: false,
  }

  if (!existsSync(join(dist, 'index.html'))) {
    log(`retain-live-assets: no build at ${dist} — skipping`)
    return result
  }

  // What THIS release built. Reuse an existing list if the step is re-run on a dist
  // that already carries files, so carried files are never mistaken for built ones.
  const own = readOwnManifest(dist)
  const built = own?.built ?? listAssets(dist)
  const priorCarried = (own?.carried ?? []).filter((n) => existsSync(join(dist, n)))
  result.built = built
  if (!dryRun) {
    try {
      writeManifest(dist, built, priorCarried)
    } catch (err) {
      log(`retain-live-assets: could not write ${MANIFEST_NAME}: ${String(err)}`)
    }
  }

  const stamp = `?_=${Date.now()}`

  // 1. Boot chunks: the live service worker's precache list.
  const boot: string[] = []
  const sw = await fetchText(`${site}/sw.js${stamp}`)
  if (!sw || sw.status !== 200) {
    log(
      `retain-live-assets: could not read ${site}/sw.js (${sw ? `HTTP ${sw.status}` : 'unreachable'})`
    )
  } else {
    boot.push(...new Set([...sw.text.matchAll(SW_ASSET_RE)].map((m) => m[1]!)))
  }

  // 2. The previous release's own file list.
  const bodies = new Map<string, Buffer>() // fetched during a crawl, kept for writing
  const sizes = new Map<string, number>()
  const wanted: string[] = []
  const have = (name: string) => existsSync(join(dist, name))

  const manifestRes = await fetchText(`${site}/${MANIFEST_NAME}${stamp}`)
  let previous: string[] | null = null
  if (manifestRes && manifestRes.status === 200) {
    try {
      const parsed = JSON.parse(manifestRes.text) as { built?: unknown }
      if (Array.isArray(parsed.built)) {
        previous = parsed.built.filter(
          (n): n is string => typeof n === 'string' && SAFE_ASSET.test(n)
        )
      }
    } catch {
      previous = null
    }
  }

  if (previous) {
    result.source = 'manifest'
    for (const n of [...boot, ...previous]) if (!wanted.includes(n)) wanted.push(n)
    log(
      `retain-live-assets: live release lists ${previous.length} built files; boot set ${boot.length}`
    )
  } else {
    // First release with this step (or the list is unreadable): follow references.
    const index = await fetchText(`${site}/${stamp}`)
    if (!index || index.status !== 200) {
      if (boot.length === 0) {
        log(
          'retain-live-assets: neither the live file list nor the live page could be read — skipping'
        )
        return result
      }
    }
    result.source = 'crawl'
    const queue: string[] = []
    const seen = new Set<string>()
    const enqueue = (n: string) => {
      if (SAFE_ASSET.test(n) && !seen.has(n)) {
        seen.add(n)
        queue.push(n)
      }
    }
    for (const n of boot) enqueue(n)
    if (index && index.status === 200) {
      for (const m of index.text.matchAll(/(?:href|src)="\/?(assets\/[A-Za-z0-9_.@-]+)"/g)) {
        enqueue(m[1]!)
      }
    }
    let crawled = 0
    let bytes = 0
    // Breadth-first, in rounds, so the pool can fetch several files at once.
    while (queue.length > 0 && !result.stoppedAtLimit) {
      const round = queue.splice(0, queue.length)
      await pool(round, async (name) => {
        let text: string | null = null
        if (have(name)) {
          // Same name, same bytes: scan the local copy, nothing to download.
          if (SCANNED_EXT.test(name)) text = readFileSync(join(dist, name), 'utf8')
          wanted.push(name)
        } else {
          if (!dryRun && bytes > maxBytes) return
          const got = await fetchAsset(site, name, log)
          if (!got) return
          bytes += got.body.length
          sizes.set(name, got.body.length)
          wanted.push(name)
          if (SCANNED_EXT.test(name)) text = got.body.toString('utf8')
          if (!dryRun) bodies.set(name, got.body)
        }
        crawled++
        if (text) for (const m of text.matchAll(REF_RE)) enqueue(`assets/${m[1]!}`)
      })
      if (!dryRun && bytes > maxBytes) result.stoppedAtLimit = true
    }
    log(`retain-live-assets: followed live references to ${crawled} files`)
  }

  wanted.sort()
  const missing = wanted.filter((n) => !have(n))
  log(
    `retain-live-assets: ${wanted.length} files in the previous release, ${missing.length} not in this build`
  )

  // Boot chunks first, then the rest, so the cap drops the least important ones.
  const bootSet = new Set(boot)
  missing.sort((a, b) => Number(bootSet.has(b)) - Number(bootSet.has(a)) || (a < b ? -1 : 1))

  let carriedBytes = 0
  await (async () => {
    // Sequential accounting keeps the cap exact and the output stable.
    for (const name of missing) {
      let body = bodies.get(name)
      let size = sizes.get(name)
      if (!body && size === undefined) {
        const got = await fetchAsset(site, name, log)
        if (!got) {
          result.skipped.push(name)
          continue
        }
        body = got.body
        size = got.body.length
      }
      size ??= body?.length ?? 0
      if (carriedBytes + size > maxBytes) {
        result.stoppedAtLimit = true
        log(
          `retain-live-assets: carrying more would exceed ${(maxBytes / 1048576).toFixed(0)} MB — stopping`
        )
        break
      }
      carriedBytes += size
      result.carried.push(name)
      if (!dryRun && body) {
        const out = join(dist, name)
        mkdirSync(dirname(out), { recursive: true })
        writeFileSync(out, body)
      }
    }
  })()
  result.carriedBytes = carriedBytes

  if (!dryRun) {
    try {
      writeManifest(dist, built, [...new Set([...priorCarried, ...result.carried])])
    } catch (err) {
      log(`retain-live-assets: could not update ${MANIFEST_NAME}: ${String(err)}`)
    }
  }
  log(
    `retain-live-assets: ${dryRun ? 'would carry' : 'carried'} ${result.carried.length}/${missing.length} files, ${(carriedBytes / 1048576).toFixed(1)} MB (${result.source})`
  )
  return result
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback
}

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url))
  try {
    await retainLiveAssets({
      site: arg('--site', 'https://www.pqctoday.com'),
      dist: arg('--dist', join(here, '..', '..', 'dist')),
      maxBytes: Number(arg('--max-mb', '150')) * 1024 * 1024,
      dryRun: process.argv.includes('--dry-run'),
    })
  } catch (err) {
    // Fail open — see header.
    console.warn(`retain-live-assets: unexpected error, skipping: ${String(err)}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main()
}
