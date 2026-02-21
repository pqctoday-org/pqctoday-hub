import { test, expect } from '@playwright/test'

test.describe('Key Management & HSM Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn/key-management')
  })

  test('should load the Key Management Introduction', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1').getByText(/Key Management & HSM/i)).toBeVisible()

    // Check Key Lifecycle Management section is visible
    await expect(page.getByRole('heading', { name: 'Key Lifecycle Management' })).toBeVisible()

    // Check HSM Fundamentals section is visible
    await expect(page.getByRole('heading', { name: 'HSM Fundamentals' })).toBeVisible()
  })

  test('should navigate to Key Rotation Planner and verifiy compliance text', async ({ page }) => {
    // Click Start Workshop
    await page.getByRole('button', { name: /Start Workshop/i }).click()

    // Switch to step 3 (Rotation Planner)
    await page.getByRole('button', { name: /Next Step/i }).click()
    await page.getByRole('button', { name: /Next Step/i }).click()

    // Verify the fixed compliance text
    await expect(page.getByText('ANSSI & BSI (EU)')).toBeVisible()
  })
})
