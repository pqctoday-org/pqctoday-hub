// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('Playground - SoftHSMv3 ACVP Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast if present
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })

    // Navigate to playground
    await page.goto('/playground')
    await page.reload() // Force reload to ensure fresh WASM
  })

  test('should execute the ACVP validation suite across the token', async ({ page }) => {
    test.setTimeout(90000)

    // 1. Enable Dual HSM Mode
    await page.getByRole('switch', { name: 'Toggle HSM mode' }).click()
    await page.locator('input[value="dual"]').click()

    // 2. Token Setup
    await page.getByRole('button', { name: /Initialize/i, exact: true }).click()
    await expect(page.getByText(/Initialized/i).first()).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Create Token/i }).click()
    await expect(page.getByText(/Token Created/i).first()).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Open Session/i }).click()
    await expect(page.getByText(/Session Open/i).first()).toBeVisible({ timeout: 15000 })

    // 3. Navigate to ACVP Tab
    await page.locator('#tab-acvp').click()
    await expect(page.getByText(/SoftHSMv3 FIPS Validation Mode/i)).toBeVisible()

    // 4. Execute Tests
    await page.getByRole('button', { name: /Execute ACVP Tests/i }).click()

    // Wait for the completion log
    await expect(page.getByText(/Validation Suite Completed/i)).toBeVisible({ timeout: 30000 })

    // 5. Verify at least one PASS result in the results table
    const passBadges = page.locator('span', { hasText: 'pass' }).filter({
      has: page.locator('svg'), // CheckCircle icon
    })
    await expect(passBadges.first()).toBeVisible({ timeout: 5000 })

    // 6. Verify zero DISCREPANCY entries in the execution log
    const logPanel = page.locator('.font-mono.text-success\\/80')
    await expect(logPanel).toBeVisible()
    const logText = await logPanel.textContent()
    expect(logText).not.toContain('[DISCREPANCY]')
  })
})
