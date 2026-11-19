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
  test(`SSH real classical/PQC comparison is usable at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/playground/pqc-ssh-sim')
    await expect(
      page.getByRole('heading', { name: 'PQC SSH Simulator', level: 2, exact: true })
    ).toBeVisible({ timeout: 30_000 })
    await expectNoSeriousAxeViolations(page)

    await page.getByRole('button', { name: 'Run SSH comparison' }).click()
    await expect(page.getByText('Comparison runs finished')).toBeVisible({ timeout: 90_000 })
    await expect(page.getByText(/Classical done: connection_ok=true/)).toBeVisible()
    await expect(page.getByText(/REAL PQC done: connection_ok=true/)).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Classical (ecdsa-nistp256 + curve25519)' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'PQC (ssh-mldsa-65 + mlkem768x25519-sha256)' })
    ).toBeVisible()
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)

    const reset = page.getByRole('button', { name: /reset/i })
    await reset.focus()
    await page.keyboard.press('Space')
    await expect(page.getByText('Comparison runs finished')).toHaveCount(0)
    await expect(page.getByText(/Not executed/i).first()).toBeVisible()
    await expectNoSeriousAxeViolations(page)
  })
}
