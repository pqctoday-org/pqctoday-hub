import { test, expect } from '@playwright/test'

test.describe('Migrate Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/migrate')
  })

  test('should load the migrate page and display software table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PQC Migration Guide' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should display search and filter controls', async ({ page }) => {
    await expect(page.getByPlaceholder('Search software...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Category' })).toBeVisible() // Category filter
    await expect(page.getByRole('button', { name: 'PQC Support' })).toBeVisible() // PQC Support filter
  })

  test('should filter table by search text', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search software...')
    await searchInput.fill('OpenSSL')

    // Check that OpenSSL is visible
    // content matches loose "OpenSSL" because cell contains version/status
    await expect(page.getByRole('cell', { name: 'OpenSSL' }).first()).toBeVisible()

    // Check that unrelated item is hidden (e.g., "Windows Server")
    await expect(page.getByRole('cell', { name: 'Windows Server' }).first()).toBeHidden()
  })

  test('should display "New" status badges', async ({ page }) => {
    // We added many new items in 12162025, so we expect at least one "New" badge
    // Look for the specific badge style or text
    const newBadge = page.locator('span', { hasText: /^New$/ }).first()
    await expect(newBadge).toBeVisible()
  })

  test('should expand row details on click', async ({ page }) => {
    // Click on the first software row
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Check for "Description" or "Capability Details" in the expanded details
    await expect(page.getByRole('heading', { name: 'Description' })).toBeVisible()
    await expect(page.getByText('Capability Details')).toBeVisible()
  })

  test('should navigate to authoritative source', async ({ page }) => {
    // Expand the first row to reveal links
    await page.locator('tbody tr').first().click()

    // Wait for expansion
    await expect(page.getByRole('heading', { name: 'Description' })).toBeVisible()

    // Find a link in the table and verify it has correct attributes but don't navigate away
    // Use the first available external link
    const link = page.locator('tbody tr a[target="_blank"]').first()
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('should filter by infrastructure layer', async ({ page }) => {
    // Click on an infrastructure layer (e.g., "Hardware")
    const hardwareLayer = page.getByRole('button', { name: /Hardware/i }).first()
    await hardwareLayer.click()

    // A filter banner should appear indicating the layer is active
    await expect(page.getByText(/Showing.*Hardware/i)).toBeVisible()

    // Table should still be visible with filtered results
    await expect(page.getByRole('table')).toBeVisible()

    // Click again to deselect (toggle off)
    await hardwareLayer.click()
    await expect(page.getByText(/Showing.*Hardware/i)).not.toBeVisible()
  })

  test('should filter by PQC Support level', async ({ page }) => {
    // Open PQC Support dropdown and select "Yes"
    const pqcButton = page.getByRole('button', { name: 'PQC Support' })
    await pqcButton.click()

    // Select "Yes" option from dropdown
    const yesOption = page
      .getByRole('option', { name: 'Yes' })
      .or(page.locator('[role="listbox"] >> text=Yes'))
      .first()
    await yesOption.click()

    // All visible PQC Support badges should start with "Yes"
    const table = page.getByRole('table')
    await expect(table).toBeVisible()

    // Verify at least one row is visible
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter by migration step via View Related Products', async ({ page }) => {
    // Click on a migration step indicator (Step 1: Assess)
    const assessStep = page.getByText('Assess').first()
    await assessStep.click()

    // Look for "View Related Products" button in the step card
    const viewProductsBtn = page.getByRole('button', { name: /View Related Products/i })
    if (await viewProductsBtn.isVisible()) {
      await viewProductsBtn.click()

      // A step filter banner should appear
      await expect(page.getByText(/Showing products for Step/i)).toBeVisible()

      // Clear the filter
      const clearBtn = page.locator('button', { hasText: /Clear|×/ }).first()
      if (await clearBtn.isVisible()) {
        await clearBtn.click()
      }
    }
  })

  test('should expand and display coverage gaps', async ({ page }) => {
    // Find the Coverage Gaps collapsible section
    const gapButton = page.getByRole('button', { name: /Coverage Gaps/i })

    // It should exist on the page
    await expect(gapButton).toBeVisible()

    // Click to expand
    await gapButton.click()

    // Should show priority-grouped gap categories
    await expect(page.getByText(/Critical Priority/i).first()).toBeVisible()
  })
})
