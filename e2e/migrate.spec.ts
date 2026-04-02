// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('Migrate Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/migrate?mode=table')
    // Ensure table is visible before starting each test
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
  })

  test('should load the migrate page and display software table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PQC Migration Guide' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should display search and filter controls', async ({ page }) => {
    await expect(page.getByPlaceholder('Search software...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'All Vendors', exact: true })).toBeVisible() // Vendor filter
    await expect(page.getByRole('button', { name: 'All Verifications', exact: true })).toBeVisible() // Verification filter
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

  test.skip('should display "New" status badges', async ({ page }) => {
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
    // Open Layer dropdown in table mode
    const layerDropdownBtn = page.getByRole('button', { name: 'All Layers', exact: true })
    await layerDropdownBtn.click()

    // Select "Hardware" layer
    const hardwareOption = page.getByRole('option', { name: /Hardware/i }).first()
    await hardwareOption.click()

    // Verify it changed the dropdown text
    await expect(page.getByRole('button', { name: /Hardware/i }).first()).toBeVisible()

    // Table should still be visible with filtered results
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should filter by Verification status', async ({ page }) => {
    // Open Verification status dropdown
    const verificationBtn = page.getByRole('button', { name: 'All Verifications', exact: true })
    await verificationBtn.click()

    // Select "Verified" or first available option
    const firstOption = page.locator('[role="option"]').first()
    await firstOption.click()

    const table = page.getByRole('table')
    await expect(table).toBeVisible()

    // Verify at least one row is visible
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter by migration step via View Related Products', async ({ page }) => {
    // Assess step card is open by default — click "View Related Products" directly
    const viewProductsBtn = page.getByRole('button', { name: /View Related Products/i })
    await expect(viewProductsBtn).toBeVisible({ timeout: 10000 })
    await viewProductsBtn.click()

    // A step filter banner should appear
    await expect(page.getByText(/Showing products for/i)).toBeVisible()

    // Clear the filter
    const clearBtn = page.getByRole('button', { name: /Clear step filter/i })
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()
    await expect(page.getByText(/Showing products for/i)).not.toBeVisible()
  })

  test('should expand and display coverage gaps', async ({ page }) => {
    // Coverage gaps only render when the data has uncovered categories
    const gapButton = page.getByRole('button', { name: /Coverage Gaps/i })
    const gapCount = await gapButton.count()
    if (gapCount === 0) {
      // No coverage gaps in current data — skip gracefully
      return
    }

    // It should exist on the page
    await expect(gapButton).toBeVisible()

    // Click to expand
    await gapButton.click()

    // Should show priority-grouped gap categories
    await expect(page.getByText(/Priority/i).first()).toBeVisible()
  })
})
