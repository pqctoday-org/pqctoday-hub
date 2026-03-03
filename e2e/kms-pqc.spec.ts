// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('KMS & PQC Key Management Module', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await page.goto('/learn/kms-pqc')
  })

  test('should load the KMS PQC Introduction', async ({ page }) => {
    await expect(
      page
        .locator('h1')
        .getByText(/KMS.*PQC/i)
        .first()
    ).toBeVisible()
  })

  test('should navigate to Workshop and show Key Hierarchy Designer', async ({ page }) => {
    await page.getByRole('button', { name: /Start Workshop/i }).click()

    // First workshop step should be visible
    await expect(page.getByText(/Key Hierarchy/i).first()).toBeVisible()
  })

  test('should navigate to KMIP Protocol Explorer (Step 5)', async ({ page }) => {
    // Go to workshop tab
    await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()

    // Click on Step 5 in the step progression
    await page
      .getByText(/Step 5/i)
      .first()
      .click()

    // Verify KMIP content is visible
    await expect(page.getByText(/KMIP Operation Simulator/i).first()).toBeVisible()

    // Verify operation buttons are present
    await expect(page.getByRole('button', { name: 'Create' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Destroy' }).first()).toBeVisible()

    // Navigate to Key Types section
    await page.getByRole('button', { name: 'Key Types' }).first().click()
    await expect(page.getByText(/PQC Key Type Mapping/i).first()).toBeVisible()

    // Navigate to Sync section
    await page.getByRole('button', { name: 'Sync' }).first().click()
    await expect(page.getByText(/Cross-Provider Key Sync/i).first()).toBeVisible()

    // Navigate to Readiness section
    await page.getByRole('button', { name: 'Readiness' }).first().click()
    await expect(page.getByText(/KMIP PQC Migration Readiness/i).first()).toBeVisible()
  })
})
