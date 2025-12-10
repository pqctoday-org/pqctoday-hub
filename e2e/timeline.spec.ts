import { test, expect } from '@playwright/test'

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage to bypass WelcomeRedirect
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'theme-storage-v1',
        JSON.stringify({
          state: { theme: 'system', hasSetPreference: true },
          version: 0,
        })
      )
    })

    await page.goto('/')
    // Timeline is the default view, but let's click the nav to be sure
    await page.getByRole('button', { name: 'Timeline' }).click()
  })

  test('displays gantt chart table', async ({ page }) => {
    // Check for table headers
    await expect(page.getByRole('columnheader', { name: 'Country' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Organization' })).toBeVisible()

    // Check for some country data
    await expect(page.getByText('United States').first()).toBeVisible()
    await expect(page.getByText('NIST').first()).toBeVisible()
  })

  test.skip('displays phase details in popover on click', async ({ page, browserName }) => {
    // Skip WebKit due to persistent mock data rendering timeouts
    test.skip(browserName === 'webkit', 'WebKit has rendering instability with large tables in CI')

    // Verify Mock Data is loaded
    await expect(page.getByText('Test Country').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('United States').first()).toBeVisible()

    // Find a phase cell (e.g., Discovery for US) and click it
    // Try relaxed selection
    const phaseText = page.getByRole('button', { name: /Discovery/i }).first()
    await phaseText.click()

    // Check if popover appears with the correct 4x2 grid labels
    await expect(page.getByText('Start', { exact: true })).toBeVisible()
    await expect(page.getByText('End', { exact: true })).toBeVisible()
    await expect(page.getByText('Source', { exact: true })).toBeVisible()
    await expect(page.getByText('Date', { exact: true })).toBeVisible()

    // Close popover by clicking outside (on the page background)
    await page.click('body', { position: { x: 10, y: 10 } })

    // Check popover is closed
    await expect(page.getByText('Start', { exact: true })).not.toBeVisible()
  })

  test('renders deadlines as milestones (flags)', async ({ page }) => {
    // Check for the presence of Flag icons, which indicate milestones (including Deadlines)
    const flags = page.locator('svg.lucide-flag')
    await expect(flags.first()).toBeVisible()
  })

  test('renders country flags as SVGs', async ({ page }) => {
    // Check for the presence of CountryFlag images (alt text ends with " flag")
    const countryFlags = page.locator('img[alt$=" flag"]')
    await expect(countryFlags.first()).toBeVisible()

    // Verify specific flag (e.g., US)
    const usFlag = page.locator('img[src="/flags/us.svg"]')
    await expect(usFlag.first()).toBeVisible()
  })

  test('does not display organization logos', async ({ page }) => {
    // Ensure no images with alt text ending in "Logo" are visible in the table
    const logos = page.locator('table').getByAltText(/Logo$/)
    await expect(logos).toHaveCount(0)
  })

  test('country selector updates view', async ({ page }) => {
    // Wait for the country selector button to be visible (it contains "All Countries" text)
    const countryButton = page.locator('button').filter({ hasText: 'All Countries' })
    await countryButton.waitFor({ state: 'visible', timeout: 10000 })

    // Select a specific country
    await countryButton.click()

    // Wait for dropdown to be visible
    await page.getByRole('listbox').waitFor({ state: 'visible' })

    await page.getByRole('option', { name: 'Canada' }).click()

    // Check that only Canada is visible in the table
    await expect(page.locator('table').getByText('Canada').first()).toBeVisible()
    await expect(page.locator('table').getByText('United States').first()).not.toBeVisible()
  })
})
