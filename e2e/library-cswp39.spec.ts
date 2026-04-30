// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Library tile CSWP 39 cluster — verify the auto-derived link from a
 * library doc → /business zone (via pillar pill) and → /compliance
 * CSWP39Explorer filtered by ref_id (via the "N reqs" link).
 *
 * Uses `BSI TR-02102-2` as a target — it has 26 enriched requirements
 * spanning multiple pillars in the current `pqc_maturity_governance_*.csv`
 * dataset, so the cluster is reliably present.
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

test('library tile CSWP 39 pillar pill jumps to /business zone', async ({ page }) => {
  await page.goto('/library?q=BSI+TR-02102-2')

  // Wait for the CSWP 39 cluster to mount on the matching tile.
  const cluster = page.getByText('CSWP 39').first()
  await expect(cluster).toBeVisible()

  // Any zone pill on the cluster — BSI TR-02102-2 carries lifecycle/inventory/
  // observability/assurance but not governance, so don't pin to a specific
  // pillar. The href + URL change after click is the actual contract under
  // test. The /business view itself renders a Welcome state when there are
  // no artifacts (metrics.isFullyEmpty), which is the default in a fresh
  // test browser — so we assert URL hash only, not the destination DOM.
  const pillarPill = page.locator('a[href^="/business#zone-"]').first()
  await expect(pillarPill).toBeVisible()
  const href = await pillarPill.getAttribute('href')
  expect(href).toMatch(
    /^\/business#zone-(governance|assets|management-tools|risk-management|mitigation|migration)$/
  )
  await pillarPill.click()
  await expect(page).toHaveURL(new RegExp(href!.replace('#', '\\#')))
})

test('library tile "N reqs" link deep-links into the Compliance CSWP 39 explorer', async ({
  page,
}) => {
  await page.goto('/library?q=BSI+TR-02102-2')

  const reqsLink = page.locator('a[href*="/compliance?tab=cswp39&evref="]').first()
  await expect(reqsLink).toBeVisible()
  await reqsLink.click()

  await expect(page).toHaveURL(/\/compliance.*tab=cswp39.*evref=/)
})
