// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`${viewport.name}: registry identity stays distinct from profile permission`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
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
    await page.goto('/learn/crypto-registry?tab=workshop')
    await page.getByRole('tab', { name: 'Workshop', exact: true }).click()
    const policy = page.getByRole('region', { name: 'Sample deployment policy' })
    const verdict = policy.getByRole('status')
    const profile = policy.getByLabel('Deployment profile')

    await page.getByRole('button', { name: 'ES256', exact: true }).click()
    await expect(page.getByText('Resolved to a canonical family', { exact: true })).toBeVisible()
    await expect(page.getByText('ECDSA', { exact: true }).first()).toBeVisible()
    await expect(verdict).toContainText('Identifier permitted')
    await profile.click()
    await page.getByRole('option', { name: 'ML-DSA certificate pilot' }).click()
    await expect(verdict).toContainText('Identifier outside')
    await expect(page.getByText('ECDSA', { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: 'id-ml-dsa-65', exact: true }).click()
    await expect(verdict).toContainText('Identifier permitted')
    await page.getByRole('button', { name: 'RSA2048', exact: true }).click()
    await expect(page.getByText('No canonical family found', { exact: true })).toBeVisible()
    await expect(verdict).toContainText('Identifier outside')
    await profile.click()
    await page.getByRole('option', { name: 'Existing JWT issuer' }).click()
    await page.getByRole('button', { name: 'ES256', exact: true }).click()
    await expect(verdict).toContainText('Identifier permitted')
  })
}
