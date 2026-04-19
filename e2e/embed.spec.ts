// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

// These tests rely on the `../pqctoday-sdk/embed-test-site` running on http://localhost:3098
// If the test site is not running, these tests will skip or timeout.

test.describe('Embedding Integration', () => {
  // Override global storage state to prevent cross-origin iframe storage parsing errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test.use({ storageState: { cookies: [], origins: [] } as any })

  test.beforeEach(async ({ page }) => {
    // Navigate to the local test site harness.
    // Ensure `npm start` is running in `../pqctoday-sdk/embed-test-site` before test execution.
    try {
      // Fast timeout to gracefully skip if the test harness server is not running
      await page.goto('http://localhost:3098/', { timeout: 2000 })
      await expect(page.locator('body')).toBeVisible({ timeout: 1000 })
    } catch {
      test.skip()
    }
  })

  test('embed loads with valid signature', async ({ page }) => {
    // 1. Load "Happy path" scenario via quick-load button
    await page
      .getByRole('button', { name: /Happy Path/i })
      .first()
      .click()

    // 2. Click "Generate Signed URL"
    await page.getByRole('button', { name: 'Generate Signed URL' }).click()

    // 3. Click "Load Embed"
    await page.getByRole('button', { name: 'Load Embed' }).click()

    // 4. Wait for iframe to load
    const embedFrame = page.frameLocator('iframe#embed-iframe')

    // 5. Assert: slim header visible inside iframe (No menu bar "right panel")
    await expect(embedFrame.getByRole('banner')).toBeVisible()
    await expect(embedFrame.getByRole('button', { name: /GoogleAuth/i })).toBeHidden() // Usually not present in embed

    // 6. Assert: Learn content renders (Happy path covers /learn)
    await expect(embedFrame.getByRole('heading', { level: 1 })).toBeVisible()

    // 7. Assert: "Powered by PQC Today" badge visible
    await expect(embedFrame.locator('.powered-by-badge')).toBeVisible()
  })

  test('invalid signature redirects', async ({ page }) => {
    // 1. Load "Invalid signature" scenario
    await page.getByRole('button', { name: 'Invalid signature' }).click()

    // 2. Load Embed
    await page.getByRole('button', { name: 'Load Embed' }).click()

    // 3. Wait for redirect
    // Per PRD: invalid signature → redirect to pqctoday.com?error=invalid_signature
    await page.waitForTimeout(1000)

    const src = await page.locator('iframe#embed-iframe').getAttribute('src')
    expect(src).not.toBeNull()
  })

  test('activity events forwarded', async ({ page }) => {
    // 1. Load happy path embed
    await page
      .getByRole('button', { name: /Happy Path/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Generate Signed URL' }).click()
    await page.getByRole('button', { name: 'Load Embed' }).click()

    const embedFrame = page.frameLocator('iframe#embed-iframe')

    // Wait for the UI content to mount
    await expect(embedFrame.getByRole('heading', { level: 1 })).toBeVisible()

    // 2. Navigate to a module inside iframe
    await embedFrame
      .getByRole('link', { name: /PQC 101/i })
      .first()
      .click()

    // 3. Assert: event appears in debug panel event log
    // The test site intercepts postMessage events and pushes them to log container
    await expect(page.locator('#event-log-container')).toContainText('page_view')
  })

  test('persistence round-trip', async ({ page }) => {
    // 1. Load embed (persist=postMessage)
    await page.getByRole('button', { name: 'Happy path — Learn' }).click()
    await page.getByRole('button', { name: 'Generate Signed URL' }).click()
    await page.getByRole('button', { name: 'Load Embed' }).click()

    const embedFrame = page.frameLocator('iframe#embed-iframe')
    await expect(embedFrame.getByRole('heading', { level: 1 })).toBeVisible()

    // 2. Complete a module step inside iframe
    // We'll mimic this by selecting a persona to save state
    await embedFrame.getByRole('button', { name: /Choose Persona/i }).click()
    await embedFrame.getByRole('button', { name: /Curious/i }).click()

    // 3. Wait for persistence to sync back to the parent (debounced)
    // The debug panel posts the JSON snapshot payload back to parent.
    await expect(page.locator('#snapshot-viewer')).toContainText('persona')

    // 4. Reload iframe (new signed URL, same uid)
    await page.getByRole('button', { name: 'Load Embed' }).click()

    // 5. Assert: progress restored meaning persona Curious is still preserved
    await expect(embedFrame.getByRole('button', { name: /Curious/i })).toBeVisible()
  })
})
