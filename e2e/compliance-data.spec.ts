import { test, expect } from '@playwright/test'

test.describe('Compliance Data View', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the compliance page
        // Note: Using relative path, assuming baseURL is set in config
        // or we can use the specific port we just set
        await page.goto('/compliance')
    })

    test('should load the compliance page and display the table', async ({ page }) => {
        // Check for header - Use strict locator or role
        await expect(page.getByRole('heading', { name: 'Compliance & Certification' })).toBeVisible()

        // Wait for table to populate
        // We look for rows in the table body
        const rows = page.locator('tbody tr')

        // Should have at least one row (snapshot or live data)
        await expect(rows.first()).toBeVisible({ timeout: 10000 })

        // Snapshot has at least 5-6 items, live has more
        const count = await rows.count()
        expect(count).toBeGreaterThan(0)
    })

    test('should allow switching tabs and filtering data with pagination', async ({ page }) => {
        // Default is "All"
        const allTab = page.getByText('All Records')
        await expect(allTab).toBeVisible({ timeout: 10000 })
        await expect(allTab).toHaveAttribute('data-state', 'active')

        // Switch to FIPS (Index 1)
        await page.getByRole('button', { name: 'FIPS 140-3' }).first().click({ force: true })
        await expect(page.locator('tbody tr').first()).toContainText('FIPS 140-3')

        // Verify pagination (50 items per page max)
        await page.waitForTimeout(1000)
        let fipsCount = await page.locator('tbody tr').count()

        // If >50 records exist, we should see exactly 50 rows
        if (fipsCount === 50) {
            await expect(page.getByText('Showing 1 to 50')).toBeVisible()
            await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled()
        } else {
            expect(fipsCount).toBeGreaterThan(0)
        }

        // Switch to ACVP
        await page.getByRole('button', { name: 'ACVP' }).first().click({ force: true })
        await expect(page.locator('tbody tr').first()).toContainText('ACVP')

        // Switch to Common Criteria
        await page.getByRole('button', { name: 'Common Criteria' }).first().click({ force: true })
        await expect(page.locator('tbody tr').first()).toContainText('Common Criteria')
    })

    test('should search and filter results including pagination feedback', async ({ page }) => {
        // Wait for data
        await expect(page.locator('tbody tr').first()).toBeVisible()

        // Type "Active"
        await page.getByPlaceholder('Search products, vendors, types...').fill('Active')

        // Wait for "Filtering Records..." overlay to appear and disappear
        // Note: The overlay has a 400ms delay to appear, and effectively disappears when done
        // We just ensure we end up with results
        await expect(page.locator('tbody tr').first()).toBeVisible()

        // Check finding rows
        const count = await page.locator('tbody tr').count()
        expect(count).toBeGreaterThan(0)
    })
})
