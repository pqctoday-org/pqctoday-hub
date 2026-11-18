// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, width, algorithm } of [
  { route: '/playground/token-migration', width: 1280, algorithm: 'RS256' },
  { route: '/learn/iam-pqc?tab=workshop&step=1', width: 390, algorithm: 'ML-DSA-65' },
]) {
  test(`${route}: ${algorithm} verifies the original subject and rejects a changed subject`, async ({
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
    const sign = page.getByRole('button', { name: 'Sign Token (Live WASM)', exact: true })
    const verify = page.getByRole('button', { name: 'Verify Signature (Live WASM)', exact: true })
    const change = page.getByRole('checkbox', { name: /Change received subject/ })
    await expect(sign).toBeEnabled({ timeout: 20_000 })
    if (algorithm === 'ML-DSA-65') {
      await page.getByRole('button', { name: 'Algorithm:' }).click()
      await page.getByRole('option', { name: /^ML-DSA-65/ }).click()
    }
    await expect(verify).toBeDisabled()
    await sign.click()
    await expect(page.getByText(/Signed via PKCS#11/)).toBeVisible()
    await verify.click()
    await expect(page.getByText('Signature verified', { exact: true })).toBeVisible()

    await change.check()
    await expect(page.getByText('Signature verified', { exact: true })).toHaveCount(0)
    await verify.click()
    await expect(page.getByText('Signature did not verify', { exact: true })).toBeVisible()

    await change.uncheck()
    await verify.click()
    await expect(page.getByText('Signature verified', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Disable', exact: true }).click()
    await expect(verify).toBeDisabled()
    await expect(page.getByText(/Signed via PKCS#11/)).toHaveCount(0)
  })
}
