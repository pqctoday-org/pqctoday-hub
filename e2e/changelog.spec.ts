// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('Changelog View', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and suppress WhatsNew toast
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.clear()
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 1 })
      )
      window.localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 1 })
      )
    })
  })

  test('navigates to changelog page', async ({ page }) => {
    await page.goto('/changelog')

    // Verify page title
    await expect(page.getByRole('heading', { name: 'Changelog' }).first()).toBeVisible()

    // Verify version is displayed (use first() — multiple version strings may exist on the page)
    await expect(page.getByText(/v\d+\.\d+\.\d+/).first()).toBeVisible()
  })

  test('displays filter buttons', async ({ page }) => {
    await page.goto('/changelog')

    // Check filter buttons are present
    await expect(page.getByRole('button', { name: 'New Features' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Improvements' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bug Fixes' })).toBeVisible()
  })

  test('filters toggle changelog content', async ({ page }) => {
    await page.goto('/changelog')

    // Initially all filters should be active (content visible)
    const addedSection = page.getByText('New Features', { exact: true })
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
  const seedOldVersion = async (page: import('@playwright/test').Page) => {
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 1 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '1.0.0', isFirstVisit: false }, version: 2 })
      )
    })
  }

  test('toast appears on version update', async ({ page }) => {
    // Simulate visit from an older version
    await page.goto('/')
    await seedOldVersion(page)

    // Reload page to trigger toast
    await page.reload()

    // Wait for toast to appear (has 1s delay)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: "What's New" })).toBeVisible()
  })

  test('toast can be dismissed', async ({ page }) => {
    await page.goto('/')
    await seedOldVersion(page)
    await page.reload()

    // Wait for toast
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

    // Click dismiss button
    await page.getByRole('button', { name: 'Got it' }).click()

    // Toast should disappear
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('toast does not reappear after dismissal', async ({ page }) => {
    await page.goto('/')
    await seedOldVersion(page)
    await page.reload()

    // Wait for and dismiss toast
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Got it' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Reload page
    await page.reload()

    // Wait past the 1000ms toast delay to confirm it doesn't re-appear
    await page.waitForFunction(() => new Promise((r) => setTimeout(r, 1500)))

    // Toast should not appear again
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('View Changelog button navigates to changelog', async ({ page }) => {
    await page.goto('/')
    await seedOldVersion(page)
    await page.reload()

    // Wait for toast
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

    // Click View Changelog
    await page.getByRole('button', { name: 'View Full Changelog' }).click()

    // Should navigate to changelog
    await expect(page).toHaveURL('/changelog')
  })
})
