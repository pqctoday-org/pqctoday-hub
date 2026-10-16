// SPDX-License-Identifier: AGPL-3.0-only
// Deep links that must land on their target, not just on the right page:
//   - /about#about-data-foundation scrolls to the Platform Data section;
//   - /openssl?cmd=genpkey opens the Workbench with genpkey selected;
//   - /algorithms?tab=validation&section=kat lands on the KAT section header.
// The app scrolls inside its own content container (the parent of
// #main-content), not the window, so offsets are measured against that
// container. Run against the production build:
//   npm run build && npx playwright test e2e/talk-deeplinks.spec.ts

import { test, expect } from './fixtures/blockAnalytics'
import type { Page } from '@playwright/test'

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

/** Seed a returning reader: disclaimer accepted, What's New already seen. */
async function seedReturningReader(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 1 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })
}

/**
 * The target's top edge relative to the top of the scroll container, read once
 * it has stopped moving (smooth scrolls and late-rendering sections settle).
 */
async function settledOffset(page: Page, selector: string): Promise<number> {
  await page.locator(selector).first().waitFor({ state: 'attached' })
  let last = Number.NaN
  let stableSince = Date.now()
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const offset = await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      const container = document.getElementById('main-content')?.parentElement
      if (!el || !container) return Number.NaN
      return Math.round(el.getBoundingClientRect().top - container.getBoundingClientRect().top)
    }, selector)
    if (offset !== last) {
      last = offset
      stableSince = Date.now()
    } else if (Date.now() - stableSince > 1000) {
      return offset
    }
    await page.waitForTimeout(100)
  }
  return last
}

for (const viewport of VIEWPORTS) {
  test.describe(`deep links land on their target at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })
    test.beforeEach(async ({ page }) => seedReturningReader(page))

    test('/about#about-data-foundation scrolls to the Platform Data section', async ({ page }) => {
      await page.goto('/about#about-data-foundation')
      const offset = await settledOffset(page, '#about-data-foundation')
      test.info().annotations.push({ type: 'offset', description: String(offset) })
      expect(offset).toBeGreaterThanOrEqual(0)
      expect(offset).toBeLessThanOrEqual(300)
    })

    test('/openssl?cmd=genpkey opens the Workbench with genpkey selected', async ({ page }) => {
      await page.goto('/openssl?cmd=genpkey')
      const workbenchTab = page.getByRole('tab', { name: 'Workbench', exact: true })
      await expect(workbenchTab).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByRole('tab', { name: 'Learn', exact: true })).toHaveAttribute(
        'aria-selected',
        'false'
      )
      await expect(page.getByText(/openssl genpkey/).first()).toBeVisible()
    })

    test('/algorithms?tab=validation&section=kat lands on the KAT section header', async ({
      page,
    }) => {
      await page.goto('/algorithms?tab=validation&section=kat')
      await expect(page.getByRole('tab', { name: /validation/i }).first()).toHaveAttribute(
        'aria-selected',
        'true'
      )
      const offset = await settledOffset(page, '[data-deeplink-id="validation-kat"]')
      test.info().annotations.push({ type: 'offset', description: String(offset) })
      expect(offset).toBeGreaterThanOrEqual(0)
      expect(offset).toBeLessThanOrEqual(300)
    })
  })
}
