// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * CC-17 — CuriousGuide 4-step floating tour.
 *
 * Renders only when:
 *   - selectedPersona === 'curious'
 *   - curiousGuideDismissed === false
 *
 * Dismissal (via X, Finish, or any CTA) persists across reloads via
 * usePersonaStore v7 migration field `curiousGuideDismissed`.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Suppress overlays that would intercept clicks on the floating tour.
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // Curious persona + tour not yet dismissed. Match the v7 store shape.
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'curious',
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'curious',
          viewAccess: 'preview',
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

test('renders the 4-step tour and the Finish flow persists dismissal', async ({ page }) => {
  await page.goto('/')

  const guide = page.getByTestId('curious-guide')
  // Landing is lazy-loaded; allow 15s for the chunk to compile cold.
  await expect(guide).toBeVisible({ timeout: 15000 })

  // Step 1
  await expect(guide.getByText(/Everything's encrypted/)).toBeVisible()
  await expect(guide.getByText(/Step 1 of 4/)).toBeVisible()

  // Advance to step 2
  await guide.getByRole('button', { name: /^Next/ }).click()
  await expect(guide.getByText(/Quantum changes the math/)).toBeVisible()
  await expect(guide.getByText(/Step 2 of 4/)).toBeVisible()

  // Step 3
  await guide.getByRole('button', { name: /^Next/ }).click()
  await expect(guide.getByText(/clock is already ticking/)).toBeVisible()

  // Step 4 — last step shows Finish, not Next
  await guide.getByRole('button', { name: /^Next/ }).click()
  await expect(guide.getByText(/Find your starting point/)).toBeVisible()
  const finishBtn = guide.getByRole('button', { name: /^Finish/ })
  await expect(finishBtn).toBeVisible()

  // Finish dismisses the tour
  await finishBtn.click()
  await expect(guide).not.toBeVisible()

  // Reload — dismissal must persist
  await page.reload()
  await expect(page.getByTestId('curious-guide')).not.toBeVisible()
})

test('X-button dismissal persists across reload', async ({ page }) => {
  await page.goto('/')

  const guide = page.getByTestId('curious-guide')
  await expect(guide).toBeVisible({ timeout: 15000 })

  await guide.getByRole('button', { name: 'Dismiss tour' }).click()
  await expect(guide).not.toBeVisible()

  await page.reload()
  await expect(page.getByTestId('curious-guide')).not.toBeVisible()
})

test('does not render for non-curious personas', async ({ page }) => {
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
          curiousGuideDismissed: false,
        },
        version: 7,
      })
    )
  })
  await page.goto('/')
  // Wait for Landing to mount before asserting absence — lazy chunk cold-start.
  await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('curious-guide')).not.toBeVisible()
})
