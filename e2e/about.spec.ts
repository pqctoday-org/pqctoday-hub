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
    await expect(sbomSection.getByText('OpenSSL', { exact: true })).toBeVisible()
    await expect(sbomSection.getByText('v3.5.4')).toBeVisible()
  })

  test('displays feedback forms', async ({ page }) => {
    // Check for Change Request form
    await expect(page.getByText('Submit Change Request')).toBeVisible()
    await expect(page.getByLabel('I am a...')).toBeVisible()

    // Check for Kudos form
    await expect(page.getByText('Give Kudos')).toBeVisible()
    await expect(page.getByText('What do you like?')).toBeVisible()
  })

  test('displays submit buttons', async ({ page }) => {
    // Verify submit buttons exist (implementation uses window.location.href on submit, so we check button presence)
    await expect(page.getByRole('button', { name: 'Send Request' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Kudos' })).toBeVisible()
  })
})
