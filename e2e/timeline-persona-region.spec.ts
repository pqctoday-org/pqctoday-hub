// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Persona-overwhelm audit acceptance — /timeline page (region defaults only).
 *
 * Goal (per audit `pqctoday-priv/docs/platform/ux/page-audits/
 * 2026-05-22-persona-overwhelm/timeline.md`): every persona landed on the
 * same 40-country Gantt chart regardless of role. The new
 * PERSONA_TIMELINE_REGION constant provides a sensible default region
 * per persona; TimelineView's regionFilter initialiser consumes it when
 * no URL deep-link / persona-store region / ?prefs=off opt-out is present.
 *
 * Scope of this PR: region default only. The audit also asked for an
 * `EventTypeFilter` (Mandate/Standard/Guidance/Industry), which requires
 * a new CSV column and is deferred to a follow-up.
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

// Developer's PERSONA_TIMELINE_REGION changed from 'americas' to 'global' in
// 7f6d137a7 (2026-10-15, owner decision D2: a job title does not imply a
// jurisdiction), and every other persona followed (curious last, fddc687ac).
// 'global' is not a narrowing region (storedRegionDefault), so a developer with
// no stored region now lands on every region, like the researcher below.
test('developer persona without stored region lands on All regions (no implied region)', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'developer',
          // selectedRegion: null — explicit so the PERSONA_TIMELINE_REGION
          // fallback path is exercised. Developer's default = 'global'.
          selectedRegion: null,
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/timeline')

  await expect(page.getByRole('heading', { name: /Migration timeline/i })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByTestId('timeline-coverage-by-region')).toBeVisible({ timeout: 10000 })

  const anyActiveRegionPill = page.getByRole('button', {
    pressed: true,
    name: /Americas|EU|MENA|APAC|Global/i,
  })
  await expect(anyActiveRegionPill).toHaveCount(0)
  await expect(page).not.toHaveURL(/[?&]region=/)
})

test("developer's own stored region still narrows the timeline", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'developer',
          selectedRegion: 'americas',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/timeline')

  await expect(page.getByRole('heading', { name: /Migration timeline/i })).toBeVisible({
    timeout: 15000,
  })
  const americasPill = page.getByRole('button', { pressed: true, name: /Americas/i }).first()
  await expect(americasPill).toBeVisible({ timeout: 10000 })
})

test('researcher persona lands on All regions (no narrowing)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'researcher',
          selectedRegion: null,
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/timeline')

  await expect(page.getByRole('heading', { name: /Migration timeline/i })).toBeVisible({
    timeout: 15000,
  })

  // Researcher's PERSONA_TIMELINE_REGION = 'All' → no region pill is
  // aria-pressed.
  const anyActiveRegionPill = page.getByRole('button', {
    pressed: true,
    name: /Americas|EU|MENA|APAC|Global/i,
  })
  await expect(anyActiveRegionPill).toHaveCount(0)
})

test('?region=eu deep-link wins over persona default for developer', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'developer',
          selectedRegion: null,
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: { allowed: [] },
        },
        version: 0,
      })
    )
  })

  await page.goto('/timeline?region=eu')

  await expect(page.getByRole('heading', { name: /Migration timeline/i })).toBeVisible({
    timeout: 15000,
  })

  // URL deep-link wins: EU pill is active although developer's persona
  // default ('global') would show every region.
  const euPill = page.getByRole('button', { pressed: true, name: /EU/i }).first()
  await expect(euPill).toBeVisible({ timeout: 5000 })
})
