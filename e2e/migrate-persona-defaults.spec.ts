// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — /migrate page.
 *
 * Goal (per audit `pqctoday-priv/docs/platform/ux/page-audits/
 * 2026-05-22-persona-overwhelm/migrate.md`): wire `PERSONA_MIGRATE_LAYERS`
 * as a default infrastructure-layer filter (was a sort tiebreaker only).
 *
 * Executive's preferred layers = `['Cloud', 'AppServers']`. With persona
 * narrowing active, the first-paint product count should be materially
 * below the ~235 full-catalog count, the `PersonaDefaultsBanner` should
 * render, and clicking "See all N" should write `?prefs=off` to the URL
 * and remove the banner.
 *
 * Researcher (empty PERSONA_MIGRATE_LAYERS) is asserted in a second test
 * to confirm the audit's AC-5 "no regression" guarantee.
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
  })
})

test('executive persona narrows /migrate first-paint and reset link works', async ({ page }) => {
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

  await page.goto('/migrate')

  // PersonaDefaultsBanner is keyed by role="status". The "See all N"
  // reset link inside it is a Button — match by its accessible name.
  // Cards mode is the default viewMode, so the banner mounts above the
  // CatalogSizeBanner inside the desktop shell.
  const banner = page
    .getByRole('status')
    .filter({ hasText: /matched to your role/i })
    .first()
  await expect(banner).toBeVisible({ timeout: 15000 })

  // Banner text format: "Showing N products matched to your role · See all M".
  // M = full catalog (softwareData.length). N < M is the persona-narrowing
  // claim. We don't pin N exactly because the catalog grows; instead assert
  // matched < total and matched > 0 (executive has 2 preferred layers, so
  // there are always some products).
  const bannerText = await banner.textContent()
  // Note: react renders the middot separator as a sibling span; textContent
  // collapses sibling whitespace so the actual string has no spaces around `·`.
  const match = bannerText?.match(
    /Showing (\d+) products? matched to your role\s*·\s*See all (\d+)/
  )
  expect(match, `banner text: ${bannerText ?? '(null)'}`).not.toBeNull()
  const matched = parseInt(match![1], 10)
  const total = parseInt(match![2], 10)
  expect(matched).toBeGreaterThan(0)
  expect(matched).toBeLessThan(total)

  // Click "See all N" — the reset link inside the banner.
  await banner.getByRole('button', { name: /^See all \d+$/ }).click()

  // URL gains ?prefs=off; banner disappears.
  await expect(page).toHaveURL(/[?&]prefs=off(&|$)/, { timeout: 5000 })
  await expect(banner).not.toBeVisible()
})

test('researcher persona does not narrow /migrate (no banner)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'researcher',
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

  await page.goto('/migrate')

  // Wait for the page to mount — the catalog size banner is the natural
  // sentinel since it always renders.
  const catalogBanner = page.getByText(/of \d+ products/i).first()
  await expect(catalogBanner).toBeVisible({ timeout: 15000 })

  // Researcher's PERSONA_MIGRATE_LAYERS is empty by design → no narrowing
  // → PersonaDefaultsBanner must NOT render.
  const banner = page.getByRole('status').filter({ hasText: /matched to your role/i })
  await expect(banner).toHaveCount(0)
})
