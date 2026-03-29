// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('About View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'About' }).click()
  })

  test('displays project bio', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'About PQC Today' })).toBeVisible()
    await expect(
      page.getByText('PQCToday is a neutral, community-governed platform').first()
    ).toBeVisible()
  })

  test('displays SBOM', async ({ page }) => {
    const sbomHeading = page.getByRole('heading', { name: 'Software Bill of Materials (SBOM)' })
    await expect(sbomHeading).toBeVisible()

    // Click to expand the collapsible SBOM section
    await sbomHeading.click()

    // Scope to the SBOM container to avoid matching navigation elements
    const sbomSection = page
      .locator('.glass-panel')
      .filter({ hasText: 'Software Bill of Materials (SBOM)' })
    await expect(sbomSection.getByText(/OpenSSL/)).toBeVisible()
    await expect(sbomSection.getByText(/v3\.\d+\.\d+/).first()).toBeVisible()
  })
})
