// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS3's gating check — the precache split must not cost cross-origin isolation.
 *
 * `src/sw.ts` injects COEP: credentialless + COOP: same-origin on EVERY response
 * so `crossOriginIsolated === true` and SharedArrayBuffer works on GitHub Pages
 * without server headers. WS3 changed what the worker caches, and every new code
 * path (the CacheFirst wasm-cache and chunk-cache routes) had to stay wrapped in
 * `withCOIHeaders`. If one did not, SharedArrayBuffer silently dies and every
 * threaded WASM lab breaks — a failure that no unit test and no a11y spec sees,
 * because the page still renders fine.
 *
 * `/embed/` is the deliberate exception: COOP must be `unsafe-none` there so
 * postMessage to a parent frame keeps working.
 */
import { test, expect } from '@playwright/test'

// Serial: three contexts racing to install the same worker against one preview
// server is a source of flake that tells you nothing about the code under test.
test.describe.configure({ mode: 'serial' })

/**
 * Get the page under the service worker's control.
 *
 * The first load only *registers* the worker; `withCOIHeaders` starts applying
 * on a later navigation, once the worker is active and has claimed the client.
 * So poll for activation and reload until `controller` is set, rather than
 * assuming a single extra navigation is enough — that assumption made an earlier
 * version of this spec skip every assertion, which reads as green and proves
 * nothing.
 */
async function activateServiceWorker(page: import('@playwright/test').Page, url: string) {
  await page.goto(url, { waitUntil: 'load' })
  for (let attempt = 0; attempt < 15; attempt++) {
    if (await page.evaluate(() => !!navigator.serviceWorker.controller)) return true
    // Real wall-clock time matters here: install → activate → clients.claim() is
    // asynchronous inside the worker, and polling without waiting just reloads
    // faster than the worker can come up.
    await page.waitForTimeout(1_000)
    await page.goto(url, { waitUntil: 'load' })
  }
  return page.evaluate(() => !!navigator.serviceWorker.controller)
}

test('a normal route stays cross-origin isolated with SharedArrayBuffer usable', async ({
  page,
}) => {
  const controlled = await activateServiceWorker(page, '/playground')
  // Not skipped: if the worker never takes control, COI injection never happens
  // and the whole mechanism is broken — that is a failure, not an inconclusive.
  expect(controlled, 'service worker never took control of the page').toBe(true)

  const state = await page.evaluate(() => ({
    isolated: window.crossOriginIsolated,
    sab: typeof SharedArrayBuffer !== 'undefined',
  }))

  // Both halves matter: the symbol existing without isolation is not usable.
  expect(state.isolated, 'crossOriginIsolated must stay true after the WS3 precache split').toBe(
    true
  )
  expect(state.sab, 'SharedArrayBuffer must remain available').toBe(true)
})

test('a WASM asset is served with COI headers even though it is no longer precached', async ({
  page,
}) => {
  // The whole point of the change: WASM now comes from network or wasm-cache
  // rather than the install-time precache. Either way it must arrive with the
  // isolation headers, or a threaded engine cannot instantiate.
  const controlled = await activateServiceWorker(page, '/playground')
  expect(controlled, 'service worker never took control of the page').toBe(true)

  const headers = await page.evaluate(async () => {
    const res = await fetch('/wasm/openssl.wasm', { method: 'GET' })
    return {
      ok: res.ok,
      coep: res.headers.get('cross-origin-embedder-policy'),
      coop: res.headers.get('cross-origin-opener-policy'),
    }
  })

  expect(headers.ok).toBe(true)
  expect(headers.coep).toBe('credentialless')
  expect(headers.coop).toBe('same-origin')
})

test('embed paths keep COOP unsafe-none so postMessage still works', async ({ page }) => {
  const controlled = await activateServiceWorker(page, '/playground')
  expect(controlled, 'service worker never took control of the page').toBe(true)

  const coop = await page.evaluate(async () => {
    const res = await fetch('/embed/', { method: 'GET' })
    return res.headers.get('cross-origin-opener-policy')
  })
  expect(coop).toBe('unsafe-none')
})
