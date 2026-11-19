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
  test(`Federal compliance sources state their dates and scope at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/compliance?tab=requirements&country=France&ind=Finance%20%26%20Insurance')
    const search = page.getByRole('searchbox', { name: 'Search instruments' })
    await search.fill('OMB-M-26-15')
    await expect(page.getByText('No instruments match this search and scope.')).toBeVisible()
    await page
      .getByRole('checkbox', { name: 'Include instruments outside my current scope' })
      .check()
    await page.getByRole('button', { name: 'OMB M-26-15', exact: true }).press('Enter')
    await expect(page).toHaveURL(/reqfw=OMB-M-26-15/)
    await expect(page.getByRole('heading', { name: 'OMB M-26-15', exact: true })).toBeFocused()
    await expect(page.getByText(/National Security Systems are excluded/)).toBeVisible()
    await expect(page.getByText(/within 120 days of June 24, 2026/)).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Read the instrument', exact: true })
    ).toHaveAttribute(
      'href',
      'https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf'
    )

    await search.fill('EO-14412')
    await page.getByRole('button', { name: 'EO 14412', exact: true }).press('Enter')
    await expect(page.getByRole('heading', { name: 'EO 14412', exact: true })).toBeFocused()
    await expect(
      page.getByText(/December 31, 2030 for key establishment and December 31, 2031/)
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Read the instrument', exact: true })
    ).toHaveAttribute(
      'href',
      'https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/'
    )
    await page.reload()
    await expect(page.getByRole('heading', { name: 'EO 14412', exact: true })).toBeVisible()
    await expect(page.getByTestId('deeplink-notice-widened')).toContainText(
      'it is open for reference'
    )
  })
}
