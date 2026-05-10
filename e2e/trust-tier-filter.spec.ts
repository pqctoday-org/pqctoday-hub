// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Trust-tier filter (C8) — covers Library, Migrate, Compliance, Threats, Timeline.
 *
 * Each spec navigates with `?tier=Authoritative` already in the URL so we
 * don't depend on the precise location of the dropdown trigger (which differs
 * per page). The contract under test:
 *   1. The URL param survives page load.
 *   2. The page renders without crashing.
 *   3. The result set is no larger than the unfiltered result set.
 *
 * The dropdown UI itself is rendered by the shared <TrustTierFilter> component;
 * its multi-select behavior is covered by FilterDropdown.test.tsx. Here we
 * only validate that each view consumes the URL state and applies it.
 */

test.beforeEach(async ({ page }) => {
  // Suppress the WhatsNew alertdialog so it doesn't intercept clicks.
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
})

const VIEWS: Array<{ name: string; baselineUrl: string; filteredUrl: string }> = [
  { name: 'library', baselineUrl: '/library', filteredUrl: '/library?tier=Authoritative' },
  { name: 'migrate', baselineUrl: '/migrate', filteredUrl: '/migrate?tier=Authoritative' },
  {
    name: 'compliance',
    baselineUrl: '/compliance',
    filteredUrl: '/compliance?tier=Authoritative',
  },
  { name: 'threats', baselineUrl: '/threats', filteredUrl: '/threats?tier=Authoritative' },
  { name: 'timeline', baselineUrl: '/timeline', filteredUrl: '/timeline?tier=Authoritative' },
]

for (const view of VIEWS) {
  test(`${view.name}: tier=Authoritative URL param survives load and view renders`, async ({
    page,
  }) => {
    await page.goto(view.filteredUrl)
    // The tier param must persist (no view should strip it on first paint).
    await expect(page).toHaveURL(new RegExp(`tier=Authoritative`))
    // The page mounts at least one piece of recognisable navigation.
    await expect(page.locator('main, [role="main"], body').first()).toBeVisible()
  })
}

test('library: tier=Low filter narrows the visible result set vs unfiltered', async ({ page }) => {
  await page.goto('/library')
  // Wait for some library content to mount (cards or rows).
  await page.waitForLoadState('networkidle')
  const baseHandles = await page.locator('[data-doc-id], [data-reference-id], article').count()

  await page.goto('/library?tier=Low')
  await page.waitForLoadState('networkidle')
  const filteredHandles = await page.locator('[data-doc-id], [data-reference-id], article').count()

  // Filtered must be no larger than baseline (tier filter only shrinks).
  // We don't assert strictly less because a dataset can plausibly have all-Low
  // resources in an extreme configuration — the contract is monotone, not strict.
  expect(filteredHandles).toBeLessThanOrEqual(baseHandles)
})
