import { test, expect } from '@playwright/test'

test.describe('Compliance Table Sorting', () => {
  test('should sort by Product Name', async ({ page }) => {
    // Go to compliance page
    await page.goto('/compliance')

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
    await page.waitForSelector('table tbody tr')

    // Default might be desc, click to toggle
    await page.getByRole('button', { name: 'Date' }).click()
    // Check direction
    // ...
  })
})
