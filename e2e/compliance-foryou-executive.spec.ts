// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Workshop deep-link smoke test for the Australian executive scenario.
 *
 * Hits the For-You tab with `country=Australia&ind=Government & Defense` and
 * verifies the ExecutiveTimelineView renders (regulatory clock, ASD-ISM as
 * Mandatory, FIPS-140-3 as Recognized with Five Eyes affinity, AUS-GOV-001
 * threat). This is the URL the presenter projects during the AU exec
 * workshop.
 *
 * First-render `timeout: 25_000` (was 10_000, root-caused during a G9/W6
 * gate sweep): the underlying data and applicability logic were confirmed
 * correct — a standalone script isolated from the rest of the smoke suite
 * consistently renders the expected content in ~5s. The 10s budget only
 * broke under this suite's real parallel-worker contention (multiple heavy
 * specs, including full-page axe scans, running concurrently), not from
 * anything wrong with this page's data or logic.
 */
test.beforeEach(async ({ page }) => {
  // 1. Suppress WhatsNew alertdialog so it doesn't intercept clicks.
  // 2. Pre-set persona to executive so the For-You tab dispatches into
  //    ExecutiveTimelineView (otherwise it falls back to ApplicabilityPanel).
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'apac',
          selectedIndustry: 'Government & Defense',
          selectedIndustries: ['Government & Defense'],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })
})

test('AU exec workshop deep-link renders ExecutiveTimelineView', async ({ page }) => {
  await page.goto(
    '/compliance?tab=foryou&country=Australia&ind=' + encodeURIComponent('Government & Defense')
  )

  // Regulatory clock — 2030 cutover line is the loud anchor. Mobile + desktop
  // both render the same component, so multiple elements is fine; assert the
  // first is visible.
  // Both mobile + desktop containers render the view; only the desktop one
  // is visible at chromium default viewport. Locator filtered to visible.
  await expect(
    page
      .getByText(/ASD ISM cutover/i)
      .locator('visible=true')
      .first()
  ).toBeVisible({ timeout: 25_000 })

  // Mandatory framework section — ASD-ISM lives here.
  await expect(page.getByText('ASD ISM').locator('visible=true').first()).toBeVisible()

  // Recognized framework section — FIPS-140-3 with Five Eyes affinity reason.
  await expect(page.getByText('FIPS 140-3').locator('visible=true').first()).toBeVisible()
  await expect(
    page
      .getByText(/Five Eyes affinity/i)
      .locator('visible=true')
      .first()
  ).toBeVisible()

  // Sector threats sidebar — AU-tagged sector threats we authored.
  await expect(page.getByText('AUS-GOV-001').locator('visible=true').first()).toBeVisible()

  // Decision card with assess CTA.
  await expect(
    page
      .getByText(/Decision this quarter/i)
      .locator('visible=true')
      .first()
  ).toBeVisible()
  await expect(
    page
      .getByRole('link', { name: /Take board assessment/i })
      .locator('visible=true')
      .first()
  ).toBeVisible()
})

test('the architect persona gets the architect For You view, not the exec one', async ({
  page,
}) => {
  // REWRITTEN 2026-08-11. This spec used to be titled "...falls back to generic
  // ApplicabilityPanel" and asserted the panel's "Compliance Frameworks"
  // heading. The app does not do that: ComplianceView maps each of the six
  // personas to its own view and uses the generic panel only when NO persona is
  // set. The old assertion passed by winning a race — it ran before Zustand
  // rehydrated `selectedPersona`, so it caught the momentary no-persona render.
  // Removing the onboarding stack above the tab bar made the page reach the
  // panel sooner, hydration started winning, and the spec went red while the
  // behaviour it describes had never existed. Its seed data gives it away: it
  // writes `viewAccess: { allowed: [] }`, a shape the store has not used since
  // the field became a plain 'preview' | 'gated' | 'unlocked' string.
  //
  // It now asserts the real contract, deterministically.
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'architect',
          selectedRegion: 'apac',
          selectedIndustries: ['Government & Defense'],
          experienceLevel: 'expert',
        },
        version: 0,
      })
    )
  })

  await page.goto(
    '/compliance?tab=foryou&country=Australia&ind=' + encodeURIComponent('Government & Defense')
  )

  // The architect view's own section, not the generic panel's.
  await expect(
    page
      .getByText(/Jurisdiction map/i)
      .locator('visible=true')
      .first()
  ).toBeVisible({ timeout: 25_000 })
  // Decision card is exec-only; should NOT be visible to architects.
  await expect(page.getByText(/Decision this quarter/i).locator('visible=true')).toHaveCount(0)
})

test('a visitor with no persona gets the generic ApplicabilityPanel', async ({ page }) => {
  // The genuine fallback the old spec was reaching for, asserted where it is
  // actually true: no persona selected.
  await page.addInitScript(() => {
    localStorage.removeItem('pqc-learning-persona')
  })

  await page.goto(
    '/compliance?tab=foryou&country=Australia&ind=' + encodeURIComponent('Government & Defense')
  )

  await expect(
    page
      .getByText(/Compliance Frameworks/i)
      .locator('visible=true')
      .first()
  ).toBeVisible({ timeout: 25_000 })
})
