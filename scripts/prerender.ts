// SPDX-License-Identifier: GPL-3.0-only
/**
 * Prerender script — generates static, crawlable HTML for every indexable route
 * using Playwright (already a devDependency).
 *
 * Runs after `vite build`. For each route it loads the built SPA in a real
 * browser, waits until React + PageMeta have injected the per-route <head> tags
 * (title, description, canonical, Open Graph, JSON-LD), then writes the fully
 * rendered HTML to dist/<route>/index.html.
 *
 * Why this matters: the app is a client-rendered SPA, so without prerendering
 * social-card scrapers and non-JS crawlers (LinkedIn, Slack, X, Facebook, Bing)
 * only ever see the generic homepage <head>. Prerendering gives each route its
 * own title, description, OG image, and body text.
 *
 * The route list is derived from ROUTE_META (the single source of truth shared
 * with the sitemap generator) so it can never drift out of sync with the app.
 */

import { chromium, type Browser, type Page } from 'playwright'
import { createServer, type Server } from 'http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { SEARCH_ROUTES, type SearchRoute } from '../src/seo/searchRoutes'
import { chromiumLaunchArgs } from './lib/chromiumLaunchArgs'
import {
  describeReadinessFailure,
  validateSnapshot,
  type ReadinessFacts,
} from './lib/prerenderChecks'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')
const CONCURRENCY = 4

/** Every supported search route. Non-indexed routes are rendered as real 200 pages too. */
const ROUTES = [...SEARCH_ROUTES]
const APP_MAJOR = Number(
  /^\d+/.exec(
    JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')).version
  )?.[0] ?? 0
)

const MIME = new Map<string, string>([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript'],
  ['.mjs', 'application/javascript'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.webmanifest', 'application/manifest+json'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.wasm', 'application/wasm'],
  ['.txt', 'text/plain'],
  ['.xml', 'application/xml'],
])

/** Minimal static server for dist/, with SPA fallback to the index.html shell. */
function createStaticServer(distDir: string): Server {
  // Capture the PRISTINE vite shell ONCE, up front. Prerendering overwrites
  // dist/index.html (with the rendered home page) and writes dist/<route>/index.html;
  // if we re-read those from disk as the SPA fallback, every route processed after
  // "/" would inherit the home page's baked <head> tags and end up with duplicate
  // canonical / og:title. Serving the in-memory shell keeps each capture isolated.
  const shell = readFileSync(join(distDir, 'index.html'))

  return createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]!)
    const ext = extname(urlPath)

    // Extensionless paths (incl. "/") are SPA routes → always serve the pristine shell.
    if (!ext) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      })
      res.end(shell)
      return
    }

    try {
      const content = readFileSync(join(distDir, urlPath))
      res.writeHead(200, {
        'Content-Type': MIME.get(ext) ?? 'application/octet-stream',
        // Mirror production headers so window.crossOriginIsolated is true and the
        // COI self-reload guard in index.html stays dormant.
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })
}

/**
 * Modulepreload links present in the pristine Vite shell — the app's REAL
 * static import graph. Populated once at startup in prerender().
 *
 * Why: Vite's runtime preload helper injects a <link rel="modulepreload">
 * into <head> for every DYNAMICALLY imported chunk (and its deps) the page
 * loads while it runs. page.content() serializes those injected links into
 * the snapshot, silently promoting every lazy chunk the route touched during
 * prerender — data CSVs included — back into every visitor's boot-blocking
 * preload set. That is exactly the "eager JS" the precache budget gate
 * measures, and it's how the gate kept failing after imports were made lazy
 * in source. Runtime-loaded chunks don't need baked preload hints: the
 * import() that loaded them during prerender loads them at runtime too.
 */
let SHELL_PRELOADS: Set<string> = new Set()

function stripRuntimeInjectedPreloads(html: string): string {
  return html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, (tag) => {
    const href = /href="([^"]+)"/.exec(tag)?.[1]
    return href !== undefined && SHELL_PRELOADS.has(href) ? tag : ''
  })
}

/**
 * Every non-root route is written twice: dist/<route>/index.html AND
 * dist/<route>.html. GitHub Pages answers `/about` with a 301 to `/about/` when
 * only the directory exists, so every sitemap URL was a redirect and every
 * canonical (which deliberately omits the slash) pointed at one — Search
 * Console reported "Page with redirect" / "Duplicate, Google chose different
 * canonical". With `about.html` present, `/about` is served directly with 200.
 */
function outputPathsFor(route: string): string[] {
  if (route === '/') return [join(DIST_DIR, 'index.html')]
  const segments = route.split('/').filter(Boolean)
  const dir = join(DIST_DIR, ...segments)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return [join(dir, 'index.html'), `${dir}.html`]
}

const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p)

/** Collect what the page shows right now, for the error message when a route never becomes ready. */
function readinessFacts(page: Page, contentRegion: string): Promise<ReadinessFacts> {
  return page.evaluate((selector) => {
    const root = document.querySelector<HTMLElement>('#root')
    const region = document.querySelector(selector)
    const text = region?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    return {
      routeMarker: root?.dataset.prerenderRoute ?? null,
      state: root?.dataset.prerenderState ?? null,
      regionFound: region !== null,
      h1Count: region?.querySelectorAll('h1').length ?? 0,
      chars: text.length,
      disclaimerOpen: document.querySelector('#disclaimer-title') !== null,
      opening: text.slice(0, 70),
    }
  }, contentRegion)
}

