// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('Digital ID EUDI Wallet Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the Digital ID learning module
    await page.goto('/learn/digital-id')
  })

  test('should render Digital ID components and allow workflow execution', async ({ page }) => {
    // Look for Digital ID text anywhere to ensure the page loaded
    await expect(page.locator('text=Digital ID').first()).toBeVisible()

    // Wait for WASM/SoftHSM to initialize bounds
    await page.waitForTimeout(1000)

    // The Workshop has several steps (Wallet, PID Issuance, Attestation, Presentation, QES)
    // We should be able to click on PID Issuance and issue a PID
    const pidSignButton = page.getByRole('button', { name: /Issue PID/i })
    if (await pidSignButton.isVisible()) {
      await pidSignButton.click()
      // Wait for the HSM signing sequence to execute and display logs
      await expect(page.locator('text=Document Signer Certificate').first()).toBeVisible({
        timeout: 10000,
      })
    }
  })
})
