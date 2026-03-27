// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('Compliance Table Sorting', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 2 })
      )
    })
  })

  test('should sort by Product Name', async ({ page }) => {
    // Go to compliance page
    await page.goto('/compliance')
    // Switch to Cert Records tab where the table lives
    const allTab = page.getByText('Cert Records')
    await expect(allTab).toBeVisible({ timeout: 10000 })
    await allTab.click({ force: true })

    // Wait for table to load
    await page.waitForSelector('table tbody tr')

    // Click "Product Name" header to sort ASC
    await page.getByRole('button', { name: 'Product Name' }).click()
    // Get all product names
    const namesAsc = await page
      .locator('tbody tr td:nth-child(4) > div:first-child')
      .allInnerTexts()
    // Verify sorted
    const sortedAsc = [...namesAsc].sort((a, b) => a.localeCompare(b))
    expect(namesAsc).toEqual(sortedAsc)

    // Click again to sort DESC
    await page.getByRole('button', { name: 'Product Name' }).click()

    // Get all product names
    const namesDesc = await page
      .locator('tbody tr td:nth-child(4) > div:first-child')
      .allInnerTexts()
    // Verify sorted desc
    const sortedDesc = [...namesDesc].sort((a, b) => b.localeCompare(a))
    expect(namesDesc).toEqual(sortedDesc)
  })

  test('should sort by Date', async ({ page }) => {
    await page.goto('/compliance')
    // Switch to table tab
    const allTab = page.getByText('Cert Records')
    await expect(allTab).toBeVisible({ timeout: 10000 })
    await allTab.click({ force: true })
    await page.waitForSelector('table tbody tr')

    // Default might be desc, click to toggle
    // Use locator for th since it's not a button
    await page.locator('th').filter({ hasText: 'Date' }).click()
    // Check direction
    // ...
  })
})
