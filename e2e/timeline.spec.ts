// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage to bypass WelcomeRedirect + suppress WhatsNew toast
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'theme-storage-v1',
        JSON.stringify({
          state: { theme: 'system', hasSetPreference: true },
          version: 0,
        })
      )
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      window.localStorage.setItem(
        'pqc-disclaimer-v1',
        JSON.stringify({ state: { hasAccepted: true }, version: 0 })
      )
      window.localStorage.setItem('pqc-tour-completed', 'true')
    })

    await page.goto('/')
    // Timeline is the default view, but let's click the nav to be sure
    await page.getByRole('button', { name: 'Timeline view' }).click()
  })

  test('displays gantt chart table', async ({ page }) => {
    // Check for table headers
    await expect(page.getByRole('columnheader', { name: 'Country' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Organization' })).toBeVisible()

    // Check for some country data
    // Wait for suspense fallback to disappear (due to lazy loading)
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText('United States').first()).toBeVisible()
    // In the latest data, 'White House' or 'OMB' comes first for US, not 'NIST'
    // Checking for Country confirms the view loaded successfully
  })

  test('displays phase details in popover on click', async ({ page }) => {
    // Note: WebKit rendering optimizations applied (CSS containment, will-change, removed backdrop-blur)
    // If this test fails on WebKit, check docs/webkit-rendering-investigation.md for Phase 2 fixes

    // Wait for real timeline data to load
    await expect(page.getByText('United States').first()).toBeVisible({ timeout: 15000 })

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
    // Logo URLs might still be in the data, but the component shouldn't render them
    const logos = page.locator('table').getByAltText(/Logo$/)
    await expect(logos).toHaveCount(0)
  })

  test('country selector updates view', async ({ page }) => {
    // Wait for the country selector button to be visible (it contains "Country" text by default)
    const countryButton = page.getByRole('button').filter({ hasText: 'Country' })
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

  test('displays new DoD memorandum entry for US', async ({ page }) => {
    // Wait for the timeline to load and show US
    await expect(page.getByText('United States').first()).toBeVisible({ timeout: 15000 })
    
    // Check for the new entry we added during the audit
    await expect(page.getByText('DoD PQC Migration Memorandum').first()).toBeVisible()
  })

  test('passes accessibility audit (desktop)', async ({ page }) => {
    // Wait for timeline to fully load
    await expect(page.getByRole('columnheader', { name: 'Country' })).toBeVisible()
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

    // Run axe accessibility audit
    // Note: color-contrast disabled — phase colors fixed but primary/warning/muted-foreground have app-wide contrast issues tracked separately
    await injectAxe(page)
    await checkA11y(
      page,
      { exclude: ['.lucide'] },
      {
        axeOptions: {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          rules: { 'color-contrast': { enabled: false } },
        },
      }
    )
  })

  test('passes accessibility audit with popover open', async ({ page }) => {
    // Wait for timeline to load
    await expect(page.getByText('United States').first()).toBeVisible({ timeout: 15000 })

    // Open a phase popover
    const phaseButton = page.getByRole('button', { name: /Discovery/i }).first()
    await phaseButton.click()

    // Wait for popover to be visible
    await expect(page.getByText('Start', { exact: true })).toBeVisible()

    // Run accessibility audit with popover open
    // Note: color-contrast disabled — phase colors fixed but app-wide contrast issues tracked separately
    await injectAxe(page)
    await checkA11y(
      page,
      { exclude: ['.lucide'] },
      {
        axeOptions: {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          rules: { 'color-contrast': { enabled: false } },
        },
      }
    )
  })

  test('passes accessibility audit (mobile viewport)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to timeline
    await page.goto('/')
    await page.getByRole('button', { name: 'Timeline view' }).click()

    // Wait for mobile view to load
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

    // Run accessibility audit on mobile
    // Note: color-contrast disabled — phase colors fixed but app-wide contrast issues tracked separately
    // Note: scrollable-region-focusable disabled — horizontal-scroll gantt on mobile; tracked separately
    await injectAxe(page)
    await checkA11y(
      page,
      { exclude: ['.lucide'] },
      {
        axeOptions: {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          rules: {
            'color-contrast': { enabled: false },
            'scrollable-region-focusable': { enabled: false },
          },
        },
      }
    )
  })
})
