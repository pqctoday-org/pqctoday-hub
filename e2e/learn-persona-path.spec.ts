// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * P0-P1 — Learn hub persona-path view.
 *
 * Verifies the persona-overwhelm plan: every persona except researcher lands
 * on a curated `'path'` view above the fold; the catalog is one click behind
 * `<details>`; curious is no longer force-filtered to 'All'.
 */

type PersonaId = 'executive' | 'developer' | 'architect' | 'researcher' | 'ops' | 'curious'

const seedPersona = async (page: Page, persona: PersonaId | null) => {
  await page.addInitScript(
    ([p]) => {
      // Suppress WhatsNew modal that intercepts clicks (per CLAUDE.md E2E protocol).
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      // Suppress the GuidedTour overlay (it blocks the page on first visit).
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
      // Reset the curious-escape so each test starts on the curated path.
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

test.describe('Learn — persona-path view', () => {
  for (const persona of ['executive', 'developer', 'architect', 'ops'] as const) {
    test(`${persona} lands on the curated path with phase boundaries`, async ({ page }) => {
      await seedPersona(page, persona)
      await page.goto('/learn')

      // Path view exposes the "Browse all" details element. Stack-mode pages don't.
      // The hub is lazy-loaded; allow ample budget for the chunk to compile cold
      // (~6-8s observed for executive).
      await expect(
        page.getByText(/Browse all \d+ modules \(\d+ tracks\)/i).first()
      ).toBeVisible({ timeout: 25000 })

      // Catalog is collapsed behind <details> by default
      const details = page.locator('details').filter({
        hasText: /Browse all \d+ modules/i,
      })
      await expect(details).toHaveCount(1)
    })
  }

  test('curious lands on the curated path (NOT the unfiltered catalog) — P0-1 regression guard', async ({
    page,
  }) => {
    await seedPersona(page, 'curious')
    await page.goto('/learn')

    // Same affordance as the other personas — proves selectedPersonaFilter is
    // 'curious', not 'All'.
    await expect(page.getByText(/Browse all \d+ modules/i).first()).toBeVisible({
      timeout: 25000,
    })

    // The curious "Show me everything (advanced)" escape is present.
    await expect(page.getByRole('button', { name: /Show me everything/i })).toBeVisible()
  })

  test('curious "Show me everything" reveals the stack catalog', async ({ page }) => {
    await seedPersona(page, 'curious')
    await page.goto('/learn')

    // Wait for path view to mount before clicking the escape.
    await expect(
      page.getByRole('button', { name: /Show me everything/i })
    ).toBeVisible({ timeout: 25000 })
    await page.getByRole('button', { name: /Show me everything/i }).click()

    // After the escape, the curated banner / Browse-all details element should
    // be gone (viewMode flipped to 'stack').
    await expect(page.getByText(/Browse all \d+ modules/i)).toHaveCount(0)
  })

  test('researcher stays on stack mode — PersonaPathView NOT rendered', async ({ page }) => {
    await seedPersona(page, 'researcher')
    await page.goto('/learn')

    // Wait for the hub h1 to settle so we know lazy-load is done.
    await expect(page.getByRole('heading', { level: 1, name: /Learning Workshops/i })).toBeVisible({
      timeout: 25000,
    })
    await expect(page.getByText(/Browse all \d+ modules/i)).toHaveCount(0)
  })

  test('null persona keeps stack default — no regression', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn')

    await expect(page.getByRole('heading', { level: 1, name: /Learning Workshops/i })).toBeVisible({
      timeout: 25000,
    })
    await expect(page.getByText(/Browse all \d+ modules/i)).toHaveCount(0)
  })
})
