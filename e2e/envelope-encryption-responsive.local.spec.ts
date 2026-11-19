// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(300)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
}

for (const width of [1280, 390]) {
  test(`envelope encryption recovers its DEK at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await page.goto('/playground/envelope-encrypt')
    const run = page.getByRole('button', { name: 'Execute (Live WASM)', exact: true })
    await expect(run).toBeVisible({ timeout: 20_000 })
    await expectNoSeriousAxeViolations(page)
    await run.focus()
    await page.keyboard.press('Space')
    await expect(page.getByText('✓ Byte-identical', { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(
      page.getByRole('heading', { name: 'Stored Envelope Blobs', exact: true })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Complete & Next', exact: true })).toBeEnabled()
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
