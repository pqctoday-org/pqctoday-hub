// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 1 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })
})

for (const width of [1280, 390]) {
  test(`shows learning order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/learn/pqc-algorithms')

    const strip = page.getByRole('navigation', { name: 'Where this fits' })
    await expect(strip).toBeVisible()
    await expect(strip.getByText('Stage 2', { exact: false })).toBeVisible()
    await expect(strip.getByText('Next:', { exact: true })).toBeVisible()

    if (width === 390) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => window.innerWidth)
      )
    }

    const prerequisite = strip.getByRole('link', { name: 'PQC 101' })
    await expect(prerequisite).toHaveAttribute('href', '/learn/pqc-101')
    await prerequisite.click()
    await expect(page).toHaveURL(/\/learn\/pqc-101$/)
  })
}
