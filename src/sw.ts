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
const wasmCache = new CacheFirst({
  cacheName: 'wasm-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 })],
})

const dataCache = new StaleWhileRevalidate({
  cacheName: 'data-cache',
  plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 })],
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
      // WASM files: CacheFirst (large, rarely change)
      if (url.pathname.endsWith('.wasm')) {
        return withCOIHeaders(await wasmCache.handle({ event, request }), url)
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
