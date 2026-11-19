// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

test.beforeEach(async ({ page }) => {
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
})

for (const width of [1280, 390]) {
  test(`KMIP signing follows the key state at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/playground/cacp')
    await page.getByRole('button', { name: 'Try the signing-key lifecycle' }).click()
    await expect(page).toHaveURL(/\/playground\/cacp\?tab=operate$/)
    const result = page.getByRole('region', { name: 'Result', exact: true })
    const create = page.getByRole('button', { name: /Create signing key pair/ })
    const activate = page.getByRole('button', { name: /2 · Activate/ })
    const sign = page.getByRole('button', { name: /3 · Sign/ })
    const verify = page.getByRole('button', { name: /4 · Verify/ })

    await expect(sign).toBeDisabled()
    await create.press('Enter')
    await expect(result.getByText(/Generated a key pair/)).toBeVisible()
    await sign.press('Enter')
    await expect(
      result.getByText(/Wrong Key Lifecycle State\. Signing requires an Active key/)
    ).toBeVisible()
    await expect(result.getByText(/policy: Deny/)).toHaveCount(0)
    await expect(verify).toBeDisabled()

    await activate.press('Enter')
    await expect(result.getByText(/the key is now Active/i)).toBeVisible()
    const message = page.getByRole('textbox', { name: 'Sample message to sign' })
    await message.fill('KMIP sample for the lifecycle check')
    await sign.press('Enter')
    await expect(result.getByText(/Signature is 3309 bytes/)).toBeVisible()
    await verify.press('Enter')
    await expect(result.getByText(/Signature verification result: Valid\./i)).toBeVisible()
    await page.getByRole('button', { name: /Revoke, then try to Sign again/ }).press('Enter')
    await expect(
      result.getByText(/create a replacement if the key has been revoked/i)
    ).toBeVisible()

    await create.press('Enter')
    await expect(result.getByText(/Generated a key pair/)).toBeVisible()
    await activate.press('Enter')
    await expect(result.getByText(/the key is now Active/i)).toBeVisible()
    await sign.press('Enter')
    await expect(result.getByText(/Signature is 3309 bytes/)).toBeVisible()

    const algorithm = page.getByTestId('kmip-algo')
    await algorithm.getByRole('button', { name: 'Algorithm:' }).click()
    await page.getByRole('option', { name: /ML-KEM-768/ }).click()
    await expect(result.getByText('Run a step to see what happened.')).toBeVisible()
    await expect(page.getByRole('button', { name: /3 · Encapsulate/ })).toBeDisabled()

    await page.goto('/playground/cacp-kmip?tab=operate')
    await expect(page).toHaveURL(/\/playground\/cacp\?tab=operate$/)
    await expect(create).toBeEnabled()
    await expect(sign).toBeDisabled()
  })
}
