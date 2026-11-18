// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const fixture = {
  name: 'external-studio-sample.txt',
  type: 'text',
  content: 'Keep this work from another tool.',
  size: 33,
  timestamp: 1,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((file) => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    if (!localStorage.getItem('openssl-studio-storage'))
      localStorage.setItem(
        'openssl-studio-storage',
        JSON.stringify({ state: { files: [file], structuredLogs: [] }, version: 1 })
      )
  }, fixture)
})

for (const width of [1280, 390]) {
  test(`workshop resets preserve other OpenSSL Studio work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const stored = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('openssl-studio-storage')!).state.files)

    await page.goto('/learn/pki-workshop?tab=workshop')
    const select = (name: string) => page.getByRole('button', { name, exact: true }).first()
    await select('Step 2: Create Root CA').click()
    await expect(select('Step 2: Create Root CA')).toHaveAttribute('aria-current', 'step')
    expect(await stored()).toEqual([fixture])
    page.once('dialog', (dialog) => dialog.accept())
    await select('Reset').click()
    await expect(select('Step 1: Generate CSR')).toHaveAttribute('aria-current', 'step')
    expect(await stored()).toEqual([fixture])

    await page.goto('/learn/digital-id?tab=workshop')
    await select('Step 2: PID Issuer').click()
    await select('Start Issuance Flow').click()
    await select('Proceed with Authentication').click()
    await expect(page.getByText(/PID has been securely stored/)).toBeVisible({ timeout: 25_000 })
    page.once('dialog', (dialog) => dialog.accept())
    await select('Reset').click()
    await expect(select('Step 1: EUDI Wallet')).toHaveAttribute('aria-current', 'step')
    await expect(select('Reset')).toHaveCount(0)
    expect(await stored()).toEqual([fixture])

    await select('Step 2: PID Issuer').click()
    await select('Start Issuance Flow').click()
    await select('Proceed with Authentication').click()
    await expect(page.getByText(/PID has been securely stored/)).toBeVisible({ timeout: 25_000 })
  })
}
