// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * CC-17 — CuriousGuide floating tour.
 *
 * Step COUNT is deliberately not hard-coded below. This test asserted "4"
 * until B+ remediation 1.5 (2026-08-10) added a fifth step ("Why you can check
 * us"), at which point it failed nightly for days — and it failed on the step
 * counter, a number that carries no product meaning, rather than on anything
 * the tour is for. The content assertions are the ones worth pinning: that the
 * tour advances, that the last step offers Finish rather than Next, and that
 * finishing persists.
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

test('renders the tour and the Finish flow persists dismissal', async ({ page }) => {
  await page.goto('/')

  const guide = page.getByTestId('curious-guide')
  // Landing is lazy-loaded; allow 15s for the chunk to compile cold.
  await expect(guide).toBeVisible({ timeout: 15000 })

  // The counter is read for its TOTAL, not asserted against a literal — see the
  // note at the top of this file.
  // innerText applies the panel's `uppercase` text-transform, so this reads
  // "STEP 1 OF 5" — match case-insensitively rather than against the source casing.
  const counter = await guide.getByText(/Step \d+ of \d+/).innerText()
  const total = Number(counter.match(/of (\d+)/i)?.[1])
  expect(total).toBeGreaterThanOrEqual(4)

  // Step 1
  await expect(guide.getByText(/Everything's encrypted/)).toBeVisible()
  await expect(guide.getByText(new RegExp(`Step 1 of ${total}`))).toBeVisible()

  // Advance to step 2
  await guide.getByRole('button', { name: /^Next/ }).click()
  await expect(guide.getByText(/Quantum changes the math/)).toBeVisible()
  await expect(guide.getByText(new RegExp(`Step 2 of ${total}`))).toBeVisible()

  // Step 3
  await guide.getByRole('button', { name: /^Next/ }).click()
  await expect(guide.getByText(/clock is already ticking/)).toBeVisible()

  // Walk to the last step, whatever its index. Finish must replace Next there
  // and nowhere earlier — a tour that offers Finish mid-way loses the reader
  // before the point it was written to make.
  for (let step = 3; step < total; step += 1) {
    await expect(guide.getByRole('button', { name: /^Finish/ })).toHaveCount(0)
    await guide.getByRole('button', { name: /^Next/ }).click()
    await expect(guide.getByText(new RegExp(`Step ${step + 1} of ${total}`))).toBeVisible()
  }
  const finishBtn = guide.getByRole('button', { name: /^Finish/ })
  await expect(finishBtn).toBeVisible()
  await expect(guide.getByRole('button', { name: /^Next/ })).toHaveCount(0)

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
