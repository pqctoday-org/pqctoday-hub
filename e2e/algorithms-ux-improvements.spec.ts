// SPDX-License-Identifier: AGPL-3.0-only
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

  test('Detailed tab — comparison guidance and measured hardware case study are present', async ({
    page,
  }) => {
    await page.goto('/algorithms?tab=detailed')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText('How to compare responsibly.')).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(/Measured hardware case study: signing throughput/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Browse all/i })).toBeVisible()
    await expect(
      page
        .getByRole('group', { name: 'Detailed comparison view mode' })
        .getByRole('button', { name: /Compare side-by-side/i })
    ).toBeVisible()
  })

  test('Validation tab — Known-answer checks opens and states its evidence boundary', async ({
    page,
  }) => {
    await page.goto('/algorithms?tab=validation')
    await page.waitForLoadState('domcontentloaded')
    const katHeader = page.getByRole('button', { name: /^Known-answer checks/i })
    await expect(katHeader).toBeVisible({ timeout: 30000 })
    await expect(katHeader).toHaveAttribute('aria-expanded', 'false')
    await katHeader.click()
    await expect(katHeader).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('Known-answer and functional tests')).toBeVisible({
      timeout: 15000,
    })
    await page.getByText('Why KATs matter').click()
    await expect(page.getByText(/neither happens here/)).toBeVisible()
  })

  test('AlgorithmEntryStrip — appears on fresh session, dismisses on X click', async ({ page }) => {
    // Clear persona so we get the 3-intent picker (not persona-specific CTA).
    // NOTE: do NOT clear `algorithms-entry-strip-dismissed` here — addInitScript
    // re-runs on the page.reload() below, so wiping the flag would defeat the
    // very persistence this test asserts. A fresh context already has empty
    // sessionStorage, so the strip shows on first load without clearing it.
    await page.addInitScript(() => {
      localStorage.removeItem('pqc-learning-persona')
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
    // A fresh session at mobile width shows the "Who's asking?" persona
    // picker before any requested page — MainLayout's isMobileFirstRun gate.
    // Seed a persona so the test reaches the wizard itself, same pattern as
    // sim-mobile.spec.ts's seedUnlockedAssessment.
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({ state: { selectedPersona: 'architect' }, version: 10 })
      )
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/algorithms?tab=transition')
    await page.waitForLoadState('domcontentloaded')

    // Wizard step 1 question
    await expect(page.getByText('What are you replacing?')).toBeVisible({ timeout: 30000 })

    // "Show full table" escape hatch
    await expect(page.getByText('Show full table →')).toBeVisible()
  })

  test('Mobile wizard — Show full table / Back to wizard toggle', async ({ page }) => {
    // Same mobile first-run persona gate as the test above.
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({ state: { selectedPersona: 'architect' }, version: 10 })
      )
    })
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
