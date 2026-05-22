// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * P11-P1-07 — ValidationGantt deadline timeline.
 *
 * Renders on /compliance For-You tab when persona === 'executive' (mounted
 * by ExecutiveTimelineView between the Regulatory Clock and the framework
 * tier grid). One horizontal bar per applicable framework with a concrete
 * deadline year, color-coded by deadline phase.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // Executive persona + a profile that triggers the For-You executive view
    // (matches the existing AU exec workshop seed in compliance-foryou-executive.spec.ts).
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'apac',
          selectedIndustry: 'Government & Defense',
          selectedIndustries: ['Government & Defense'],
          experienceLevel: 'expert',
          viewAccess: 'unlocked',
          hasSeenPersonaPicker: true,
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: false,
        },
        version: 7,
      })
    )
  })
})

test('renders the Deadline timeline on /compliance executive For-You', async ({ page }) => {
  await page.goto(
    '/compliance?tab=foryou&country=Australia&ind=' + encodeURIComponent('Government & Defense')
  )

  // ValidationGantt is a section with aria-label="Compliance deadline timeline".
  // Compliance is lazy-loaded; allow 15s for the chunk to compile cold.
  const gantt = page.getByRole('region', { name: 'Compliance deadline timeline' })
  await expect(gantt).toBeVisible({ timeout: 15000 })

  // The section header surfaces the count of frameworks with a concrete year.
  await expect(gantt.getByRole('heading', { name: 'Deadline timeline' })).toBeVisible()
})

test('renders a framework count summary in the header', async ({ page }) => {
  await page.goto(
    '/compliance?tab=foryou&country=Australia&ind=' + encodeURIComponent('Government & Defense')
  )

  const gantt = page.getByRole('region', { name: 'Compliance deadline timeline' })
  await expect(gantt).toBeVisible({ timeout: 15000 })

  // The header shows "N framework(s) with a concrete year".
  await expect(gantt.getByText(/\d+ framework.*with a concrete year/)).toBeVisible()
})
