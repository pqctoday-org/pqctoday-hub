// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Timeline freshness badge (C9). Verifies that, on /timeline, at least one
 * event card renders the freshness pill and that the freshness state derived
 * from `lastVerifiedDate` (sourceDate) is one of the three known values.
 *
 * We do not seed a synthetic "stale" date — the live dataset already contains
 * events spanning years, so at least one of {current, stale, critical} is
 * guaranteed. This keeps the test stable as the dataset evolves.
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

test('at least one timeline event surfaces a freshness badge', async ({ page }) => {
  await page.goto('/timeline?country=United%20States')
  await page.waitForLoadState('networkidle')

  const badges = page.locator('[data-testid="timeline-freshness-badge"]')
  await expect(badges.first()).toBeVisible({ timeout: 10_000 })

  const state = await badges.first().getAttribute('data-freshness')
  expect(['current', 'stale', 'critical']).toContain(state)
})

test('freshness badge has accessible label naming the state', async ({ page }) => {
  await page.goto('/timeline?country=United%20States')
  await page.waitForLoadState('networkidle')

  const badge = page.locator('[data-testid="timeline-freshness-badge"]').first()
  await expect(badge).toBeVisible({ timeout: 10_000 })
  const aria = await badge.getAttribute('aria-label')
  expect(aria).toMatch(/^Source freshness: (Current|Stale|Critical)$/)
})
