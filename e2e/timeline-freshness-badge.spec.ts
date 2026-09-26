// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Timeline evidence badge date chip. Until 2026-09-24 the badge coloured each
 * event Current/Stale/Critical from its PUBLICATION date (a 2022 roadmap read
 * red "Critical" for being old). It now shows `Published <date>` as a neutral
 * chip (timeline remediation r2 T-B3); this spec pins that on /timeline.
 * File name kept: it is listed in playwright.config.ts's smoke set.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
})

// The freshness badge renders inside the DocumentTable, which is only mounted
// when a specific country is selected in the Gantt. Deep-link via ?country= to
// pin the country up-front; "United States" is reliably present in the dataset.

test('timeline events show their publication date, not a freshness state', async ({ page }) => {
  await page.goto('/timeline?country=United%20States')
  await page.waitForLoadState('networkidle')

  const chips = page.locator('[data-testid="timeline-published-date"]')
  await expect(chips.first()).toBeVisible({ timeout: 10_000 })
  await expect(chips.first()).toHaveText(/^Published \d{4}(-\d{2}){0,2}$/)
  // The retired publication-age pill must not come back.
  await expect(page.locator('[data-testid="timeline-freshness-badge"]')).toHaveCount(0)
})