async function renderRoute(
  browser: Browser,
  baseUrl: string,
  route: SearchRoute
): Promise<{ chars: number; h1Count: number }> {
  const page = await browser.newPage()
  try {
    // Belt-and-suspenders: never let the COI reload guard fire mid-capture.
    await page.addInitScript((appMajor) => {
      try {
        sessionStorage.setItem('coi-reload', '1')
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: appMajor }, version: 1 })
        )
        localStorage.setItem('pqc-tour-completed', 'true')
      } catch {
        /* sandboxed storage — ignore */
      }
    }, APP_MAJOR)

    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Wait until PageMeta has hoisted THIS route's canonical into <head> — proof
    // that React rendered the route-specific metadata before we snapshot.
    await page
      .waitForFunction(
        (expected) => {
          const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
          if (!link) return false
          const got = new URL(link.href).pathname.replace(/\/$/, '') || '/'
          return got === expected
        },
        normalize(route.path),
        { timeout: 12000 }
      )
      .catch(() => {
        // Fall back to a content selector if canonical detection times out.
        return page.waitForSelector('main, [role="main"], h1', { timeout: 4000 }).catch(() => {})
      })

    try {
      await page.waitForFunction(
        ({ path, selector }) => {
          const root = document.querySelector<HTMLElement>('#root')
          return (
            root?.dataset.prerenderRoute === path &&
            root.dataset.prerenderState === 'ready' &&
            document.querySelector(selector) !== null
          )
        },
        { path: route.path, selector: route.contentRegion },
        { timeout: 30000 }
      )
    } catch (timeout) {
      // "Timeout 30000ms exceeded" does not say which condition was unmet; report what the page showed.
      const facts = await readinessFacts(page, route.contentRegion).catch(() => null)
      throw new Error(
        facts
          ? describeReadinessFailure(route, facts)
          : `route readiness never reached: the page could not be inspected (${String(timeout).split('\n')[0]})`
      )
    }

    // Let any remaining synchronous render flush.
    await page.waitForTimeout(250)

    // Strip transient portal overlays (modals, toasts, backdrops) that React
    // portals append to <body> OUTSIDE #root. Anything serialized there is a
    // dead overlay hydration can never remove — a first paint permanently
    // obscured for real visitors. Only #root and <script> tags belong in the
    // snapshot's <body>.
    await page.evaluate(() => {
      for (const el of Array.from(document.body.children)) {
        if (el.id === 'root' || el.tagName === 'SCRIPT') continue
        el.remove()
      }
    })

    const html = stripRuntimeInjectedPreloads(await page.content())
    const result = validateSnapshot(html, route)
    if (result.errors.length > 0) {
      throw new Error(result.errors.join('; '))
    }
    for (const out of outputPathsFor(route.path)) writeFileSync(out, html, 'utf-8')
    return { chars: result.chars, h1Count: result.h1Count }
  } finally {
    await page.close()
  }
}

async function prerender(): Promise<void> {
  console.log(`\n🔍 Prerendering ${ROUTES.length} routes (concurrency ${CONCURRENCY})...\n`)

  const shellHtml = readFileSync(join(DIST_DIR, 'index.html'), 'utf-8')
  SHELL_PRELOADS = new Set(
    [...shellHtml.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)].map((m) => m[1])
  )
  console.log(
    `  Shell static preloads: ${SHELL_PRELOADS.size} (runtime-injected ones will be stripped)`
  )

  const server = createStaticServer(DIST_DIR)
  const port = 41730 + Math.floor(process.pid % 1000)
  await new Promise<void>((resolve) => server.listen(port, resolve))
  const baseUrl = `http://localhost:${port}`
  console.log(`  Static server on ${baseUrl}`)

  const browser = await chromium.launch({ headless: true, args: chromiumLaunchArgs() })

  const queue = [...ROUTES]
  const failures: Array<{ route: string; error: string }> = []
  let done = 0

  async function worker(): Promise<void> {
    for (;;) {
      const route = queue.shift()
      if (route === undefined) return
      try {
        const result = await renderRoute(browser, baseUrl, route)
        console.log(
          `  ✓ ${route.path}  (${result.chars} chars, h1 ${result.h1Count})  (${++done}/${ROUTES.length})`
        )
      } catch {
        // One retry — these failures are almost always transient timeouts.
        try {
          const result = await renderRoute(browser, baseUrl, route)
          console.log(
            `  ✓ ${route.path}  (retry; ${result.chars} chars, h1 ${result.h1Count}) (${++done}/${ROUTES.length})`
          )
        } catch (err2) {
          const error = err2 instanceof Error ? err2.message : String(err2)
          failures.push({ route: route.path, error })
          console.error(`  ✗ ${route.path}: ${error}`)
          done++
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  await browser.close()
  await new Promise<void>((resolve) => server.close(() => resolve()))

  if (failures.length > 0) {
    console.error(`\n❌ Prerender failed for ${failures.length}/${ROUTES.length} route(s).\n`)
    process.exit(1)
  }
  console.log(`\n✅ Prerendered ${ROUTES.length} routes.\n`)
}

prerender().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
