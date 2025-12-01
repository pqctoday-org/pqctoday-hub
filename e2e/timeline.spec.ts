import { test, expect } from '@playwright/test'

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Timeline is the default view, but let's click the nav to be sure
    await page.getByRole('button', { name: 'Timeline' }).click()
  })

  test('displays gantt chart table', async ({ page }) => {
    // Check for table headers
    await expect(page.getByRole('columnheader', { name: 'Country' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Organization' })).toBeVisible()

    // Check for some country data
    await expect(page.getByText('Test Country')).toBeVisible()
    await expect(page.getByText('Test Org')).toBeVisible()
  })

  test('displays phase details in popover on click', async ({ page }) => {
    // Find a phase cell (e.g., Discovery for US) and click it
    const phaseText = page.getByText('Discovery', { exact: true }).first()
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

    await page.getByRole('option', { name: 'Another Country' }).click()

    // Check that only Another Country is visible in the table
    await expect(page.locator('table').getByText('Another Country')).toBeVisible()
    await expect(page.locator('table').getByText('Test Country')).not.toBeVisible()
  })
})
