import { test, expect } from '@playwright/test'

test.describe('Impact Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Threats' }).click()
  })

  test('displays impact dashboard', async ({ page }) => {
    // Check for main heading
    // Assuming "Quantum Threat Impacts" or similar based on user request description
    // Let's check for "Risk" or "Impact" text if heading is dynamic
    await expect(page.getByText(/Quantum Threats/i).first()).toBeVisible()

    // Check for some content cards
    // Assuming there are cards for industries like "Finance", "Healthcare"
    // Check if data loaded (or at least table structure)
    await expect(page.getByRole('columnheader', { name: 'Industry' })).toBeVisible()

    // Verify table has rows
    await expect(page.locator('tbody tr')).not.toHaveCount(0)
  })
})
