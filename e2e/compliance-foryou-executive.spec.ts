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
  ).toBeVisible({ timeout: 10_000 })

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

test('switching persona to architect falls back to generic ApplicabilityPanel', async ({
  page,
}) => {
  // Override init: architect persona instead of executive.
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'architect',
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

  await page.goto(
    '/compliance?tab=foryou&country=Australia&ind=' + encodeURIComponent('Government & Defense')
  )

  // Architect view: generic panel — has its own "Compliance Frameworks"
  // section header in the panel. Look for any visible match.
  await expect(
    page
      .getByText(/Compliance Frameworks/i)
      .locator('visible=true')
      .first()
  ).toBeVisible({ timeout: 10_000 })
  // Decision card is exec-only; should NOT be visible to architects.
  await expect(page.getByText(/Decision this quarter/i).locator('visible=true')).toHaveCount(0)
})
