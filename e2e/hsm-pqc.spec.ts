// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('HSM & PQC Operations Module', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await page.goto('/learn/hsm-pqc')
  })

  test('should load the HSM PQC Introduction', async ({ page }) => {
    await expect(
      page
        .locator('h1')
        .getByText(/HSM.*PQC/i)
        .first()
    ).toBeVisible()
  })

  test('should navigate to Workshop and show PKCS#11 Simulator', async ({ page }) => {
    await page.getByRole('button', { name: /Start Workshop/i }).click()

    // First workshop step should be visible
    await expect(page.getByText(/PKCS.*11/i).first()).toBeVisible()
  })
})
