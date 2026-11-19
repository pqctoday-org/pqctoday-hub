// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the live token reports which PKCS #11 mechanism can sign at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/hsm-pqc?tab=workshop')
    const sample = page.getByRole('region', { name: 'Check which mechanism can sign' })
    await expect(sample).toBeVisible()
    const lookup = sample.getByLabel('Mechanism to look up')
    const check = sample.getByRole('button', { name: 'Check signing support' })
    const output = sample.getByRole('status', { name: 'Token signing capability' })
    await expect(check).toBeDisabled()
    await page.getByRole('radio', { name: 'Rust', exact: true }).check()
    await page.getByRole('button', { name: 'Enable', exact: true }).click()
    await expect(check).toBeEnabled({ timeout: 25_000 })

    await lookup.selectOption({ label: 'CKM_ML_KEM' })
    await check.click()
    await expect(output).toContainText('CKM_ML_KEM is listed without CKF_SIGN.')
    await lookup.selectOption({ label: 'CKM_ML_DSA' })
    await expect(output).toBeEmpty()
    await check.click()
    await expect(output).toContainText('CKM_ML_DSA is listed and advertises CKF_SIGN.')
    await page.getByRole('button', { name: 'Disable', exact: true }).click()
    await expect(check).toBeDisabled()
    await expect(output).toContainText('Enable the live HSM to read mechanism information.')
  })
}
