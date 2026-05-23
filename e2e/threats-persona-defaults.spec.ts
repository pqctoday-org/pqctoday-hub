// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — /threats page.
 *
 * Goal (per audit `pqctoday-priv/docs/platform/ux/page-audits/
 * 2026-05-22-persona-overwhelm/threats.md`): when a persona is set but
 * no industry is picked, the page rendered the full threat corpus
 * unfiltered. The new PERSONA_THREATS_DEFAULT_INDUSTRIES constant
 * provides sensible per-persona default industries; the dashboard now
 * narrows the corpus to those industries on first paint.
 *
 * Executive's default = ['Finance & Banking', 'Government & Defense']
 * Researcher's default = [] (full corpus, no narrowing — AC-5 invariant).
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

test('executive persona (no industry picked) narrows /threats and reset works', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          selectedRegion: 'global',
          // selectedIndustry intentionally null + selectedIndustries empty so
          // the persona-default kicks in.
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/threats')

  // PersonaDefaultsBanner is keyed by role="status".
  const banner = page
    .getByRole('status')
    .filter({ hasText: /matched to your role/i })
    .first()
  await expect(banner).toBeVisible({ timeout: 15000 })

  const bannerText = await banner.textContent()
  const match = bannerText?.match(/Showing (\d+) threats? matched to your role\s*·\s*See all (\d+)/)
  expect(match, `banner text: ${bannerText ?? '(null)'}`).not.toBeNull()
  const matched = parseInt(match![1], 10)
  const total = parseInt(match![2], 10)
  expect(matched).toBeGreaterThan(0)
  expect(matched).toBeLessThan(total)

  // Click "See all N" — sets ?prefs=off, banner disappears.
  await banner.getByRole('button', { name: /^See all \d+$/ }).click()
  await expect(page).toHaveURL(/[?&]prefs=off(&|$)/, { timeout: 5000 })
  await expect(banner).not.toBeVisible()
})

test('researcher persona (no industry picked) does not narrow /threats', async ({ page }) => {
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

  await page.goto('/threats')

  // Wait for the page to mount.
  const pageHeader = page.getByRole('heading', { name: /Quantum Threats/i })
  await expect(pageHeader).toBeVisible({ timeout: 15000 })

  // Researcher has no default industries → no banner.
  const banner = page.getByRole('status').filter({ hasText: /matched to your role/i })
  await expect(banner).toHaveCount(0)
})
