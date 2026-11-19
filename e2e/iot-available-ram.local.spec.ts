// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the IoT model uses free RAM for its exact fit boundary at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/iot-pqc?tab=workshop')
    await page.getByRole('button', { name: /^Step 1: Algorithm Explorer/ }).click()
    const ram = page.getByRole('spinbutton', { name: 'Available RAM for cryptography (bytes)' })
    await expect(ram).toBeVisible()
    const estimatedPeakRam = 2712 + 1312 + 2420
    const mldsa = page.getByRole('article', { name: 'ML-DSA-44', exact: true })
    await expect(mldsa).toContainText('Peak RAM 6,444 B')
    await ram.fill(String(estimatedPeakRam - 1))
    await expect(mldsa.getByText('Too large', { exact: true })).toBeVisible()
    await ram.fill(String(estimatedPeakRam))
    await expect(mldsa.getByText('Tight', { exact: true })).toBeVisible()
    await ram.fill('0')
    await expect(mldsa.getByText('No free RAM', { exact: true })).toBeVisible()
    await expect(mldsa.getByText('Too large', { exact: true })).toBeVisible()
    await ram.fill('-1')
    await expect(ram).toHaveAttribute('aria-invalid', 'true')
    await expect(mldsa).toHaveCount(0)
    await page.getByRole('button', { name: 'Use class RAM', exact: true }).click()
    await expect(ram).toHaveAttribute('aria-invalid', 'false')
    await expect(mldsa.getByText('Tight', { exact: true })).toBeVisible()
  })
}
