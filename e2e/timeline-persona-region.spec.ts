// SPDX-License-Identifier: GPL-3.0-only
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

test('developer persona without stored region lands on Americas timeline by default', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'developer',
          // selectedRegion: null — explicit so the PERSONA_TIMELINE_REGION
          // fallback path is exercised. Developer's default = 'americas'.
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

  // Wait for the page to mount.
  await expect(page.getByRole('heading', { name: /Migration timeline/i })).toBeVisible({
    timeout: 15000,
  })

  // The region pill for Americas should be `aria-pressed="true"` (active)
  // when the persona-default region applied.
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

  // URL deep-link wins: EU pill is active even though developer's
  // persona default would have been Americas.
  const euPill = page.getByRole('button', { pressed: true, name: /EU/i }).first()
  await expect(euPill).toBeVisible({ timeout: 5000 })
})
