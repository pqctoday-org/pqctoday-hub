// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — /playground curious mode.
 *
 * Goal (per audit `pqctoday-priv/docs/platform/ux/page-audits/
 * 2026-05-22-persona-overwhelm/playground.md`): the 35-tool grid + raw
 * byte output panes are hostile to the curious persona. Replace the
 * catalog UI with a 3-step CuriousStartHere panel; render a "Show full
 * catalog" CTA that opts the user into the full catalog via ?prefs=off.
 *
 * Other personas (executive/developer/architect/researcher/ops) see the
 * full catalog unchanged.
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

test('curious persona sees CuriousStartHere only; catalog gated behind disclosure', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'curious',
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'awareness',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/playground')

  // "Show full catalog (N tools)" CTA is the sentinel for curious minimal mode.
  const cta = page.getByTestId('playground-show-full-catalog')
  await expect(cta).toBeVisible({ timeout: 15000 })

  // CTA label includes the workshop-tool count.
  await expect(cta).toHaveText(/Show full catalog \(\d+ tools\)/i)

  // The category sidebar ("All tools" pill) is part of the catalog UI and
  // must NOT be in the DOM in curious minimal mode.
  const categoryAllToolsPill = page.getByRole('button', { name: /^All tools \d+$/ })
  await expect(categoryAllToolsPill).toHaveCount(0)

  // Click the CTA → ?prefs=off in URL, catalog reveals.
  await cta.click()
  await expect(page).toHaveURL(/[?&]prefs=off(&|$)/, { timeout: 5000 })

  // After opt-in, the catalog sidebar appears.
  await expect(categoryAllToolsPill.first()).toBeVisible({ timeout: 5000 })
  // The CTA itself goes away (no longer needed once user opted in).
  await expect(cta).not.toBeVisible()
})

test('developer persona sees full catalog (no curious gate)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'developer',
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

  await page.goto('/playground')

  // Category sidebar appears immediately — full catalog rendered.
  const categoryAllToolsPill = page.getByRole('button', { name: /^All tools \d+$/ }).first()
  await expect(categoryAllToolsPill).toBeVisible({ timeout: 15000 })

  // The curious-mode CTA is absent for non-curious personas.
  await expect(page.getByTestId('playground-show-full-catalog')).toHaveCount(0)
})
