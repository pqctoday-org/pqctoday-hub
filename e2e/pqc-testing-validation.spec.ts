// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('PQC Testing & Validation Module', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await page.goto('/learn/pqc-testing-validation')
  })

  test('should load the PQC Testing Introduction', async ({ page }) => {
    await expect(
      page
        .locator('h1')
        .getByText(/PQC Network Testing/i)
        .first()
    ).toBeVisible()
  })

  test('should navigate to Workshop and see all steps including ACVP Validator', async ({
    page,
  }) => {
    // Navigate to Workshop via the main tab (more reliable than in-page buttons)
    await page
      .getByRole('tab', { name: /Workshop/i })
      .first()
      .click()

    // Assert that the ACVP Validation step exists (clicking the 7th button in the scroll row)
    const step7Btn = page
      .locator('button')
      .filter({ hasText: /NIST ACVP/i })
      .first()
    await expect(step7Btn).toBeVisible()

    // Click it
    await step7Btn.click()

    // Assert the simulator panel is visible
    await expect(page.getByText(/SoftHSMv3 Vector Processing Engine/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Execute/i })).toBeVisible()
  })
})
