// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Library detail drawer CSWP 39 cluster — verify the auto-derived link from
 * a library doc → /business zone (via pillar pill) and → /compliance
 * CSWP39Explorer filtered by ref_id (via the evidence-map link).
 *
 * Uses `NIST CSWP 39` as a target — it's the only ref_id with rows in the
 * current `pqc_maturity_governance_requirements_07192026.csv` (34 rows
 * spanning all 5 pillars), so the cluster is reliably present. The
 * `BSI TR-02102-2` doc the original (quarantined) version of this spec
 * targeted has since dropped out of that dataset. Opened directly via the
 * `?ref=` deep-link (LibraryViewRedesign.tsx's real drawer-open mechanism)
 * rather than simulating a search + card click.
 *
 * UN-QUARANTINED 2026-08-02 (design_handoff_2026_pages/IMPLEMENTATION-PLAN-
 * LIBRARY-2026-08-01.md §3.2): the CSWP-39 pillar-pill and evidence-map
 * link were removed with the legacy library card (commit 13a35844) and had
 * no equivalent in the redesign drawer. Both are now restored in
 * LibraryDetailDrawer.tsx (the default redesign detail view) and
 * LibraryDetailPopover.tsx (the legacy table-view popover). Rewritten
 * against the drawer instead of the deleted card. See e2e/TRIAGE.md.
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

test('library detail drawer pillar pill jumps to /business zone', async ({ page }) => {
  await page.goto(`/library?ref=${encodeURIComponent('NIST CSWP 39')}`)

  // Any zone pill in the drawer's CSWP-39 requirements section — NIST
  // CSWP 39 spans all 5 pillars, so don't pin to a specific one. The href +
  // URL change after click is the actual contract under test. The
  // /business view itself renders a Welcome state when there are no
  // artifacts (metrics.isFullyEmpty), which is the default in a fresh test
  // browser — so we assert URL hash only, not the destination DOM.
  const pillarPill = page.locator('a[href^="/business#zone-"]').first()
  await expect(pillarPill).toBeVisible()
  const href = await pillarPill.getAttribute('href')
  expect(href).toMatch(
    /^\/business#zone-(governance|assets|management-tools|risk-management|mitigation|migration)$/
  )
  await pillarPill.click()
  await expect(page).toHaveURL(new RegExp(href!.replace('#', '\\#')))
})

test('library detail drawer evidence-map link deep-links into the Compliance CSWP 39 explorer', async ({
  page,
}) => {
  await page.goto(`/library?ref=${encodeURIComponent('NIST CSWP 39')}`)

  const evidenceLink = page.locator('a[href*="/compliance?tab=cswp39&evref="]').first()
  await expect(evidenceLink).toBeVisible()
  await evidenceLink.click()

  await expect(page).toHaveURL(/\/compliance.*tab=cswp39.*evref=/)
})
