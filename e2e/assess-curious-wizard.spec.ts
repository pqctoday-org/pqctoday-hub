// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * P13-P1-06 — Curious 5-question Assess wizard variant.
 *
 * When `selectedPersona === 'curious'`, AssessWizard filters ALL_STEPS to
 * the five highest-signal CURIOUS_STEP_KEYS (industry, country, sensitivity,
 * compliance, migration). The variant trigger is the persona, NOT
 * experienceLevel — a developer with experienceLevel='curious' still gets
 * the full 8-step path.
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
  })
})

test('renders the 5-question variant for the curious persona', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'curious',
          selectedRegion: 'global',
          experienceLevel: 'curious',
          viewAccess: 'preview',
          hasSeenPersonaPicker: true,
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 7,
      })
    )
  })

  await page.goto('/assess?mode=quick')

  // Wizard header shows "Step 1 of 5" for the curious variant.
  // Assess is lazy-loaded; allow 15s for the chunk to compile cold.
  // Two "Step 1 of 5" spans render — `.sm:hidden` mobile + desktop. .last()
  // picks the desktop one (visible at Playwright's 1280×720 viewport).
  await expect(page.getByText(/Step 1 of 5/).last()).toBeVisible({ timeout: 15000 })
})

test('renders the full 8-question path for non-curious personas', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'global',
          experienceLevel: 'expert',
          viewAccess: 'unlocked',
          hasSeenPersonaPicker: true,
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 7,
      })
    )
  })

  await page.goto('/assess?mode=quick')

  // 8-question path — header shows "Step 1 of 8".
  await expect(page.getByText(/Step 1 of 8/).last()).toBeVisible({ timeout: 15000 })
})

test('developer + experienceLevel=curious still gets the full 8-question path', async ({
  page,
}) => {
  // P13-P1-06 trigger is selectedPersona === 'curious' specifically — NOT
  // experienceLevel. This regression-locks that the personaConfig
  // orthogonality is preserved.
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'developer',
          selectedRegion: 'global',
          experienceLevel: 'curious',
          viewAccess: 'unlocked',
          hasSeenPersonaPicker: true,
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 7,
      })
    )
  })

  await page.goto('/assess?mode=quick')

  // 8-question path — header shows "Step 1 of 8".
  await expect(page.getByText(/Step 1 of 8/).last()).toBeVisible({ timeout: 15000 })
})
