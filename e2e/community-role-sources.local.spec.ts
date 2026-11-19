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
  test(`Community verifies the role from its primary source at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/leaders')
    const search = page.getByRole('searchbox', { name: 'Search community by name or role' })
    await search.fill('deliberately-absent-community-fixture')
    await expect(page.getByText(/No people found|No one matches these filters/)).toBeVisible()
    await page.getByRole('button', { name: 'Clear community search' }).press('Enter')
    await expect(search).toBeFocused()
    await expect(search).toHaveValue('')
    await search.fill('Dustin Moody')
    await expect(page).toHaveURL(/q=Dustin\+Moody/)
    const trigger =
      width === 390
        ? page.getByRole('button', { name: /Dr\. Dustin Moody/ })
        : page.getByRole('button', { name: 'Expand details for Dr. Dustin Moody' })
    await trigger.press('Enter')
    const profile =
      width === 390
        ? page.getByTestId('leader-detail-sheet')
        : page.getByRole('region', { name: 'Additional details for Dr. Dustin Moody' })
    await expect(profile.getByText('Role and affiliation source')).toBeVisible()
    const roleSource = profile.getByRole('link', {
      name: 'NIST identifies the PQC standardization project lead',
    })
    await expect(roleSource).toHaveAttribute(
      'href',
      'https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography'
    )
    await expect(profile.getByText('Cited in the Library (3)')).toBeVisible()
    await expect(page).toHaveURL(/leader=dustin-moody-nist/)
    await page.reload()
    await expect(roleSource).toBeVisible()
    await expect(search).toHaveValue('Dustin Moody')

    await page.goto('/leaders?q=Bill+Newhouse')
    await expect(search).toHaveValue('Bill Newhouse')
    await (
      width === 390
        ? page.getByRole('button', { name: /Bill Newhouse/ })
        : page.getByRole('button', { name: 'Expand details for Bill Newhouse' })
    ).press('Enter')
    const newhouse =
      width === 390
        ? page.getByTestId('leader-detail-sheet')
        : page.getByRole('region', { name: 'Additional details for Bill Newhouse' })
    await expect(
      newhouse.getByRole('link', {
        name: 'NIST staff profile identifies the NCCoE cybersecurity engineer and project lead',
      })
    ).toHaveAttribute('href', 'https://www.nist.gov/people/bill-newhouse')
    await expect(
      newhouse.getByRole('link', { name: /NIST identifies the PQC standardization/ })
    ).toHaveCount(0)
  })
}
