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
  test(`HSM capacity plan allocates and adds redundancy at ${width}px`, async ({ page }) => {
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
    })
    await page.goto('/playground/hsm-capacity')
    await expect(
      page.getByRole('heading', { name: 'HSM workload and capacity explorer' })
    ).toBeVisible()
    await expectNoSeriousAxeViolations(page)
    await page.getByLabel('Number of sites').fill('3')
    const redundancy = page.getByRole('button', { name: 'Local redundancy per site' })
    await redundancy.click()
    await page.getByRole('option', { name: '2N', exact: true }).click()
    await expect(page.getByText(/selected setting is 2N/)).toBeVisible()
    await expect(page.getByText(/Total fleet = 3 × \d+ = \d+ HSMs/)).toBeVisible()
    await redundancy.click()
    await page.getByRole('option', { name: 'N+1', exact: true }).click()
    await expect(page.getByText(/selected setting is N\+1/)).toBeVisible()
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
