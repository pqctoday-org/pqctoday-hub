// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — /assess page.
 *
 * Goal (per audit `pqctoday-priv/docs/platform/ux/page-audits/
 * 2026-05-22-persona-overwhelm/assess.md`): PERSONA_RECOMMENDED_MODE was
 * only consumed as a "Recommended" badge on the mode-selector cards; the
 * wizard still forced every persona to click a mode tile before starting.
 *
 * After this rollout, when a persona resolves a recommended mode AND no
 * prior `assessmentMode` is in the persisted store AND no URL override
 * is present, the page auto-skips ModeSelector and drops the user
 * straight into AssessWizard. A "Switch mode" link is always available.
 *
 * Executive's recommended mode is 'quick'.
 * Developer/architect/researcher/ops's recommended mode is 'comprehensive'.
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

test('executive persona auto-skips ModeSelector and lands in Quick wizard', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/assess')

  // The "Switch mode" link with our testid is the sentinel — present only
  // when AssessWizard is rendered (i.e. assessmentMode has been set).
  const switchModeLink = page.getByTestId('assess-switch-mode')
  await expect(switchModeLink).toBeVisible({ timeout: 15000 })

  // Confirm the user is in Quick mode (executive's recommendation).
  await expect(switchModeLink).toHaveText(/Switch to comprehensive mode/i)

  // ModeSelector cards are identified by `data-workshop-target="assess-mode-quick"`.
  // After auto-skip, they should NOT render.
  await expect(page.locator('[data-workshop-target="assess-mode-quick"]')).toHaveCount(0)
})

test('Switch mode link returns the user to ModeSelector', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/assess')

  const switchModeLink = page.getByTestId('assess-switch-mode')
  await expect(switchModeLink).toBeVisible({ timeout: 15000 })

  await switchModeLink.click()

  // After clicking, ?prefs=off is set and the wizard's switch-mode link
  // disappears (only renders when effectiveAssessmentMode is truthy, which
  // is no longer true once prefs=off opts out of the persona auto-skip).
  await expect(page).toHaveURL(/[?&]prefs=off(&|$)/, { timeout: 5000 })
  await expect(switchModeLink).not.toBeVisible({ timeout: 5000 })
})

test('?prefs=off keeps ModeSelector visible for executive', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/assess?prefs=off')

  // With ?prefs=off the persona auto-skip is bypassed; ModeSelector renders.
  await expect(page.locator('[data-workshop-target="assess-mode-quick"]')).toBeVisible({
    timeout: 15000,
  })
})
