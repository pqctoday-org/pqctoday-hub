// SPDX-License-Identifier: GPL-3.0-only
// PR smoke — the VPN Simulator's idle state in plain headless Chromium.
//
// Guards two regressions visitors (and headless CI browsers) hit before
// clicking anything:
//   1. The status badge read "Loading strongSwan WASM… (Ns)" with a climbing
//      timer while nothing was loading (workers only start on Generate Certs /
//      Start Daemon).
//   2. Headless Chromium reports "HeadlessChrome/<ver>", which the browser
//      check misread as Safari, so Start Daemon stayed disabled.
// The user agent is set explicitly so the check does not depend on which UA
// the Playwright device profile happens to send. The daemon is never started:
// this spec loads no strongSwan WASM and stays fast.
import { test, expect } from './fixtures/blockAnalytics'

const HEADLESS_CHROMIUM_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36'

test.use({ userAgent: HEADLESS_CHROMIUM_UA })

test.describe('VPN Simulator idle state', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Requires Chromium')

  test('shows a ready badge (no loading timer) and enables Start Daemon', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: 'developer',
            hasAcknowledgedExecutiveGrcSplit: true,
            hasSeenPersonaPicker: true,
            selectedRegion: 'americas',
            selectedIndustries: [],
            suppressSuggestion: true,
            experienceLevel: 'expert',
            advancedViewsUnlocked: true,
          },
          version: 3,
        })
      )
      // Suppress the first-visit disclaimer overlay and the "What's New" dialog.
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })

    // Fail loudly if the idle page ever starts fetching the strongSwan WASM.
    const wasmRequests: string[] = []
    page.on('request', (req) => {
      if (/strongswan(_worker\.js|\.wasm)/.test(req.url())) wasmRequests.push(req.url())
    })

    await page.goto('/playground/vpn-sim', { waitUntil: 'domcontentloaded', timeout: 30_000 })

    const status = page.getByTestId('vpn-engine-status')
    await expect(status).toBeVisible({ timeout: 20_000 })
    await expect(status).toContainText('Ready')
    await expect(status).not.toContainText('Loading')

    const startBtn = page.getByTestId('vpn-start-daemon')
    await expect(startBtn).toBeEnabled({ timeout: 10_000 })

    // Still idle a moment later: no timer started and nothing was spawned.
    await page.waitForTimeout(1_500)
    await expect(status).toContainText('Ready')
    await expect(status).not.toContainText(/\d+s\)/)
    expect(wasmRequests).toEqual([])
  })
})
