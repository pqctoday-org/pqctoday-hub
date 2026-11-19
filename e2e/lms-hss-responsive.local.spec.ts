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
  test(`LMS stateful signing advances safely at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 1000 })
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
      localStorage.setItem(
        'pqc-hsm-mode-storage',
        JSON.stringify({ state: { liveHsmEnabled: true }, version: 1 })
      )
    })
    await page.goto('/playground/lms-hss')
    await expect(
      page.getByRole('heading', { name: 'Stateful Hash Signatures', exact: true })
    ).toBeVisible({ timeout: 30_000 })
    await expectNoSeriousAxeViolations(page)

    const sign = page.getByRole('button', { name: 'Sign Message', exact: true })
    await sign.focus()
    await page.keyboard.press('Space')
    await expect(page.getByText('Used: 1', { exact: true })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Simulate State Loss', exact: true }).click()
    await expect(page.getByText(/ROLLBACK REFUSED/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Used: 1', { exact: true })).toBeVisible()
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
