import { test, expect } from '@playwright/test'

test.describe('About View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'About' }).click()
  })

  test('displays project bio', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'About PQC Today' })).toBeVisible()
    await expect(page.getByText('demystify quantum threats').first()).toBeVisible()
  })

  test('displays SBOM', async ({ page }) => {
    await expect(page.getByText('Software Bill of Materials')).toBeVisible()

    // Scope to the SBOM container to avoid matching navigation elements
    const sbomSection = page
      .locator('.glass-panel')
      .filter({ hasText: 'Software Bill of Materials' })
    await expect(sbomSection.getByText(/OpenSSL/)).toBeVisible()
    await expect(sbomSection.getByText(/v3\.\d+\.\d+/).first()).toBeVisible()
  })
})
