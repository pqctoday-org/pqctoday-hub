import { test, expect } from '@playwright/test'

test.describe('Changelog View', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset version tracking
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('navigates to changelog page', async ({ page }) => {
    await page.goto('/changelog')

    // Verify page title
    await expect(page.getByRole('heading', { name: 'Changelog' }).first()).toBeVisible()

    // Verify version is displayed
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible()
  })

  test('displays filter buttons', async ({ page }) => {
    await page.goto('/changelog')

    // Check filter buttons are present
    await expect(page.getByRole('button', { name: 'New Features' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enhancements' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bug Fixes' })).toBeVisible()
  })

  test('filters toggle changelog content', async ({ page }) => {
    await page.goto('/changelog')

    // Initially all filters should be active (content visible)
    const addedSection = page.locator('h3:has-text("Added")')
    await expect(addedSection.first()).toBeVisible()

    // Click "New Features" filter to disable it
    await page.getByRole('button', { name: 'New Features' }).click()

    // "Show all" link should appear when filter is disabled
    await expect(page.getByText('Show all')).toBeVisible()

    // Click "Show all" to restore
    await page.getByText('Show all').click()

    // All filters should be active again
    await expect(page.getByText('Show all')).not.toBeVisible()
  })

  test('has back to app link', async ({ page }) => {
    await page.goto('/changelog')

    // Check back link exists
    const backLink = page.getByRole('link', { name: /Back to App/i })
    await expect(backLink).toBeVisible()

    // Click and verify navigation
    await backLink.click()
    await expect(page).toHaveURL('/')
  })

  test('changelog link exists in About page', async ({ page }) => {
    await page.goto('/about')

    // Check for changelog link in About section
    const changelogLink = page.getByRole('link', { name: 'View Changelog' })
    await expect(changelogLink).toBeVisible()

    // Click and verify navigation
    await changelogLink.click()
    await expect(page).toHaveURL('/changelog')
  })
})

test.describe("What's New Toast", () => {
  test('toast appears on first visit', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())

    // Reload page to trigger toast
    await page.reload()

    // Wait for toast to appear (has 1s delay)
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: "What's New" })).toBeVisible()
  })

  test('toast can be dismissed', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Wait for toast
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 })

    // Click dismiss button
    await page.getByRole('button', { name: 'Dismiss notification' }).click()

    // Toast should disappear
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
  })

  test('toast does not reappear after dismissal', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Wait for and dismiss toast
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()

    // Reload page
    await page.reload()

    // Wait a bit more than the toast delay
    await page.waitForTimeout(2000)

    // Toast should not appear again
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
  })

  test('View Changelog button navigates to changelog', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Wait for toast
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 })

    // Click View Changelog
    await page.getByRole('link', { name: 'View Changelog' }).click()

    // Should navigate to changelog
    await expect(page).toHaveURL('/changelog')
  })
})
