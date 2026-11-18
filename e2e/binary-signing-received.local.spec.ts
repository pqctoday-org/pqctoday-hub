// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the original ML-DSA signature rejects changed received bytes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/code-signing?tab=workshop&step=0')
    await page.getByRole('button', { name: 'Enable', exact: true }).click()
    await page.getByRole('button', { name: 'Generate (Live WASM)', exact: true }).click()
    const original = 'Example release manifest v1'
    await page.getByLabel('Data to sign', { exact: true }).fill(original)
    await page.getByRole('button', { name: 'Sign and check sample' }).click()
    await expect(page.getByText('Sample signature check passed', { exact: true })).toBeVisible()
    await expect(
      page.getByText(createHash('sha256').update(original).digest('hex'), { exact: true })
    ).toBeVisible()

    const received = page.getByLabel('Received data', { exact: true })
    const verify = page.getByRole('button', { name: 'Verify against original signature' })
    const verdict = page.getByRole('status', { name: 'Received data result' })
    await expect(received).toHaveValue(original)
    await verify.click()
    await expect(verdict).toHaveText('Received data matches the signed message.')
    await received.fill('Example release manifest v2')
    await expect(verdict).toHaveText('Ready to check the received data.')
    await verify.click()
    await expect(verdict).toHaveText('Received data failed signature verification.')
    await page.getByRole('button', { name: 'Restore signed data' }).click()
    await expect(received).toHaveValue(original)
    await verify.click()
    await expect(verdict).toHaveText('Received data matches the signed message.')
  })
}
