// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — the headline goal of the 2026-05-22
 * audit (`pqctoday-priv/docs/platform/ux/page-audits/2026-05-22-persona-overwhelm/compliance.md`):
 *
 *   1. Returning Finance executive sees ≤ 5 top-level rows above the tab bar.
 *   2. The persona-hint CTA is a one-click navigation primitive — clicking
 *      "Go to Certification Schemes → FIPS 140-3" sets ?tab=certification
 *      and (P2-1) ?rtab=fips on the URL.
 *
 * Unit tests in `src/components/Compliance/ComplianceView.test.tsx` cover the
 * equivalent jsdom logic. This spec asserts the same claim against a real
 * browser viewport — important because the row-count assertion depends on
 * CSS-resolved DOM structure (`md:hidden`/`hidden md:block`) that jsdom
 * cannot evaluate.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Suppress disclaimer + WhatsNew overlays that intercept clicks.
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // Seed the persona store to executive + Finance & Banking so the audit
    // baseline scenario matches the plan's acceptance criterion #2.
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'global',
          selectedIndustry: 'Finance & Banking',
          selectedIndustries: ['Finance & Banking'],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
    // Returning-user state: intro card dismissed + about-strip collapsed.
    // First-visit defaults would push the row count up by 1 (the strip
    // mounts open) which is still within the ≤ 5 budget, but the plan's
    // acceptance criterion is explicitly framed for returning users.
    localStorage.setItem('compliance-intro-dismissed-v1', '1')
    localStorage.setItem('compliance-about-expanded-v1', '0')
  })
})

test('returning Finance executive sees ≤ 5 rows above the tab bar', async ({ page }) => {
  await page.goto('/compliance?tab=foryou')

  // Wait for the desktop tab bar anchor to mount — it's the natural sentinel
  // for "the page rendered". Compliance is lazy-loaded; allow 15s for the
  // chunk to compile cold.
  const tabBar = page.locator('#compliance-tabs')
  await expect(tabBar).toBeVisible({ timeout: 15000 })

  // Count the top-level visible bands rendered between the PageHeader and
  // the tab bar. The mobile shell (`md:hidden`) is invisible at default
  // chromium viewport (1280×720), so it should not be in the count.
  //
  // The ComplianceView root is `<div class="space-y-6 animate-fade-in">`
  // containing all chrome and then the desktop tab block at `#compliance-tabs`.
  // We collect the indices of every immediate child up to (but not including)
  // the tab bar, filtering out anything that's display: none / size 0.
  const aboveTabRowCount = await page.evaluate(() => {
    const tabBlock = document.getElementById('compliance-tabs')
    if (!tabBlock) return -1
    const root = tabBlock.parentElement
    if (!root) return -1
    let count = 0
    for (const child of Array.from(root.children)) {
      if (child === tabBlock) break
      const rect = child.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      // Skip the mobile shell (it's `md:hidden` and computes to display:none
      // at desktop widths; the bounding-rect check above already excludes it
      // but be explicit so future class refactors don't break the count).
      const cs = window.getComputedStyle(child)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      count += 1
    }
    return count
  })

  // Returning Finance executive: PageHeader · AboutThisPageStrip (collapsed)
  // · PersonaHintCta · DeadlineTimelineGate · (PreviewBanner only when
  // persona=curious, not in this scenario). Expected = 4. Budget = 5.
  expect(aboveTabRowCount).toBeGreaterThan(0)
  expect(aboveTabRowCount).toBeLessThanOrEqual(5)
})

test('persona-hint CTA click navigates to ?tab=certification with sub-facet', async ({ page }) => {
  await page.goto('/compliance?tab=foryou')

  // CTA is rendered both in the page chrome (visible at desktop width) and
  // inside the mobile shell (hidden via md:hidden). Filter to the visible
  // instance to avoid clicking a hidden duplicate.
  const cta = page
    .getByRole('button', { name: /Go to Certification Schemes → FIPS 140-3/i })
    .filter({ visible: true })
    .first()
  await expect(cta).toBeVisible({ timeout: 15000 })

  await cta.click()

  // P0-1 acceptance: URL must reflect the section jump.
  await expect(page).toHaveURL(/[?&]tab=certification(&|$)/, { timeout: 5000 })
  // P2-1 acceptance: Finance industry hint carries subFacet.rtab='fips'.
  await expect(page).toHaveURL(/[?&]rtab=fips(&|$)/)
})
