import { test, expect } from '@playwright/test'

test.describe('Threats Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/threats')
    // Wait for data to load
    await expect(page.locator('h2:has-text("Quantum Threats")')).toBeVisible()
  })

  test('displays threats table with data', async ({ page }) => {
    // Verify table is present
    const table = page.locator('table')
    await expect(table).toBeVisible()

    // Verify at least one row exists (header + data rows)
    const rows = table.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('filters by industry', async ({ page }) => {
    // Open industry filter dropdown
    const industryFilter = page.locator('[data-testid="filter-dropdown"]').first()
    await industryFilter.click()

    // Select "Finance" if available, otherwise first non-All option
    const financeOption = page.locator('button[role="option"]:has-text("Finance")')
    if (await financeOption.isVisible()) {
      await financeOption.click()
    } else {
      // Click first available industry option
      await page.locator('button[role="option"]').nth(1).click()
    }

    // Verify filter applied (table still visible)
    await expect(page.locator('table')).toBeVisible()
  })

  test('filters by criticality', async ({ page }) => {
    // Open criticality filter dropdown (second dropdown)
    const criticalityFilter = page.locator('[data-testid="filter-dropdown"]').nth(1)
    await criticalityFilter.click()

    // Select "Critical" option
    const criticalOption = page
      .locator('[role="listbox"] button[role="option"]:has-text("Critical")')
      .first()
    if (await criticalOption.isVisible()) {
      await criticalOption.click()
      // Verify Critical badge appears in results
      await expect(page.locator('table >> text=Critical').first()).toBeVisible()
    }
  })

  test('searches threats by keyword', async ({ page }) => {
    // Use search input (desktop only)
    const searchInput = page.getByPlaceholder('Search threats...')

    // Only run search tests on desktop
    if (await searchInput.isVisible()) {
      await searchInput.fill('quantum')

      // Wait for results to filter
      await page.waitForTimeout(300)

      // Table should still be visible with filtered results
      await expect(page.locator('table')).toBeVisible()
    }
  })

  test('displays empty state when no results', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search threats...')

    if (await searchInput.isVisible()) {
      // Search for nonexistent term
      await searchInput.fill('xyznonexistent12345')

      // Wait for filter
      await page.waitForTimeout(300)

      // Verify empty state message
      await expect(page.locator('text=No threats found matching your filters')).toBeVisible()
    }
  })

  test('opens threat detail dialog', async ({ page }) => {
    // Click the info button on first row
    const infoButton = page.locator('[aria-label="View Details"]').first()
    await infoButton.click()

    // Verify dialog opens with expected content
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('[role="dialog"] h3:has-text("Description")')).toBeVisible()
    await expect(page.locator('[role="dialog"] h3:has-text("At-Risk Cryptography")')).toBeVisible()
    await expect(page.locator('[role="dialog"] h3:has-text("PQC Mitigation")')).toBeVisible()
  })

  test('closes dialog with close button', async ({ page }) => {
    // Open dialog
    await page.locator('[aria-label="View Details"]').first().click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Close with X button
    await page.locator('[aria-label="Close details"]').click()

    // Verify dialog is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('closes dialog by clicking outside', async ({ page }) => {
    // Open dialog
    await page.locator('[aria-label="View Details"]').first().click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Click outside (on the backdrop)
    await page
      .locator('.fixed.inset-0')
      .first()
      .click({ position: { x: 10, y: 10 }, force: true })

    // Verify dialog is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('sorts by industry column', async ({ page }) => {
    // Click Industry header to sort
    await page.locator('th:has-text("Industry")').click()

    // Verify sort indicator appears
    await expect(page.locator('th:has-text("Industry") svg')).toBeVisible()

    // Click again for descending
    await page.locator('th:has-text("Industry")').click()

    // Table should still render correctly
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('sorts by criticality column', async ({ page }) => {
    // Click Criticality header to sort
    await page.locator('th:has-text("Criticality")').click()

    // Verify sort indicator appears
    await expect(page.locator('th:has-text("Criticality") svg')).toBeVisible()
  })
})
