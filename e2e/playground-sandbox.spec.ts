// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

const SANDBOX_ORIGIN = 'http://localhost:4000'

// Stub the sandbox so the E2E does not require docker-compose to be running.
// Fulfils:
//  - /api/status → empty 200 (satisfies the reachability probe)
//  - /embed/scenarios/* → tiny HTML that posts pqc:ready immediately
async function stubSandbox(page: import('@playwright/test').Page) {
  await page.route(`${SANDBOX_ORIGIN}/api/status`, (route) =>
    route.fulfill({ status: 200, body: '{}', contentType: 'application/json' })
  )
  await page.route(`${SANDBOX_ORIGIN}/embed/scenarios/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><html><body>
        <h1>Stub Sandbox Scenario</h1>
        <script>
          window.parent.postMessage({ type: 'pqc:ready' }, '*');
          window.parent.postMessage({ type: 'pqc:resize', height: 900 }, '*');
        </script>
      </body></html>`,
    })
  )
}

test.describe('Playground — Sandbox category', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress the three blocking overlays: first-visit disclaimer, WhatsNew
    // alertdialog, and the guided tour. Any of them intercepts pointer events
    // on the playground tiles.
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await stubSandbox(page)
  })

  test('?cat=Sandbox filters the grid to sandbox tiles', async ({ page }) => {
    // PlaygroundWorkshop reads `?cat` from the URL (PlaygroundWorkshop.tsx:283),
    // so navigating directly applies the category filter without clicking
    // through the Filters popover. Default wipFilter is 'all' on non-embedded,
    // so Sandbox tiles (which are wip: true) render unconditionally.
    await page.goto('/playground?cat=Sandbox')

    const firstTile = page.locator('a[href^="/playground/sbx-"]').first()
    await expect(firstTile).toBeVisible({ timeout: 10000 })
  })

  test('when sandbox probe fails, Sandbox category + tiles disappear from the catalog', async ({
    page,
  }) => {
    // Override the beforeEach stub: make /api/status reject so the probe lands
    // in 'offline' state. Routes registered later take precedence.
    await page.route(`${SANDBOX_ORIGIN}/api/status`, (route) => route.abort('failed'))

    await page.goto('/playground')

    // Wait for the chip to settle into "Sandbox offline" so we know the probe
    // ran and state propagated to PlaygroundWorkshop's catalogTools/availableCategories.
    await page.waitForFunction(
      () => {
        return Array.from(document.querySelectorAll('button')).some((b) =>
          (b as HTMLButtonElement).innerText.includes('Sandbox offline')
        )
      },
      undefined,
      { timeout: 10000 }
    )

    // No "Sandbox" category pill (filter dropdown entry) — would render as
    // "Sandbox <count>" if present. We exclude the chip itself by requiring a digit.
    const sandboxPillCount = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      return buttons.filter((b) => /^Sandbox\s+\d/.test(b.innerText.trim())).length
    })
    expect(sandboxPillCount).toBe(0)

    // No sandbox tool tiles in the grid (sbx-* hrefs).
    const tileCount = await page.locator('a[href^="/playground/sbx-"]').count()
    expect(tileCount).toBe(0)
  })

  test('clicking a sandbox tile renders the iframe for its scenario', async ({ page }) => {
    await page.goto('/playground?cat=Sandbox')

    const firstTile = page.locator('a[href^="/playground/sbx-"]').first()
    await expect(firstTile).toBeVisible({ timeout: 10000 })
    const href = await firstTile.getAttribute('href')
    expect(href).toMatch(/^\/playground\/sbx-/)
    await firstTile.click()

    await expect(page).toHaveURL(new RegExp(`${href}$`))
    const iframe = page.locator('iframe[data-scenario-id]')
    await expect(iframe).toBeVisible()
    await expect(iframe).toHaveAttribute(
      'src',
      new RegExp(`${SANDBOX_ORIGIN.replace(/[/.]/g, '\\$&')}/embed/scenarios/`)
    )
  })
})
