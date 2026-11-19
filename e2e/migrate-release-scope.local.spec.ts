// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`catalogue search and evidence distinguish the deployed release at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(75_000)
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
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/migrate?tab=replace')
    const search = page.getByLabel(/Search (?:all products|products, assets, and categories)/i)
    await search.fill('OpenSSL 3.6.50')
    const product = page.getByRole('button', { name: /^OpenSSL 3\.6\b/ }).first()
    await expect(product).toHaveCount(0)
    await search.fill('OpenSSL 3.6.5')
    await product.click()
    if (width === 1280) {
      await page
        .getByRole('button', { name: 'Expand details for OpenSSL 3.6', exact: true })
        .click()
    }
    await expect(page).toHaveURL((url) => url.searchParams.get('product') === 'openssl-3-6')
    const scope = page.locator('details').filter({ hasText: 'Compare your deployed version' })
    await scope.getByText('Compare your deployed version', { exact: true }).click()
    const deployed = scope.getByLabel('Deployed version')
    const decision = scope.getByRole('status')
    await expect(scope).toContainText('Catalogue release 3.6.5')
    await expect(decision).toContainText('Enter the version string')
    await deployed.fill('3.6.5')
    await expect(decision).toContainText('Release label matches')
    await expect(decision).toContainText('enabled provider and protocol profile')
    await deployed.fill('3.6.5-build7')
    await expect(decision).toContainText('support for the deployed version unverified')
    await expect(
      page.locator('a[href="https://openssl-library.org/news/openssl-3.6-notes/"]').first()
    ).toBeVisible()
    await deployed.fill('3.6.5')
    await expect(decision).toContainText('Release label matches')
  })
}
