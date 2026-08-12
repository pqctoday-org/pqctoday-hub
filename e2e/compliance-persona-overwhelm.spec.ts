// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — the headline goal of the 2026-05-22
 * audit (`pqctoday-priv/docs/platform/ux/page-audits/2026-05-22-persona-overwhelm/compliance.md`):
 *
 *   Returning Finance executive sees ≤ 5 top-level rows above the tab bar.
 *
 * Unit tests in `src/components/Compliance/ComplianceView.test.tsx` cover the
 * equivalent jsdom logic. This spec asserts the same claim against a real
 * browser viewport — important because the row-count assertion depends on
 * CSS-resolved DOM structure (`md:hidden`/`hidden md:block`) that jsdom
 * cannot evaluate.
 *
 * RETIRED 2026-08-12 — the second acceptance criterion, "the persona-hint CTA
 * navigates to ?tab=certification with ?rtab=fips", tested a surface the
 * compliance redesign deliberately removed: the persona jump-links retired
 * along with the onboarding stack, and the landing tab is now chosen by
 * `defaultTabForPersona` rather than by a Finance→certification hint.
 * `PersonaHintCta.tsx` went with it.
 *
 * The test outlived the feature by one release. It merged red because the full
 * e2e suite runs nightly rather than per-PR, so nothing failed at the gate —
 * worth remembering when retiring any other surface that has a spec pinned to
 * it. The row-budget test below still earns its keep: it is the assertion that
 * the page stays reduced, which the redesign was for.
 */
/**
 * Measured against the production build on 2026-08-12, not assumed: exactly one
 * visible band now sits above the tab bar, down from the four the original
 * budget of 5 was written for. Raising this number is a product decision (a
 * block came back above the tab bar), never a test fix.
 */
const EXPECTED_ROWS_ABOVE_TABS = 1

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

  // The original budget of 5 was set when the stack above the tab bar was
  // PageHeader · AboutThisPageStrip · PersonaHintCta · DeadlineTimelineGate.
  // The redesign removed the middle three, so the budget is now slack rather
  // than a constraint — a ≤5 assertion would still pass if two of the blocks
  // came back. Pinned to the measured count so a re-added block fails here,
  // which is the regression this test exists to catch.
  expect(aboveTabRowCount).toBeGreaterThan(0)
  expect(aboveTabRowCount).toBeLessThanOrEqual(EXPECTED_ROWS_ABOVE_TABS)
})
