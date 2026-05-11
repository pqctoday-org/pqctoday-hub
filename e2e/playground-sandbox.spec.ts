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

  // Sandbox tools all carry `wip: true` (workshopRegistry SANDBOX_TOOLS) and
  // PlaygroundWorkshop hides WIP tools by default. The toggle isn't persisted,
  // so the test must click it before filtering. From 'hide' one click → 'all'.
  // The button shows "WIP hidden" in hide mode (with a Wrench icon).
  async function unhideWipTools(page: import('@playwright/test').Page): Promise<void> {
    // The WIP-hidden button is in a filter row that may be off-screen on smaller
    // viewports. Dispatch the click event directly — the React onClick handler
    // runs regardless of pointer/visibility checks.
    await page.waitForFunction(
      () => {
        return Array.from(document.querySelectorAll('button')).some((b) =>
          (b as HTMLButtonElement).innerText.trim().startsWith('WIP hidden')
        )
      },
      undefined,
      { timeout: 10000 }
    )
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const wipBtn = buttons.find((b) => b.innerText.trim().startsWith('WIP hidden'))
      wipBtn?.click()
    })
  }

  /** Click the desktop "Sandbox" category pill via the same JS-dispatch trick
   *  used for the WIP toggle. There are multiple "Sandbox"-text buttons (desktop
   *  pill + mobile pill). Match by class signature so we hit the pill, not a tool tile. */
  async function selectSandboxCategory(page: import('@playwright/test').Page): Promise<void> {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const pill = buttons.find((b) => /^Sandbox\s*\d/.test(b.innerText.trim()))
      pill?.click()
    })
  }

  test('Sandbox category pill filters the grid to sandbox tiles', async ({ page }) => {
    // Stay on a single page session: unhide WIP first (sets local React state),
    // then click the Sandbox pill to apply the category filter. A second
    // `page.goto` would remount PlaygroundWorkshop and reset wipFilter.
    await page.goto('/playground')
    await unhideWipTools(page)
    await selectSandboxCategory(page)

    const firstTile = page.locator('a[href^="/playground/sbx-"]').first()
    await expect(firstTile).toBeVisible({ timeout: 10000 })
  })

  test('clicking a sandbox tile renders the iframe for its scenario', async ({ page }) => {
    await page.goto('/playground')
    await unhideWipTools(page)
    await selectSandboxCategory(page)

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
      new RegExp(`${SANDBOX_ORIGIN.replace(/[/.]/g, '\\$&')}/embed/scenario/`)
    )
  })
})
