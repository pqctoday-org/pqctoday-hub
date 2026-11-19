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
  test(`multi-algorithm JWT signing recovers at ${width}px`, async ({ page }) => {
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
    await page.goto('/playground/token-migration')
    const sign = page.getByRole('button', { name: 'Sign Token (Live WASM)', exact: true })
    const verify = page.getByRole('button', { name: 'Verify Signature (Live WASM)', exact: true })
    const change = page.getByRole('checkbox', { name: /Change received subject/ })
    await expect(sign).toBeEnabled({ timeout: 20_000 })
    await expectNoSeriousAxeViolations(page)

    await page.getByRole('button', { name: 'Algorithm:' }).click()
    await page.getByRole('option', { name: /^ML-DSA-65/ }).click()
    await expect(verify).toBeDisabled()
    await sign.click()
    await expect(page.getByText(/Signed via PKCS#11/)).toBeVisible()
    await verify.click()
    await expect(page.getByText('Signature verified', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Signed via PKCS#11 v3.2 — 3,309 bytes', { exact: true })
    ).toBeVisible()

    await change.check()
    await expect(page.getByText('Signature verified', { exact: true })).toHaveCount(0)
    await verify.click()
    await expect(page.getByText('Signature did not verify', { exact: true })).toBeVisible()
    await change.uncheck()
    await verify.click()
    await expect(page.getByText('Signature verified', { exact: true })).toBeVisible()
    await expectNoSeriousAxeViolations(page)

    await page.getByRole('button', { name: 'Disable', exact: true }).focus()
    await page.keyboard.press('Space')
    await expect(verify).toBeDisabled()
    await expect(page.getByText(/Signed via PKCS#11/)).toHaveCount(0)
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
