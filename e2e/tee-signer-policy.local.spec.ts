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

const routes = ['/learn/confidential-computing?tab=workshop&step=3', '/playground/tee-channel']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`TEE sample requires its expected signing key at ${width}px on ${route}`, async ({
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
      await expectNoSeriousAxeViolations(page)
      const preset = page.getByRole('button', { name: 'Intel SGX + Thales Luna', exact: true })
      await preset.click({ timeout: 10_000 })
      await page.getByRole('button', { name: 'PQC', exact: true }).click()
      const enable = page.getByRole('button', { name: 'Enable', exact: true })
      if (await enable.isVisible()) await enable.click()
      const execute = page.getByRole('button', { name: 'Execute (Live WASM)', exact: true })
      await expect(execute).toBeVisible({ timeout: 20_000 })
      const signer = page.getByRole('combobox', { name: 'Expected sample signer' })
      const outcome = page
        .getByText('Enclave: Verify + Decap + Re-derive KEK + Unwrap', {
          exact: true,
        })
        .last()
      await expect(signer).toHaveValue('provisioning')
      await execute.click()
      await expect(outcome).toBeVisible({ timeout: 20_000 })
      await expect(
        page.getByText(/the sample uses extractable secrets during derivation/i)
      ).toBeVisible()

      await signer.selectOption('staging')
      await expect(outcome).toHaveCount(0)
      await execute.click()
      await expect(
        page.getByRole('alert').filter({ hasText: 'No provisioning key was unwrapped.' })
      ).toBeVisible()
      await expect(outcome).toHaveCount(0)

      await signer.selectOption('provisioning')
      await expect(
        page.getByText('No provisioning key was unwrapped.', { exact: false })
      ).toHaveCount(0)
      await execute.click()
      await expect(outcome).toBeVisible()
      await expectNoSeriousAxeViolations(page)
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
        .toBeLessThanOrEqual(1)
    })
  }
}
