/// <reference lib="webworker" />
// SPDX-License-Identifier: GPL-3.0-only
// Custom Service Worker — Workbox PWA caching + Cross-Origin Isolation headers.
// Enables SharedArrayBuffer for WASM threading on GitHub Pages without server-side headers.

import { PrecacheController, cleanupOutdatedCaches } from 'workbox-precaching'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// ── Precache ───────────────────────────────────────────────────────────────
const precache = new PrecacheController()
precache.addToCacheList(self.__WB_MANIFEST)

self.addEventListener('install', (event) => {
  self.skipWaiting()
  precache.install(event)
})

self.addEventListener('activate', (event) => {
  precache.activate(event)
  event.waitUntil(Promise.all([self.clients.claim(), cleanupOutdatedCaches()]))
})

// ── Runtime caching strategies ─────────────────────────────────────────────
const dataCache = new StaleWhileRevalidate({
  cacheName: 'data-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 })],
})

// ── Runtime tiers added 2026-08-07 (Phase 4) ───────────────────────────────
// These three caches hold what used to be precached at install: 13 WASM engines
// (86 MB), 72 infographics (51 MB), and ~700 route chunks (81 MB). None of it is
// needed to render a page, so paying for all of it before the first paint meant a
// ~300 MB / 81-second install that most visits never finished — and until that
// install completed there was NO offline capability at all.
//
// CacheFirst, not StaleWhileRevalidate: every one of these URLs is content-hashed
// or versioned per deploy, so a cached copy is never stale. Fetch once, then it is
// offline-capable for good.
const wasmCache = new CacheFirst({
  cacheName: 'wasm-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })],
})

// Sized for the ~700 route chunks: a visitor who explores widely should not evict
// the chunks for routes they still use. 30 days matches a deploy cadence measured
// in days, and stale entries are unreachable anyway once the hash changes.
const chunkCache = new CacheFirst({
  cacheName: 'chunk-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 400, maxAgeSeconds: 30 * 24 * 60 * 60 })],
})

const imageCache = new CacheFirst({
  cacheName: 'image-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 })],
})

// ── Cross-Origin Isolation ─────────────────────────────────────────────────
// Inject COEP:credentialless + COOP:same-origin on every response so that
// window.crossOriginIsolated === true, enabling SharedArrayBuffer in Chrome/Edge.
// For embed paths, COOP must be unsafe-none to allow postMessage with parent frames.
function withCOIHeaders(response: Response, url?: URL): Response {
  if (!response || response.status === 0) return response
  const headers = new Headers(response.headers)

  const isEmbed = url?.pathname.startsWith('/embed/')

  headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
  headers.set('Cross-Origin-Opener-Policy', isEmbed ? 'unsafe-none' : 'same-origin')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// ── Fetch handler ──────────────────────────────────────────────────────────
// Single handler: all caching logic + COI headers on every response.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return

  const url = new URL(request.url)

  event.respondWith(
    (async (): Promise<Response> => {
      // WASM: no longer precached (Phase 4). Precache is still consulted first so
      // that anything a future config DOES precache keeps working, then CacheFirst.
      // Covers /pyodide/pyodide.asm.wasm too (Developer tabs, dev-tabs-pkcs11-kmip
      // plan P1) — no separate route needed. Pyodide's non-.wasm assets
      // (pyodide.mjs/.asm.js/-lock.json/python_stdlib.zip) deliberately fall
      // through to the network-fallback branch below: the Developer tabs are
      // online-only by design (plan §4, WS-A), so a fetch failure there should
      // surface as "needs a connection", not be masked by a cache.
      if (url.pathname.endsWith('.wasm')) {
        const precachedWasm = await precache.matchPrecache(request)
        if (precachedWasm) return withCOIHeaders(precachedWasm, url)
        return withCOIHeaders(await wasmCache.handle({ event, request }), url)
      }

      // JSON/CSV data: StaleWhileRevalidate
      if (/\/(data|dist)\/.+\.(json|csv)$/.test(url.pathname)) {
        return withCOIHeaders(await dataCache.handle({ event, request }), url)
      }

      // Archived proof documents are REAL pages, not SPA routes. They must be
      // exempt from the shell fallback below, which would otherwise answer a
      // proof link with index.html — as it has been doing, since a proof link
      // is a navigation and that check runs before the precache lookup.
      const isStandaloneDoc = /^\/migrate-proofs\/.+\.html$/.test(url.pathname)

      // Navigation (SPA): serve index.html from precache for all routes
      if (request.mode === 'navigate' && !isStandaloneDoc) {
        const cached = await precache.matchPrecache('/index.html')
        if (cached) return withCOIHeaders(cached, url)
      }

      // Precached static assets (boot JS, CSS, fonts, icons, prerendered HTML)
      const precached = await precache.matchPrecache(request)
      if (precached) return withCOIHeaders(precached, url)

      // Everything below is a deliberate precache MISS.
      //
      // Routing on the miss — rather than on a regex listing the excluded chunks —
      // is what keeps this file from drifting out of sync with vite.config.ts. The
      // config decides what is boot-critical; the worker just asks "was it
      // precached?" and routes the answer. There is no second copy of the rule to
      // maintain, and therefore no way for the two to disagree.
      if (url.origin === self.location.origin) {
        // Route chunks: everything under /assets/*.js that is not a boot chunk.
        if (/^\/assets\/.+\.js$/.test(url.pathname)) {
          return withCOIHeaders(await chunkCache.handle({ event, request }), url)
        }
        // Infographics and other images (the 8 launcher icons ARE precached and
        // were already returned above).
        if (/\.(png|jpe?g|gif|webp|avif)$/i.test(url.pathname)) {
          return withCOIHeaders(await imageCache.handle({ event, request }), url)
        }
      }

      // Network fallback
      try {
        return withCOIHeaders(await fetch(request), url)
      } catch {
        if (request.mode === 'navigate' && !isStandaloneDoc) {
          const fallback = await precache.matchPrecache('/index.html')
          if (fallback) return withCOIHeaders(fallback, url)
        }
        // A proof document that is not cached is genuinely unavailable offline.
        // Handing back the app shell would dress that up as a working page.
        return new Response('Network error', { status: 503 })
      }
    })()
  )
})
