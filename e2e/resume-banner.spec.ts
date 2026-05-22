// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * CC-12 — ResumeBanner.
 *
 * Renders when the user has at least one module with status !== 'not-started'.
 * Picks the most-recently-visited and shows "Continue {Title}". Dismiss
 * persists per-route per session via sessionStorage.
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
    // Seed module store with pqc-101 in-progress (most-recent visit).
    // Schema must satisfy the v14 migrate() guard, but only the fields the
    // ResumeBanner reads (status, lastVisited) actually matter for selection.
    localStorage.setItem(
      'pki-module-storage',
      JSON.stringify({
        state: {
          version: '1.0.0',
          modules: {
            'pqc-101': {
              status: 'in-progress',
              lastVisited: Date.now(),
              timeSpent: 60,
              completedSteps: [],
              quizScores: {},
              learnSectionChecks: {},
            },
          },
          activeModuleId: null,
          completedModuleIds: [],
          recentActivityLog: [],
        },
        version: 14,
      })
    )
  })
})

test('shows the resume banner when a module is in-progress', async ({ page }) => {
  await page.goto('/')

  const banner = page.getByRole('link', { name: /^Continue PQC/ })
  // Landing is lazy-loaded; allow 15s for the chunk to compile cold.
  await expect(banner).toBeVisible({ timeout: 15000 })
  // Module title is whatever pqc-101 resolves to in MODULE_CATALOG —
  // verify the resume affordance is present, not a literal title.
  await expect(page.getByRole('button', { name: 'Dismiss resume banner' })).toBeVisible()
})

test('clicking Continue navigates to the module page', async ({ page }) => {
  await page.goto('/')
  const banner = page.getByRole('link', { name: /^Continue PQC/ })
  await expect(banner).toBeVisible({ timeout: 15000 })
  await banner.click()
  await expect(page).toHaveURL(/\/learn\/pqc-101/)
})

test('dismissing the banner hides it for the rest of the session', async ({ page }) => {
  await page.goto('/')

  const dismiss = page.getByRole('button', { name: 'Dismiss resume banner' })
  await expect(dismiss).toBeVisible({ timeout: 15000 })
  await dismiss.click()

  await expect(page.getByRole('link', { name: /^Continue PQC/ })).not.toBeVisible()

  // Reload — sessionStorage persists, so banner should stay hidden.
  await page.reload()
  await expect(page.getByRole('link', { name: /^Continue PQC/ })).not.toBeVisible()
})

test('renders nothing when no module has been visited', async ({ page }) => {
  await page.addInitScript(() => {
    // Override the beforeEach seed: empty modules map.
    localStorage.setItem(
      'pki-module-storage',
      JSON.stringify({
        state: {
          version: '1.0.0',
          modules: {},
          activeModuleId: null,
          completedModuleIds: [],
          recentActivityLog: [],
        },
        version: 14,
      })
    )
  })
  await page.goto('/')
  // Allow Landing to fully mount before asserting absence.
  await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('link', { name: /^Continue PQC/ })).not.toBeVisible()
})
