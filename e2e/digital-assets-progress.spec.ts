// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`Digital Assets at ${width}px records a completed exercise and keeps unrelated files`, async ({
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
    await page.goto('/learn/digital-assets?tab=workshop')
    const bitcoin = page.getByRole('button', { name: /^Bitcoin secp256k1/ })
    const custody = page.getByRole('button', { name: /^Custody Architecture Wallet tiers/ })
    await bitcoin.click()
    await page.getByRole('button', { name: /Back to Chain Selection/ }).click()
    await expect(bitcoin).not.toContainText('Completed')

    await custody.click()
    const steps = page.getByRole('button', { name: /^Transaction step \d+$/ })
    await expect(steps.first()).toBeVisible()
    expect(
      await steps.evaluateAll((buttons) =>
        buttons.every((button) => {
          const bounds = button.getBoundingClientRect()
          return bounds.left >= 0 && bounds.right <= window.innerWidth
        })
      )
    ).toBe(true)
    const complete = page.getByRole('button', { name: 'Complete', exact: true })
    await steps.last().click()
    await expect(complete).toBeDisabled()
    for (const step of await steps.all()) await step.click()
    await expect(complete).toBeEnabled()
    await complete.click()
    await expect(custody).toContainText('Completed')
    await expect(bitcoin).not.toContainText('Completed')
    await page.reload()
    await expect(custody).toContainText('Completed')

    const unrelated = JSON.stringify({
      state: { files: [{ name: 'unrelated-session.txt', content: 'Retain this sample.' }] },
      version: 1,
    })
    await page.evaluate((value) => localStorage.setItem('openssl-studio-storage', value), unrelated)
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Reset module progress', exact: true }).click()
    await expect(custody).not.toContainText('Completed')
    expect(await page.evaluate(() => localStorage.getItem('openssl-studio-storage'))).toBe(
      unrelated
    )
  })
}

test('Bitcoin records completion after the live signing and verification journey', async ({
  page,
}) => {
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
  await page.goto('/learn/digital-assets?tab=workshop')
  const bitcoin = page.getByRole('button', { name: /^Bitcoin secp256k1/ })
  await bitcoin.click()
  await expect(page.getByText('Live HSM Mode Active', { exact: true })).toBeVisible({
    timeout: 20_000,
  })
  for (const action of [
    'Generate Source Key',
    'Extract Public Key',
    'Create Source Address',
    'Generate Recipient Key',
    'Create Recipient Address',
    'Format Transaction',
    'Visualize Message',
    'Sign Transaction',
  ]) {
    await page.getByRole('button', { name: action, exact: true }).click()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Verify Signature', exact: true }).click()
  await expect(page.getByText('Original sample signature verified.').first()).toBeVisible()
  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await expect(bitcoin).toContainText('Completed')
})
