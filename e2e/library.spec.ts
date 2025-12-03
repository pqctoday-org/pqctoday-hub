import { test, expect } from '@playwright/test'

test.describe('Library Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.getByRole('button', { name: 'Library' }).click()
  })

  test('should navigate to library page and show category dropdown', async ({ page }) => {
    // Check for category dropdown
    const dropdown = page.getByRole('button', { name: 'Select Category:' })
    await expect(dropdown).toBeVisible()
    await expect(dropdown).toHaveText(/All/)
  })

  test('should display correct table headers and simplified columns', async ({ page }) => {
    // Wait for the library table to load (target by unique header)
    const table = page.locator('table', { has: page.getByText('Reference ID') }).first()
    await expect(table).toBeVisible()

    // Check headers within this specific table
    await expect(table.getByRole('columnheader', { name: 'Reference ID' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Title' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Last Update' })).toBeVisible()

    // The last header should be empty
    const headers = table.locator('thead th')
    await expect(headers).toHaveCount(5)
    await expect(headers.nth(4)).toHaveText('')

    // Ensure Author/Org column is NOT present
    await expect(table.getByRole('columnheader', { name: 'Author/Org' })).not.toBeVisible()
  })

  test('should sort by Last Update Date descending by default', async ({ page }) => {
    // Target the specific library table
    const table = page.locator('table', { has: page.getByText('Reference ID') }).first()
    await expect(table.locator('tbody tr')).not.toHaveCount(0)

    // Get all dates from the Last Update column (4th column, index 3)
    const dates = await table.locator('tbody tr td:nth-child(4)').allInnerTexts()

    // Check if dates are sorted descending
    if (dates.length >= 2) {
      const date1 = new Date(dates[0])
      const date2 = new Date(dates[1])
      expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
    }
  })

  test('should show details popup with correct info and layout', async ({ page }) => {
    // Target the specific library table
    const table = page.locator('table', { has: page.getByText('Reference ID') }).first()
    await expect(table).toBeVisible()
    await expect(table.locator('tbody tr')).not.toHaveCount(0)

    // Find the first "View Details" button (Info icon) within the table
    const detailsButton = table.getByLabel(/^View details for/).first()
    await expect(detailsButton).toBeVisible()

    // Click it
    await detailsButton.click()

    // Verify popup appears
    const popup = page.getByRole('dialog')
    await expect(popup).toBeVisible()

    // Verify popup content
    await expect(popup.getByText('Description')).toBeVisible()
    await expect(popup.getByText('Status:')).toBeVisible()
    await expect(popup.getByText('Authors:')).toBeVisible()
    await expect(popup.getByText('Published:')).toBeVisible()
    await expect(popup.getByText('Updated:')).toBeVisible()

    // Verify 2-column grid layout for metadata
    await expect(popup.locator('.grid.grid-cols-2')).toBeVisible()

    // Close popup
    await page.keyboard.press('Escape')
    await expect(popup).not.toBeVisible()
  })

  test('should have download icons next to title', async ({ page }) => {
    // Target the specific library table
    const table = page.locator('table', { has: page.getByText('Reference ID') }).first()
    await expect(table.locator('tbody tr')).not.toHaveCount(0)

    // Check for at least one download link with the correct aria-label within the table
    const downloadLink = table.getByRole('link', { name: /Open .* in new tab/ }).first()
    await expect(downloadLink).toBeVisible()
  })
})
