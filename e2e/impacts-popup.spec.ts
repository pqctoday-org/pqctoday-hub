import { test, expect } from '@playwright/test'

test.describe('Threats & Impacts Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the threats page
    await page.goto('/threats')
  })

  test('should display Threats table and Info buttons', async ({ page }) => {
    // Wait for table
    const table = page.locator('table', { has: page.getByText('Industry') }).first()
    await expect(table).toBeVisible()

    // Check headers
    await expect(table.getByRole('columnheader', { name: 'Industry' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'ID' })).toBeVisible()

    // Check for Info button in the last column header (Info)
    await expect(table.getByRole('columnheader', { name: 'Info' })).toBeVisible()

    // Within first row, check for info button using label
    // The button has aria-label="View Details"
    const firstRow = table.locator('tbody tr').first()
    const infoBtn = firstRow.getByRole('button', { name: /View Details/i })
    await expect(infoBtn).toBeVisible()
  })

  test('should open details popup and show correct URL', async ({ page }) => {
    const table = page.locator('table', { has: page.getByText('Industry') }).first()

    // Click the first info button
    const infoBtn = table
      .locator('tbody tr')
      .first()
      .getByRole('button', { name: /View Details/i })
    await infoBtn.click()

    // Verify dialog appears. Using the class selector since role="dialog" might not be on the div
    const popup = page.locator('div.fixed.inset-0.z-50')
    await expect(popup).toBeVisible()

    // Verify content
    await expect(popup.getByText('At-Risk Cryptography')).toBeVisible()
    await expect(popup.getByText('PQC Mitigation')).toBeVisible()
    await expect(popup.getByText('Reference Source')).toBeVisible()

    // Verify Link
    // Link text is dynamic (mainSource), so check by href attribute presence or external link icon pattern
    const link = popup.locator('a[target="_blank"]')
    await expect(link).toBeVisible()

    const href = await link.getAttribute('href')
    console.log('Found link href:', href)

    // Validate it is a URL
    expect(href).toBeTruthy()
    expect(href).toMatch(/^https?:\/\//)

    // Close it
    const closeBtn = popup.getByRole('button', { name: 'Close details' })
    await closeBtn.click()
    await expect(popup).not.toBeVisible()
  })
})
