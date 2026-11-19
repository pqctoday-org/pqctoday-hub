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
  test(`About shows traceable software evidence at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/about')
    await page.getByRole('link', { name: 'Find a software component' }).press('Enter')
    await expect(page).toHaveURL(/\/about#about-sbom$/)
    const search = page.getByRole('searchbox', { name: 'Search SBOM components' })
    await search.fill('openssl studio')
    const openssl = page.getByRole('link', { name: 'OpenSSL WASM (OpenSSL Studio)', exact: true })
    const download = page.getByRole('link', { name: /Download the complete SBOM/ })
    const response = await page.request.get((await download.getAttribute('href'))!)
    expect(response.ok()).toBeTruthy()
    const report = await response.json()
    expect(report.bomFormat).toBe('CycloneDX')
    expect(report.metadata.component.version).toBe('4.214.0')
    const component = report.components.find(
      ({ name }: { name: string }) => name === 'OpenSSL WASM (OpenSSL Studio)'
    )
    expect(component.version).toBe('3.6.3')
    expect(component.licenses).toEqual([{ license: { id: 'Apache-2.0' } }])
    await expect(openssl).toHaveAttribute(
      'href',
      'https://github.com/openssl/openssl/tree/openssl-3.6.3'
    )
    await expect(openssl.locator('..')).toContainText('v3.6.3')
    await expect(openssl.locator('..')).toContainText('Apache-2.0')
    await search.fill('unlisted-crypto-component-fixture')
    await expect(page.getByText('No components match that search.')).toBeVisible()
    await expect(openssl).toHaveCount(0)
    await page.getByRole('button', { name: 'Clear search' }).press('Enter')
    await expect(search).toBeFocused()
    await expect(openssl).toBeVisible()
    await page.reload()
    await expect(search).toBeVisible()
  })

  test(`Readers reach sponsorship terms and correction sources at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/about')
    await page.getByRole('link', { name: 'Sponsorship', exact: true }).press('Enter')
    await page.getByRole('link', { name: 'Compare sponsorship tiers' }).press('Enter')
    const tiers = page.locator('#sponsorship-tiers')
    await expect(tiers).toBeFocused()
    const monthly = tiers.getByRole('radio', { name: 'Monthly', exact: true })
    const once = tiers.getByRole('radio', { name: 'One-time' })
    await expect(monthly).toBeChecked()
    await expect(
      tiers.getByRole('link', { name: 'Sponsor monthly as Supporter on GitHub' })
    ).toBeVisible()
    await monthly.press('ArrowRight')
    await expect(once).toBeChecked()
    const checkout = tiers.getByRole('link', { name: 'Contribute once as Supporter on GitHub' })
    await expect(checkout).toHaveAttribute('href', 'https://github.com/sponsors/pqctoday-org')
    await expect(checkout.locator('..')).toContainText('$25')
    await once.press('ArrowLeft')
    await expect(monthly).toBeChecked()
    await expect(
      tiers.getByRole('link', { name: 'Sponsor monthly as Supporter on GitHub' }).locator('..')
    ).toContainText('$5')

    await page.getByRole('link', { name: 'Read the full policy' }).press('Enter')
    await expect(page).toHaveURL(
      /\/editorial-independence#editorial-independence-what-sponsorship-buys$/
    )
    const benefits = page.locator('#editorial-independence-what-sponsorship-buys')
    await expect(benefits).toBeFocused()
    await expect(benefits).toContainText('Sponsorship buys recognition.')
    await expect(benefits).toContainText('Sponsorship does not affect ordering')
    await page.getByRole('link', { name: 'Requests to modify content', exact: true }).press('Enter')
    const corrections = page.locator('#editorial-independence-requests-to-modify')
    await expect(corrections).toBeFocused()
    await expect(corrections).toContainText('primary-source evidence')
    await expect(corrections.getByRole('link', { name: 'Data Suggestion issue' })).toHaveAttribute(
      'href',
      'https://github.com/pqctoday-org/pqctoday-hub/issues/new?template=data_suggestion.yml'
    )
    await page.reload()
    await expect(corrections).toBeFocused()
  })

  test(`Terms lands at license and privacy details at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/about')
    await page.getByRole('link', { name: 'Terms of service', exact: true }).first().press('Enter')
    const contents = page.getByRole('navigation', { name: 'Table of contents' })
    await contents.getByRole('link', { name: 'License', exact: true }).press('Enter')
    const license = page.locator('#terms-license')
    await expect(license).toBeFocused()
    await expect(license.getByRole('link', { name: 'LICENSE file' })).toHaveAttribute(
      'href',
      'https://github.com/pqctoday-org/pqctoday-hub/blob/main/LICENSE'
    )
    await contents.getByRole('link', { name: 'Privacy and Analytics' }).press('Enter')
    const privacy = page.locator('#terms-privacy-analytics')
    await expect(privacy).toBeFocused()
    await expect(privacy).toContainText(/Google Analytics/)
    await page.reload()
    await expect(privacy).toBeFocused()
  })
}
