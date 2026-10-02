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
  // The whole-test budget must exceed the 60 s results wait below plus page load,
  // trigger wait and input wait. The config default (45 s) would cut the wait
  // short locally; the nightly passes --timeout=180000, which already covers it.
  test.setTimeout(120_000)

  await page.goto('/library')
  await page.waitForLoadState('networkidle')

  // Open via the search button (visible on desktop). On mobile/Webkit it may
  // not exist — use ⌘K keyboard fallback in that case.
  //
  // Wait for the trigger rather than counting it once: on a cold GitHub
  // runner `networkidle` fires before the header has hydrated, `count()`
  // returned 0, and the ⌘K fallback went to a page that could not hear it
  // yet — the palette never opened (nightly 2026-09-22, three retries).
  // 15 s is the suite's budget for lazy chrome, same as the results wait.
  const searchTrigger = page.getByRole('button', { name: /Search \(⌘K\)/ })
  const triggerShown = await searchTrigger
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false)
  if (triggerShown) {
    await searchTrigger.first().click()
  } else {
    await page.keyboard.press('Meta+K')
  }

  // The palette renders an input. Use placeholder/role to find it.
  const input = page.locator('input[placeholder*="Search" i], input[type="search"]').first()
  await expect(input).toBeVisible({ timeout: 15_000 })
  await input.fill('ML-KEM')

  // At least one result row should appear. Result rows have a recognisable
  // structure but no fixed test id; rely on text presence.
  //
  // 60s, not 5s or 15s. The palette pre-loads the search index on first ⌘K open
  // (SearchIndex.ts → unified.loadCached()): fetch public/data/rag-corpus.json
  // (currently ~27.8 MB / 26.5 MiB), JSON.parse, build the MiniSearch index in
  // slices (no saved copy since 2026-10-01). Locally that lands in ~2.4 s (file
  // warm in the HTTP cache), but on a 2-4 vCPU GitHub runner time-to-first-result
  // measured ~10-25 s (~10 s at 4x CPU throttle, 25-53 s at 8x), so the nightly
  // failed 3/3 on 27 Sep and again on 30 Sep against a 15 s assertion. It is a
  // load-time flake, not a regression: the palette opens and accepts input every
  // time, only the results are late. 60 s is a ceiling, not an expected latency —
  // a passing run still returns as soon as the first result renders.
  await expect(
    page.locator('[role="option"], [role="listbox"] button, [role="listbox"] a').first()
  ).toBeVisible({ timeout: 60_000 })
})
