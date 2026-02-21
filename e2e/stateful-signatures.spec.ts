import { test, expect } from '@playwright/test'

test.describe('Stateful Signatures Module', () => {
  test('should load the module and display HSS parameters in LMS Key Gen demo', async ({
    page,
  }) => {
    // Navigate to Stateful Signatures module
    await page.goto('/learn/stateful-signatures')

    // Verify the page title
    await expect(
      page.getByRole('heading', { name: 'Stateful Hash Signatures (LMS/XMSS)' })
    ).toBeVisible()

    // Go to Workshop tab
    await page.getByText('Workshop', { exact: true }).click()

    // Step 1: LMS Key Generation should be visible
    await expect(
      page.getByRole('heading', { name: 'LMS Key Generation', exact: true })
    ).toBeVisible()

    // HSS is now in WORKSHOP_DISPLAY_PARAMS so it should be visible by default
    const hssButton = page.getByRole('button', { name: 'HSS/W4' })
    await expect(hssButton).toBeVisible()

    // Click on the HSS parameter
    await hssButton.click()

    // Verify that the multi-tree indicator appears
    await expect(page.getByText('HSS Multi-Tree Structure')).toBeVisible()
    await expect(page.getByText('HSS Root')).toBeVisible()
    await expect(page.getByText('↓ signs sub-tree roots ↓')).toBeVisible()

    // Verify key parameters table variant value
    await expect(page.getByText('Multi-tree (HSS)')).toBeVisible()
  })
})
