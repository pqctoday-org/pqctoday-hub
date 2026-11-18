// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, width } of [
  { route: '/playground/envelope-encrypt', width: 1280 },
  { route: '/learn/kms-pqc?tab=workshop&step=1', width: 390 },
]) {
  test(`${route}: switching the wrap mechanism requires a fresh DEK match and envelope`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
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
    await page.goto(route)
    const run = page.getByRole('button', { name: 'Execute (Live WASM)', exact: true })
    const progress = page.getByRole('button', { name: 'Complete & Next', exact: true })
    const artifacts = page.getByRole('heading', { name: 'Stored Envelope Blobs', exact: true })
    const verified = page.getByText('✓ Byte-identical', { exact: true })
    await expect(run).toBeVisible({ timeout: 20_000 })
    await run.click()
    await expect(verified).toBeVisible()
    await expect(artifacts).toBeVisible()
    await expect(progress).toBeEnabled()

    const gcm = page.getByRole('button', { name: /^AES-GCM\b/ })
    await gcm.click()
    await expect(gcm).toHaveAttribute('aria-pressed', 'true')
    await expect(verified).toHaveCount(0)
    await expect(artifacts).toHaveCount(0)
    await expect(progress).toBeDisabled()

    await run.click()
    await expect(verified).toBeVisible()
    await expect(artifacts).toBeVisible()
    await expect(page.getByText(/GCM Nonce \(IV\)/)).toBeVisible()
    await expect(progress).toBeEnabled()
  })
}
