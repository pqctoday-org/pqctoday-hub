import { chromium, type FullConfig } from '@playwright/test'

/**
 * Warm Vite's dependency optimizer before the e2e run.
 *
 * The Playground routes (e.g. /playground/cacp) lazy-load the WASM engine shims
 * (kmip / softhsmrustv3). On a cold dev server — or the first run after the WASM
 * bundles change — Vite discovers those deps late and re-optimizes, serving a
 * transient `504 (Outdated Optimize Dep)` that the browser only recovers from on
 * reload. A test that just `goto`s once then asserts can miss that window and
 * fail spuriously ("heading not found"), even though the page is fine.
 *
 * Loading the heaviest lazy route here (reloading until it renders) forces that
 * re-optimization to complete up front, so the actual specs run against an
 * already-warm server. No-op once the optimizer cache is warm.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL
  if (!baseURL) return

  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        await page.goto(`${baseURL}/playground/cacp`, { waitUntil: 'domcontentloaded' })
        await page
          .getByRole('heading', { name: /Crypto-Agility Control Plane/i })
          .waitFor({ state: 'visible', timeout: 15000 })
        break // optimizer warm — page renders
      } catch {
        // Vite is (re)optimizing; give it a moment and reload to pick up the
        // freshly-bundled deps instead of the stale 504.
        await page.waitForTimeout(1500)
      }
    }
  } finally {
    await browser.close()
  }
}

export default globalSetup
