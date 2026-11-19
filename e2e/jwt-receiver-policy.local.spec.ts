// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(350)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
}

const routes = ['/learn/api-security-jwt?tab=workshop', '/playground/api-security-jwt?step=1']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`JWT receiver checks the configured algorithm at ${width}px on ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(route)
      if (route.startsWith('/learn/')) {
        await page.getByRole('button', { name: /^Step 2: PQC JWT Signing/ }).click()
      }
      await expectNoSeriousAxeViolations(page)
      await page.getByRole('button', { name: 'Generate Keypair', exact: true }).click()
      await page.getByRole('button', { name: 'Sign JWT with ML-DSA-65' }).click()
      await page.getByRole('button', { name: 'Verify (noble)', exact: true }).click()
      await expect(page.getByText('Signature valid · noble', { exact: true })).toBeVisible()
      const receiver = page.getByRole('region', { name: 'Check the receiver’s signature policy' })
      await expect(receiver).toBeVisible()
      const decision = receiver.getByRole('status', { name: 'Receiver signature decision' })
      const allowed = receiver.getByRole('combobox', { name: 'Permitted receiver algorithm' })
      const check = receiver.getByRole('button', { name: 'Check token signature policy' })
      await allowed.selectOption('ML-DSA-44')
      await check.click()
      await expect(decision).toContainText(
        'Signature policy rejected ML-DSA-65. This receiver permits ML-DSA-44.'
      )
      await allowed.selectOption('ML-DSA-65')
      await expect(decision).toBeEmpty()
      await check.click()
      await expect(decision).toContainText(
        'The ML-DSA-65 signature meets the sample receiver’s algorithm policy and verifies.'
      )
      await expectNoSeriousAxeViolations(page)
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
        .toBeLessThanOrEqual(1)
    })
  }
}
