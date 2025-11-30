import { test, expect } from '@playwright/test'

test.describe('Impact Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Impacts' }).click()
  })

  test('displays impact dashboard', async ({ page }) => {
    // Check for main heading
    // Assuming "Quantum Threat Impacts" or similar based on user request description
    // Let's check for "Risk" or "Impact" text if heading is dynamic
    await expect(page.getByText(/Impact/i).first()).toBeVisible()

    // Check for some content cards
    // Assuming there are cards for industries like "Finance", "Healthcare"
    await expect(page.getByText('Finance')).toBeVisible()
    await expect(page.getByText('Healthcare')).toBeVisible()
  })
})
