// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const [moduleId, section] of [
  ['hsm-pqc', 'PKCS#11 v3.2 PQC Mechanisms'],
  ['kms-pqc', ''],
  ['secure-boot-pqc', 'ML-DSA-65 for Firmware Signature Migration'],
]) {
  test(`${moduleId}: measure the RSA encoding and recover from an undersized buffer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto(`/learn/${moduleId}?tab=learn`)
    if (section) await page.getByRole('button', { name: section, exact: true }).click()
    await page.getByText('Measure a public key buffer', { exact: true }).click()
    await page.getByRole('button', { name: 'Generate and measure RSA-2048' }).click()
    await expect(page.getByText('Measured modulus: 256 bytes.')).toBeVisible()
    await expect(page.getByText('Measured DER SPKI: 294 bytes.')).toBeVisible()
    await expect(page.getByText(/needs 38 more bytes/)).toBeVisible()
    const capacity = page.getByRole('spinbutton', { name: 'Buffer capacity (bytes)' })
    await capacity.fill('0')
    await expect(page.getByText('Enter a positive whole number of bytes.')).toBeVisible()
    await capacity.fill('294')
    await expect(page.getByText(/fits with 0 bytes to spare/)).toBeVisible()
    await capacity.fill('300')
    await expect(page.getByText(/fits with 6 bytes to spare/)).toBeVisible()
  })
}
