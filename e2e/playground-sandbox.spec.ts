// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

const SANDBOX_ORIGIN = 'http://localhost:4000'

// Stub the sandbox so the E2E does not require docker-compose to be running.
// Fulfils:
//  - /api/status → empty 200 (satisfies the reachability probe)
//  - /embed/scenario/* → tiny HTML that posts pqc:ready immediately
async function stubSandbox(page: import('@playwright/test').Page) {
  await page.route(`${SANDBOX_ORIGIN}/api/status`, (route) =>
    route.fulfill({ status: 200, body: '{}', contentType: 'application/json' })
  )
  await page.route(`${SANDBOX_ORIGIN}/embed/scenario/**`, (route) =>
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
    // Suppress the WhatsNew toast that intercepts clicks (per CLAUDE.md E2E notes)
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await stubSandbox(page)
  })

  test('Sandbox category pill filters the grid to sandbox tiles', async ({ page }) => {
    await page.goto('/playground')
    const sandboxPill = page.getByRole('button', { name: /^Sandbox/i }).first()
    await expect(sandboxPill).toBeVisible()
    await sandboxPill.click()

    const firstTile = page.locator('a[href^="/playground/sbx-"]').first()
    await expect(firstTile).toBeVisible()
  })

  test('clicking a sandbox tile renders the iframe for its scenario', async ({ page }) => {
    await page.goto('/playground')
    const sandboxPill = page.getByRole('button', { name: /^Sandbox/i }).first()
    await sandboxPill.click()

    const firstTile = page.locator('a[href^="/playground/sbx-"]').first()
    const href = await firstTile.getAttribute('href')
    expect(href).toMatch(/^\/playground\/sbx-/)
    await firstTile.click()

    await expect(page).toHaveURL(new RegExp(`${href}$`))
    const iframe = page.locator('iframe[data-scenario-id]')
    await expect(iframe).toBeVisible()
    await expect(iframe).toHaveAttribute(
      'src',
      new RegExp(`${SANDBOX_ORIGIN.replace(/[/.]/g, '\\$&')}/embed/scenario/`)
    )
  })
})
