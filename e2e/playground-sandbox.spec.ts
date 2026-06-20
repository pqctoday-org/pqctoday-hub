// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

const SANDBOX_ORIGIN = 'http://localhost:4000'

// Stub the sandbox so the E2E does not require docker-compose to be running.
//  - /api/status → empty 200 (satisfies the reachability probe → "online")
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

// A sandbox scenario re-homed into the Protocol Simulations domain category.
const SANDBOX_TILE = 'OpenSSL TLS 1.3 + Composite Cert'
const PROTOCOL_SIMS_URL = '/playground?cat=Protocol%20Simulations'

test.describe('Crypto Lab Workbench — Sandbox facet', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress the blocking overlays that intercept pointer events.
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

  test('sandbox scenarios live inside a domain category, carrying a Sandbox badge', async ({
    page,
  }) => {
    await page.goto(PROTOCOL_SIMS_URL)
    // Wait for the runtime probe to settle online.
    await expect(page.getByText(/Runtime active/i)).toBeVisible({ timeout: 10000 })

    const card = page.locator('[role="button"]', { hasText: SANDBOX_TILE }).first()
    await expect(card).toBeVisible({ timeout: 10000 })
    await expect(card.getByText('Sandbox', { exact: true })).toBeVisible()
    // Online → not locked.
    await expect(card.getByText('needs runtime')).toHaveCount(0)
  })

  test('when the probe fails, sandbox scenarios stay listed but render locked', async ({
    page,
  }) => {
    // Override the stub: make /api/status fail so the probe lands 'offline'.
    await page.route(`${SANDBOX_ORIGIN}/api/status`, (route) => route.abort('failed'))
    await page.goto(PROTOCOL_SIMS_URL)

    // Sidebar hint reflects the locked runtime.
    await expect(page.getByText(/Docker scenarios locked/i)).toBeVisible({ timeout: 10000 })

    // The scenario is still in the grid (not stripped), but locked.
    const card = page.locator('[role="button"]', { hasText: SANDBOX_TILE }).first()
    await expect(card).toBeVisible()
    await expect(card.getByText('needs runtime')).toBeVisible()

    // The category surfaces an inline "Start runtime" call to action.
    await expect(page.getByRole('button', { name: 'Start runtime' })).toBeVisible()
  })

  test('opening an unlocked sandbox scenario routes to its embedded iframe', async ({ page }) => {
    await page.goto(PROTOCOL_SIMS_URL)
    await expect(page.getByText(/Runtime active/i)).toBeVisible({ timeout: 10000 })

    const card = page.locator('[role="button"]', { hasText: SANDBOX_TILE }).first()
    await card.click()

    // The detail modal opens with an "Open tool" action (not "Start runtime").
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /Open tool/i }).click()

    await expect(page).toHaveURL(/\/playground\/sbx-tls$/)
    const iframe = page.locator('iframe[data-scenario-id]')
    await expect(iframe).toBeVisible()
    await expect(iframe).toHaveAttribute(
      'src',
      new RegExp(`${SANDBOX_ORIGIN.replace(/[/.]/g, '\\$&')}/embed/scenarios/`)
    )
  })
})
