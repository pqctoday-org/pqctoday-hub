// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * ⌘K command palette + tier-aware ordering smoke (C6).
 *
 * Verifies:
 *   1. The palette opens via the ⌘K trigger button.
 *   2. Typing a query returns at least one result.
 *
 * Strict tier-ordering across results is exercised at the unit level
 * (RetrievalService.tier.test.ts + UnifiedSearchService.singleton.test.ts).
 * Pinning specific result orderings here would couple the test to the
 * current corpus snapshot; instead we assert that the palette renders
 * without regression.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
})

test('command palette opens and returns ranked results for "ML-KEM"', async ({ page }) => {
  await page.goto('/library')
  await page.waitForLoadState('networkidle')

  // Open via the search button (visible on desktop). On mobile/Webkit it may
  // not exist — use ⌘K keyboard fallback in that case.
  const searchTrigger = page.getByRole('button', { name: /Search \(⌘K\)/ })
  if (await searchTrigger.count()) {
    await searchTrigger.first().click()
  } else {
    await page.keyboard.press('Meta+K')
  }

  // The palette renders an input. Use placeholder/role to find it.
  const input = page.locator('input[placeholder*="Search" i], input[type="search"]').first()
  await expect(input).toBeVisible({ timeout: 5_000 })
  await input.fill('ML-KEM')

  // At least one result row should appear within 5s. Result rows have a
  // recognisable structure but no fixed test id; rely on text presence.
  await expect(
    page.locator('[role="option"], [role="listbox"] button, [role="listbox"] a').first()
  ).toBeVisible({ timeout: 5_000 })
})
