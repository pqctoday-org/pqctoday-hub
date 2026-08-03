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

// WASM engines are no longer precached at install (WS3, 2026-08-02 — see the
// injectManifest note in vite.config.ts). CacheFirst keeps repeat visits
// instant and preserves offline-after-first-use: the first visit pays the
// network cost for whichever engine that route needs, and only that one.
const wasmCache = new CacheFirst({
  cacheName: 'wasm-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })],
})

// Large route-specific JS chunks are excluded from the precache via
// globIgnores. Same treatment: cache them the first time a route pulls one in.
const chunkCache = new CacheFirst({
  cacheName: 'chunk-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 })],
})

/** Mirrors `injectManifest.globIgnores` in vite.config.ts. */
const IGNORED_CHUNK_RE = /\/assets\/(useModalPosition|patentsData|index|App)-[^/]*\.js$/

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
      // WASM files: precache first (for anything still revision-controlled),
      // then the CacheFirst `wasm-cache`, then network. Since WS3 removed
      // `wasm` from globPatterns, the second tier is now the normal path.
      // Every branch stays wrapped in withCOIHeaders — SharedArrayBuffer on
      // GitHub Pages depends on it (see the note above the wrapper).
      if (url.pathname.endsWith('.wasm')) {
        const precachedWasm = await precache.matchPrecache(request)
        if (precachedWasm) return withCOIHeaders(precachedWasm, url)
        return withCOIHeaders(await wasmCache.handle({ event, request }), url)
      }

      // Oversized route-specific JS chunks: excluded from the precache by
      // globIgnores, cached on first use so a repeat visit is still instant.
      if (IGNORED_CHUNK_RE.test(url.pathname)) {
        return withCOIHeaders(await chunkCache.handle({ event, request }), url)
      }

      // JSON/CSV data: StaleWhileRevalidate
      if (/\/(data|dist)\/.+\.(json|csv)$/.test(url.pathname)) {
        return withCOIHeaders(await dataCache.handle({ event, request }), url)
      }

      // Navigation (SPA): serve index.html from precache for all routes
      if (request.mode === 'navigate') {
        const cached = await precache.matchPrecache('/index.html')
        if (cached) return withCOIHeaders(cached, url)
      }

      // Precached static assets (JS, CSS, images, fonts)
      const precached = await precache.matchPrecache(request)
      if (precached) return withCOIHeaders(precached, url)

      // Network fallback
      try {
        return withCOIHeaders(await fetch(request), url)
      } catch {
        if (request.mode === 'navigate') {
          const fallback = await precache.matchPrecache('/index.html')
          if (fallback) return withCOIHeaders(fallback, url)
        }
        return new Response('Network error', { status: 503 })
      }
    })()
  )
})
