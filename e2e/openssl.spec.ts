import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio', () => {
  test.setTimeout(60000)
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /OpenSSL/ }).click()
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible()
  })

  test('generates RSA key', async ({ page }) => {
    // Ensure we are on Key Generation tab (default)
    await page.getByRole('button', { name: 'Key Generation' }).click()

    // Select RSA (default)
    // Click Run Command
    await page.getByRole('button', { name: 'Run Command' }).click()

    // Check logs for success (increase timeout for Firefox/CI)
    await expect(page.getByText(/File created: rsa-2048-/)).toBeVisible({ timeout: 30000 })

    // Switch to Key Files to verify file existence
    // The File Manager is always visible, so we just wait for the file to appear

    // Wait for file entry to propagate to the table (via Zustand state update)
    await page.waitForTimeout(1000)

    // Wait for view transition and table render
    await page.waitForTimeout(1000)

    // Check for table headers to ensure we are in the right view
    await expect(page.getByRole('columnheader', { name: 'Filename' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible()

    // Check if file exists in the table
    // It should be in a cell
    await expect(
      page
        .locator('td')
        .filter({ hasText: /rsa-2048-/ })
        .first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('generates ML-DSA key', async ({ page }) => {
    // Ensure we are on Key Generation tab
    await page.getByRole('button', { name: 'Key Generation' }).click()

    // Select ML-DSA-44
    await page.selectOption('#algo-select', 'mldsa44')

    // Click Run Command
    await page.getByRole('button', { name: 'Run Command' }).click()

    // Check logs
    await expect(page.getByText(/File created: mldsa-44-/)).toBeVisible()
  })
})
