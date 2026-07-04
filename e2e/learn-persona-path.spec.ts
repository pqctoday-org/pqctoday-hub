// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * Learn hub — My Path (persona journey) view.
 *
 * The /learn page was redesigned (commit 2add4c82) into an explicit "My Path" vs
 * "Browse all" mode switch. My Path is the curated persona journey (the old
 * "path view"); its depth is controlled by an Essentials⇄Full "Path depth"
 * toggle (the redesign's replacement for the old "Show me everything" escape).
 * Every persona now defaults to My Path — the old "researcher/null stay on the
 * stack catalog" behavior is gone — and the researcher taxonomy filter moved
 * into Browse's Advanced tray. Two concepts from the old spec were dropped by
 * the redesign and are re-pointed here: the "Show me everything (advanced)"
 * escape (now: switch to Browse) and the per-card "Try in playground" affordance
 * (removed from My Path).
 */

type PersonaId = 'executive' | 'developer' | 'architect' | 'researcher' | 'ops' | 'curious'

const seedPersona = async (page: Page, persona: PersonaId | null) => {
  await page.addInitScript(
    ([p]) => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      if (p !== null) {
        localStorage.setItem(
          'pqc-learning-persona',
          JSON.stringify({
            state: {
              selectedPersona: p,
              selectedRegion: 'global',
              experienceLevel: p === 'curious' ? 'curious' : null,
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
      }
      localStorage.setItem(
        'pqc-learn-storage',
        JSON.stringify({
          state: { showEverything: false, phaseExpansion: {}, researcherSortOverride: null },
          version: 1,
        })
      )
    },
    [persona]
  )
}

/** My Path renders a persona's curated journey with an Essentials⇄Full "Path
 * depth" toggle — the reliable "a curated path rendered" signal. */
const pathDepthToggle = (page: Page) => page.getByRole('tablist', { name: /Path depth/i })

test.describe('Learn — My Path (persona journey) view', () => {
  for (const persona of ['executive', 'developer', 'architect', 'ops'] as const) {
    test(`${persona} lands on My Path with a curated journey`, async ({ page }) => {
      await seedPersona(page, persona)
      await page.goto('/learn')

      // The Path-depth toggle only renders when a curated persona journey is
      // shown — proving My Path (not the Browse catalog) is the landing view.
      // The lazy chunk can take a few seconds cold.
      await expect(pathDepthToggle(page)).toBeVisible({ timeout: 25000 })

      // The mode switch exposes both My Path (active) and the Browse escape.
      await expect(page.getByRole('button', { name: /^My Path/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /^Browse all/ })).toBeVisible()

      // The meta line summarises the curated path as "<label> · N modules · ~Nh".
      await expect(page.getByText(/\d+ modules · ~\d+h/).first()).toBeVisible()
    })
  }

  test('curious lands on My Path (not the unfiltered catalog)', async ({ page }) => {
    await seedPersona(page, 'curious')
    await page.goto('/learn')

    // Same curated-journey affordance as the other personas — proves curious is
    // NOT dumped into the full catalog.
    await expect(pathDepthToggle(page)).toBeVisible({ timeout: 25000 })
  })

  test('the Browse escape reveals the full catalog', async ({ page }) => {
    // Replaces the old curious "Show me everything" escape (removed in the
    // redesign): "Browse all" is now the explicit way to leave the curated path
    // and see the whole catalog.
    await seedPersona(page, 'curious')
    await page.goto('/learn')
    await expect(pathDepthToggle(page)).toBeVisible({ timeout: 25000 })

    await page.getByRole('button', { name: /^Browse all/ }).click()

    // Catalog is now shown: its search filter appears and the curated Path-depth
    // toggle is gone.
    await expect(page.getByRole('textbox', { name: /Search modules/i })).toBeVisible({
      timeout: 8000,
    })
    await expect(pathDepthToggle(page)).toHaveCount(0)
  })

  test('researcher also lands on My Path (the redesign unified the default)', async ({ page }) => {
    // The old behavior — researcher forced onto the stack catalog — no longer
    // exists; every persona now defaults to My Path.
    await seedPersona(page, 'researcher')
    await page.goto('/learn')

    await expect(pathDepthToggle(page)).toBeVisible({ timeout: 25000 })
    await expect(page.getByRole('button', { name: /^Browse all/ })).toBeVisible()
  })

  test('null persona lands on My Path with no curated path yet', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn')

    // My Path is the default mode, but with no persona there is no curated path,
    // so the Path-depth toggle is absent — the user is prompted to pick a role.
    await expect(page.getByRole('button', { name: /^My Path/ })).toBeVisible({ timeout: 25000 })
    await expect(pathDepthToggle(page)).toHaveCount(0)
  })

  test('ops My Path shows the curated journey with switchable depth', async ({ page }) => {
    // Replaces the old "Try in playground" per-card test (that affordance was
    // removed from My Path in the redesign). Verifies the curated path renders
    // and its Essentials⇄Full depth toggle actually switches.
    await seedPersona(page, 'ops')
    await page.goto('/learn')

    const toggle = pathDepthToggle(page)
    await expect(toggle).toBeVisible({ timeout: 25000 })

    // Essentials is the default; switching to Full is honored (reflected in ?tier=).
    await toggle.getByRole('tab', { name: /Full/i }).click()
    await expect(page).toHaveURL(/tier=full/)
  })

  test('researcher taxonomy filter lives in Browse’s Advanced tray', async ({ page }) => {
    // The algorithm/standard taxonomy filter moved from a standalone strip into
    // the Browse catalog's Advanced tray (BrowseAllView).
    await seedPersona(page, 'researcher')
    await page.goto('/learn?mode=browse')

    // Open the Advanced tray, then the taxonomy region appears.
    await page
      .getByRole('button', { name: /Advanced/i })
      .first()
      .click()
    const region = page.getByRole('region', {
      name: /browse modules by algorithm or standard/i,
    })
    await expect(region).toBeVisible({ timeout: 15000 })

    // The two top-level chips are scoped inside the taxonomy region so they
    // don't collide with the global "Algorithms view" nav button.
    await region.getByRole('button', { name: 'Algorithm', exact: true }).click()
    await expect(page.getByRole('listbox', { name: /Algorithms/i })).toBeVisible()
    // ML-KEM option is one of the curated taxons
    await expect(page.getByRole('option', { name: /ML-KEM/ })).toBeVisible()
  })
})
