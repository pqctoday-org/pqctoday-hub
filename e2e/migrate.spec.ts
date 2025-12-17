import { test, expect } from '@playwright/test'

test.describe('Migrate Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/migrate')
  })

  test('should load the migrate page and display software table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PQC Software Migration Guide' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should display search and filter controls', async ({ page }) => {
    await expect(page.getByPlaceholder('Search software...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Category' })).toBeVisible() // Category filter
    await expect(page.getByRole('button', { name: 'Platform' })).toBeVisible() // Platform filter
  })

  test('should filter table by search text', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search software...')
    await searchInput.fill('OpenSSL')

    // Check that OpenSSL is visible
    // content matches loose "OpenSSL" because cell contains version/status
    await expect(page.getByRole('cell', { name: 'OpenSSL' }).first()).toBeVisible()

    // Check that unrelated item is hidden (e.g., "Windows Server")
    await expect(page.getByRole('cell', { name: 'Windows Server' })).toBeHidden()
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
})
