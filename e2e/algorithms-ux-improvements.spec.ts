// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.setTimeout(60000)

// Suppress WhatsNew toast that intercepts clicks
const SUPPRESS_WHATS_NEW = {
  key: 'pqc-version-storage',
  value: JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 }),
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((kv) => localStorage.setItem(kv.key, kv.value), SUPPRESS_WHATS_NEW)
})

test.describe('Algorithms UX — Phase 1+2+3', () => {
  test('Transition tab — AlgorithmCheckButton appears per row on desktop', async ({ page }) => {
    await page.goto('/algorithms?tab=transition')
    await page.waitForLoadState('domcontentloaded')

    // Wait for transition table rows to load
    await page.waitForSelector('tbody tr', { timeout: 30000 })

    // AlgorithmCheckButton renders inside td — it has a play/run icon button
    // Look for buttons inside table cells that are below the CTA strip
    const tdButtons = page.locator('td button').first()
    await expect(tdButtons).toBeVisible({ timeout: 15000 })
  })

  test('Protocol Support tab — heatmap cells render with tooltip text', async ({ page }) => {
    await page.goto('/algorithms?tab=support')
    await page.waitForLoadState('domcontentloaded')

    // Protocol matrix defaults to heatmap — wait for the Heatmap button to confirm
    const heatmapBtn = page.getByRole('button', { name: /heatmap/i })
    await heatmapBtn.waitFor({ timeout: 20000 })
    // Ensure we are in heatmap mode (aria-pressed="true")
    if ((await heatmapBtn.getAttribute('aria-pressed')) !== 'true') {
      await heatmapBtn.click()
    }

    // DimensionBadge renders as a <span title="..."> inside table cells
    const badgeSpans = page.locator('td span[title]')
    await badgeSpans.first().waitFor({ timeout: 20000 })
    const titleVal = await badgeSpans.first().getAttribute('title')
    expect(titleVal).toBeTruthy()
    expect((titleVal ?? '').length).toBeGreaterThan(0)
  })

  test('Detailed tab — 6 collapsible sections, 3 open by default', async ({ page }) => {
    await page.goto('/algorithms?tab=detailed')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#section-performance', { timeout: 30000 })

    // Dismiss disclaimer if present
    const disclaimer = page
      .locator('[role="alert"]')
      .filter({ hasText: /educational/i })
      .first()
    if (await disclaimer.isVisible({ timeout: 2000 }).catch(() => false)) {
      const dismissBtn = disclaimer.locator('button').first()
      if (await dismissBtn.isVisible()) await dismissBtn.click()
      await page.waitForTimeout(300)
    }

    // The 3 default-open sections should have expanded content
    await expect(page.locator('#section-body-performance')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#section-body-security')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#section-body-sizes')).toBeVisible({ timeout: 5000 })

    // The 3 collapsed sections should NOT have visible body
    await expect(page.locator('#section-body-usecases')).not.toBeVisible()
    await expect(page.locator('#section-body-attacks')).not.toBeVisible()
    await expect(page.locator('#section-body-kat')).not.toBeVisible()
  })

  test('Detailed tab — clicking collapsed KAT section header opens it', async ({ page }) => {
    await page.goto('/algorithms?tab=detailed')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#section-kat', { timeout: 30000 })

    // Dismiss disclaimer
    const disclaimer = page
      .locator('[role="alert"]')
      .filter({ hasText: /educational/i })
      .first()
    if (await disclaimer.isVisible({ timeout: 2000 }).catch(() => false)) {
      const dismissBtn = disclaimer.locator('button').first()
      if (await dismissBtn.isVisible()) {
        await dismissBtn.click()
        await page.waitForTimeout(400)
      }
    }

    // KAT body should be collapsed initially
    await expect(page.locator('#section-body-kat')).not.toBeVisible()

    // Click the KAT section header (direct child button)
    const katHeader = page.locator('#section-kat > button[type="button"]')
    await katHeader.scrollIntoViewIfNeeded()
    await katHeader.click()

    // KAT body should now be visible
    await expect(page.locator('#section-body-kat')).toBeVisible({ timeout: 5000 })

    // aria-expanded should reflect open state
    await expect(katHeader).toHaveAttribute('aria-expanded', 'true')
  })

  test('AlgorithmEntryStrip — appears on fresh session, dismisses on X click', async ({ page }) => {
    // Clear persona so we get the 3-intent picker (not persona-specific CTA)
    await page.addInitScript(() => {
      localStorage.removeItem('pqc-learning-persona')
      sessionStorage.removeItem('algorithms-entry-strip-dismissed')
    })
    await page.goto('/algorithms')
    await page.waitForLoadState('domcontentloaded')

    // The dismiss button is unique to the entry strip
    const xBtn = page.locator('button[aria-label="Dismiss"]').first()
    await expect(xBtn).toBeVisible({ timeout: 15000 })

    // Verify the strip shows intent choices
    await expect(page.getByText('What are you trying to do?')).toBeVisible()

    // Dismiss via X
    await xBtn.click()

    // Strip should disappear
    await expect(page.getByText('What are you trying to do?')).not.toBeVisible({ timeout: 3000 })

    // Reload — stays dismissed (sessionStorage persists in session)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByText('What are you trying to do?')).not.toBeVisible()
  })

  test('Mobile wizard — shows step 1 on narrow viewport for transition tab', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/algorithms?tab=transition')
    await page.waitForLoadState('domcontentloaded')

    // Wizard step 1 question
    await expect(page.getByText('What are you replacing?')).toBeVisible({ timeout: 30000 })

    // "Show full table" escape hatch
    await expect(page.getByText('Show full table →')).toBeVisible()
  })

  test('Mobile wizard — Show full table / Back to wizard toggle', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/algorithms?tab=transition')
    await page.waitForLoadState('domcontentloaded')

    // Wait for wizard
    await page.getByText('What are you replacing?').waitFor({ timeout: 30000 })

    // Dismiss the disclaimer so it doesn't intercept clicks at bottom of page
    const disclaimerClose = page.locator('button[aria-label="Close disclaimer"]')
    if (await disclaimerClose.isVisible({ timeout: 3000 }).catch(() => false)) {
      await disclaimerClose.click()
      await page.waitForTimeout(300)
    }

    // Click "Show full table" via JS click to avoid overlay interference
    const fullTableBtn = page.getByText('Show full table →')
    await fullTableBtn.dispatchEvent('click')

    // Full table view: sort bar + back link
    await expect(page.getByText('← Back to wizard')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Sort by:')).toBeVisible()

    // Back to wizard
    await page.getByText('← Back to wizard').click()
    await expect(page.getByText('What are you replacing?')).toBeVisible({ timeout: 5000 })
  })
})
