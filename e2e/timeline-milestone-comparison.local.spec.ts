// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const usSource =
  'https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/'
const ukSource = 'https://www.ncsc.gov.uk/guidance/pqc-migration-timelines'

for (const width of [1280, 390]) {
  test(`timeline distinguishes two sourced milestones at ${width}px`, async ({ page }) => {
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
    await page.goto('/timeline?country=Canada&milestoneA=unavailable')
    const comparison = page.locator('details').filter({
      has: page.getByText('Compare published milestones', { exact: true }),
    })
    const first = comparison.getByRole('combobox', { name: 'First milestone' })
    const second = comparison.getByRole('combobox', { name: 'Second milestone' })
    await expect(comparison.getByRole('status')).toContainText('This milestone is unavailable')
    const uk = await first
      .getByRole('option', { name: /NCSC.*Complete migration to PQC/ })
      .getAttribute('value')
    const us = await second
      .getByRole('option', { name: /Federal Agencies.*Key-Establishment Migration Deadline/ })
      .getAttribute('value')
    await first.selectOption(uk!)
    await second.selectOption(us!)
    await expect(comparison.getByRole('status')).toHaveCount(0)
    const ukDetails = comparison.getByRole('article', { name: 'First milestone details' })
    const usDetails = comparison.getByRole('article', { name: 'Second milestone details' })
    const verifyEvidence = async () => {
      await expect(ukDetails.getByText('2035', { exact: true })).toBeVisible()
      await expect(ukDetails.getByTestId('binding-force')).toHaveText('Recommendation')
      await expect(ukDetails.getByRole('link', { name: 'Open primary source' })).toHaveAttribute(
        'href',
        ukSource
      )
      await expect(usDetails.getByText('2030', { exact: true })).toBeVisible()
      await expect(usDetails.getByTestId('binding-force')).toHaveText('Binding')
      await expect(usDetails).toContainText('excluding National Security Systems')
      await expect(usDetails.getByRole('link', { name: 'Open primary source' })).toHaveAttribute(
        'href',
        usSource
      )
    }
    await verifyEvidence()
    expect(new URL(page.url()).searchParams.get('country')).toBe('Canada')
    await page.reload()
    await verifyEvidence()

    const source = await ukDetails
      .getByRole('link', { name: 'Open timeline record' })
      .getAttribute('href')
    expect(new URL(source!, page.url()).searchParams.get('event')).toBe(
      'united-kingdom-ncsc-full-pqc-compliance'
    )
    await comparison.getByRole('button', { name: 'Clear comparison' }).press('Space')
    await expect(first).toBeFocused()
    await expect(first).toHaveValue('')
    await expect(second).toHaveValue('')
    expect(new URL(page.url()).searchParams.get('country')).toBe('Canada')
    expect(new URL(page.url()).searchParams.has('milestoneA')).toBe(false)
    expect(new URL(page.url()).searchParams.has('milestoneB')).toBe(false)
  })
}
