// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * P11-P1-03 — Compliance regulator Focus view.
 *
 * Landscape tab → regulations facet → "Focus view" toggle replaces the grid
 * with a master-detail layout (left rail of frameworks, right pane detail).
 * Only the `regulations` landscape type is focus-eligible; other facets
 * (standards / technical / certification) do not surface the toggle.
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

test('toggling Focus view replaces the grid with master-detail', async ({ page }) => {
  // ?tab=compliance lands on the regulations facet of the landscape tab.
  await page.goto('/compliance?tab=compliance')

  // The Focus toggle button is only present on the regulations facet.
  const toggle = page.getByRole('button', { name: /focus view/i }).first()
  // Compliance is lazy-loaded; allow 15s for the chunk to compile cold.
  await expect(toggle).toBeVisible({ timeout: 15000 })
  await toggle.click()

  // FrameworkFocusView renders a section labelled "Framework focus view".
  await expect(page.getByRole('region', { name: 'Framework focus view' })).toBeVisible()

  // Left-rail nav is labelled "Frameworks".
  await expect(page.getByRole('navigation', { name: 'Frameworks' })).toBeVisible()
})

test('Return to framework grid exits Focus view', async ({ page }) => {
  await page.goto('/compliance?tab=compliance')

  const toggle = page.getByRole('button', { name: /focus view/i }).first()
  await expect(toggle).toBeVisible({ timeout: 15000 })
  await toggle.click()

  const back = page.getByRole('button', { name: 'Return to framework grid' })
  await expect(back).toBeVisible()
  await back.click()

  // Focus view region gone; toggle reverts to "Focus view" label.
  await expect(page.getByRole('region', { name: 'Framework focus view' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: /focus view/i }).first()).toBeVisible()
})

test('Focus view is not eligible on the standards facet', async ({ page }) => {
  // ?tab=standards → technical landscape type (not focus-eligible).
  await page.goto('/compliance?tab=standards')

  // Wait for Compliance to mount before asserting toggle absence.
  await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: /focus view/i })).toHaveCount(0)
})
