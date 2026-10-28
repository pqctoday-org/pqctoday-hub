// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * Inline scope step on an empty Rules & Standards register (GRC journey audit,
 * 15 Oct 2026, owner decision D3).
 *
 * A fresh GRC or Executive reader starts Global with no sector, and the GRC home
 * board's first action opens /compliance?tab=obligations. That screen used to
 * say "set your sector at the top right, and your country just above" — a dead
 * end on the very first click. It now carries the two pickers itself. This spec
 * walks that first visit to a populated register, on desktop and phone widths.
 */

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]

async function seedFreshPersona(page: Page, persona: 'grc' | 'executive' | 'researcher') {
  await page.addInitScript((p) => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: p,
          hasAcknowledgedExecutiveGrcSplit: true,
          hasSeenPersonaPicker: true,
          selectedRegion: 'global',
          selectedIndustries: [],
          experienceLevel: 'expert',
          viewAccess: 'unlocked',
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 11,
      })
    )
  }, persona)
}

async function pick(page: Page, trigger: RegExp, option: string) {
  await page.getByRole('button', { name: trigger }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

for (const viewport of VIEWPORTS) {
  const isMobile = viewport.width < 1024
  for (const persona of ['grc', 'executive'] as const) {
    test(`${persona} at ${viewport.width}px: first visit scopes inline and shows the register`, async ({
      page,
    }) => {
      // The register waits on the compliance dataset; a cold server can take a while.
      test.setTimeout(90_000)
      await page.setViewportSize(viewport)
      await seedFreshPersona(page, persona)
      await page.goto('/compliance?tab=obligations')

      const scope = page.getByRole('group', { name: 'Set your scope' })
      await expect(scope).toBeVisible({ timeout: 40000 })
      // No pointer to controls elsewhere on the page.
      await expect(page.getByText(/Set your sector in the scope/i)).toHaveCount(0)

      await pick(page, /Your country/i, 'France')
      await pick(page, /Your sector/i, 'Finance & Banking')

      await expect(scope).toHaveCount(0)
      // The register now lists instruments: each tier band is an expandable button
      // led by its label and count ("Mandatory 11 …").
      await expect(
        page
          .getByRole('button', { name: /^(Mandatory|Recognized|Cross-border|Advisory)\b.*\d/ })
          .first()
      ).toBeVisible()
      if (!isMobile) {
        await expect(page.getByText(/instruments in\s+scope/i)).toBeVisible()
      }
    })
  }
}

// Threats: a persona with no default sector (researcher on this base; developer,
// architect, ops, GRC and Executive once their defaults are removed) used to see
// "N threats apply to all sectors". The exposure card now offers the sector picker.
for (const viewport of VIEWPORTS) {
  const isMobile = viewport.width < 1024
  test(`threats at ${viewport.width}px: no sector offers the picker, a pick scopes the count`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize(viewport)
    await seedFreshPersona(page, 'researcher')
    await page.goto('/threats')

    const step = page.getByRole('group', { name: 'Complete your scope' })
    await expect(step).toBeVisible({ timeout: 40000 })
    await pick(page, /Your sector/i, 'Healthcare')
    await expect(step).toHaveCount(0)
    if (isMobile) {
      await expect(page.getByText(/in your focus areas/)).toBeVisible()
    } else {
      await expect(page.getByText(/in the catalog match\s+Healthcare/)).toBeVisible()
    }
  })
}
