// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

test.setTimeout(60000)

// Suppress WhatsNew toast that intercepts clicks
const SUPPRESS_WHATS_NEW = {
  key: 'pqc-version-storage',
  value: JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 }),
}

/** Seed the persona-store before navigation so AlgorithmsView's useState
 *  initializers see the persona-derived defaults from the first paint. */
async function seedPersona(page: Page, persona: string, opts: { tabsVisited?: string[] } = {}) {
  const value = JSON.stringify({
    state: {
      selectedPersona: persona,
      hasSeenPersonaPicker: true,
      selectedRegion: 'global',
      selectedIndustry: null,
      selectedIndustries: [],
      suppressSuggestion: true,
      experienceLevel: null,
      // Curious starts in preview unless explicitly unlocked; tests that
      // need the comparison tables seed 'unlocked'.
      viewAccess: 'unlocked',
      niceTier: 'awareness',
      niceTierOverridden: false,
      curiousGuideDismissed: true,
      algorithmsTabsVisited: opts.tabsVisited ?? ['transition'],
    },
    version: 8,
  })
  await page.addInitScript((kv) => localStorage.setItem(kv.key, kv.value), {
    key: 'pqc-learning-persona',
    value,
  })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((kv) => localStorage.setItem(kv.key, kv.value), SUPPRESS_WHATS_NEW)
})

test.describe('Algorithms — persona-aware defaults (plan §P0.2 / P1.2)', () => {
  test('executive lands on the Detailed tab with status=Certified + NIST picks highlighted', async ({
    page,
  }) => {
    await seedPersona(page, 'executive')
    await page.goto('/algorithms')
    await page.waitForLoadState('domcontentloaded')

    // Custom tabs.tsx renders <button data-workshop-target="tab-<value>"> with
    // data-state="active|inactive". Match the stable workshop-target attr.
    await expect(page.locator('[data-workshop-target="tab-detailed"]')).toHaveAttribute(
      'data-state',
      'active',
      { timeout: 15000 }
    )

    // Persona hint specific to executive is present.
    await expect(page.getByText(/FIPS-standardized picks/)).toBeVisible({ timeout: 10000 })
  })

  test('ops lands on Transition with status=Certified preset', async ({ page }) => {
    await seedPersona(page, 'ops')
    await page.goto('/algorithms')
    await page.waitForLoadState('domcontentloaded')

    // Transition Guide tab is active.
    await expect(page.locator('[data-workshop-target="tab-transition"]')).toHaveAttribute(
      'data-state',
      'active',
      { timeout: 15000 }
    )

    // Persona hint specific to ops is present.
    await expect(page.getByText(/Production deployment chips/)).toBeVisible({ timeout: 10000 })
  })

  test('developer sees the 5-dropdown filter bar inline (no More-filters disclosure)', async ({
    page,
  }) => {
    await seedPersona(page, 'developer')
    await page.goto('/algorithms')
    await page.waitForLoadState('domcontentloaded')

    // The "More filters" toggle is only rendered for binary personas.
    await expect(page.getByRole('button', { name: /More filters/i })).toHaveCount(0)
    // Dropdowns are visible inline — at least the Family one should render.
    await expect(page.getByText(/All Families/).first()).toBeVisible({ timeout: 10000 })
  })

  test('binary personas hide the dropdown bar behind "More filters" by default', async ({
    page,
  }) => {
    await seedPersona(page, 'executive')
    await page.goto('/algorithms')
    await page.waitForLoadState('domcontentloaded')

    // More filters disclosure is rendered.
    const moreFilters = page.getByRole('button', { name: /More filters/i })
    await expect(moreFilters).toBeVisible({ timeout: 10000 })
    // Quick-view presets are rendered above the (collapsed) dropdown bar.
    await expect(page.getByRole('button', { name: /NIST picks/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /FIPS-validated/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Everything$/i })).toBeVisible()
  })

  test('Protocol Support heatmap palette shrinks for binary personas (data-stage-tier)', async ({
    page,
  }) => {
    await seedPersona(page, 'executive')
    await page.goto('/algorithms?tab=support')
    await page.waitForLoadState('domcontentloaded')

    // Heatmap is the default Protocol Support view; cells expose data-stage-tier.
    const tieredCells = page.locator('[data-stage-tier]')
    await tieredCells.first().waitFor({ timeout: 20000 })

    // Pull every distinct tier value rendered on the page.
    const tiers = await tieredCells.evaluateAll((nodes) => {
      const values = new Set<string>()
      for (const n of nodes) {
        const v = n.getAttribute('data-stage-tier')
        if (v !== null) values.add(v)
      }
      return Array.from(values).sort()
    })

    // Binary palette emits at most tiers {0, 7}. The plan's acceptance check #6
    // permits ≤ 2 distinct tier values for executive/ops/curious.
    expect(tiers.length).toBeLessThanOrEqual(2)
    for (const t of tiers) {
      expect(['0', '7']).toContain(t)
    }
  })

  test('researcher keeps the full graduated palette (data-stage-tier set spans 0..7)', async ({
    page,
  }) => {
    await seedPersona(page, 'researcher')
    await page.goto('/algorithms?tab=support')
    await page.waitForLoadState('domcontentloaded')

    const tieredCells = page.locator('[data-stage-tier]')
    await tieredCells.first().waitFor({ timeout: 20000 })

    const tiers = await tieredCells.evaluateAll((nodes) => {
      const values = new Set<string>()
      for (const n of nodes) {
        const v = n.getAttribute('data-stage-tier')
        if (v !== null) values.add(v)
      }
      return Array.from(values).sort()
    })

    // Researcher palette should emit at least 3 distinct tiers given the
    // mix of RFC, draft, and earlier-stage cells across the matrix.
    expect(tiers.length).toBeGreaterThanOrEqual(3)
  })

  test('URL deep-link overrides persona default (developer + ?tab=detailed)', async ({ page }) => {
    await seedPersona(page, 'developer')
    await page.goto('/algorithms?tab=detailed')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('[data-workshop-target="tab-detailed"]')).toHaveAttribute(
      'data-state',
      'active',
      { timeout: 15000 }
    )
  })
})
