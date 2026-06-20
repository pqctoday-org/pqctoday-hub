// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Crypto Lab Workbench acceptance — /playground.
 *
 * The redesign replaced the seven-control monolith (and the curious
 * "minimal-mode" gate) with one app-like two-pane layout: a persistent sidebar
 * and one main pane. Role is now a single optional re-sorting input — there is
 * no per-persona gate; every role sees the same chrome.
 */

function seedPersona(p: string) {
  window.localStorage.setItem(
    'pqc-learning-persona',
    JSON.stringify({ state: { selectedPersona: p }, version: 8 })
  )
}

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
    localStorage.setItem('pqc-tour-completed', 'true')
  })
})

test('renders the two-pane workbench — sidebar, Overview and full-playground cards', async ({
  page,
}) => {
  await page.goto('/playground')

  // Sidebar brand + main Overview hero.
  await expect(page.getByText('Crypto Lab')).toBeVisible({ timeout: 15000 })
  await expect(
    page.getByRole('heading', { name: /Run real cryptography in your browser/i })
  ).toBeVisible()

  // The three full-playground feature cards (link to the special routes).
  await expect(page.getByText('Interactive Playground')).toBeVisible()
  await expect(page.locator('a[href="/playground/hsm"]')).toBeVisible()
  await expect(page.getByText('KMIP Control Plane')).toBeVisible()

  // Default role is Everyone; no minimal-mode gate exists anymore.
  await expect(page.getByText('Everyone')).toBeVisible()
  await expect(page.getByTestId('playground-show-full-catalog')).toHaveCount(0)
})

test('curious persona sees the same workbench (no minimal-mode gate)', async ({ page }) => {
  await page.addInitScript(seedPersona, 'curious')
  await page.goto('/playground')

  await expect(page.getByText('Crypto Lab')).toBeVisible({ timeout: 15000 })
  // Role selector reflects the persona.
  await expect(page.getByRole('button', { name: /Viewing as Curious Explorer/i })).toBeVisible()
  // The removed minimal-mode CTA must not reappear.
  await expect(page.getByTestId('playground-show-full-catalog')).toHaveCount(0)
  // Overview hero is present (catalog is not gated behind a disclosure step).
  await expect(
    page.getByRole('heading', { name: /Run real cryptography in your browser/i })
  ).toBeVisible()
})

test('developer persona re-titles the recommended pool', async ({ page }) => {
  await page.addInitScript(seedPersona, 'developer')
  await page.goto('/playground')

  await expect(page.getByText('Crypto Lab')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Recommended for Developer')).toBeVisible()
})

test('search spans all categories and switches to a flat result list', async ({ page }) => {
  await page.goto('/playground')
  await expect(page.getByText('Crypto Lab')).toBeVisible({ timeout: 15000 })

  await page.getByRole('searchbox', { name: /search tools/i }).fill('bitcoin')
  await expect(page.getByRole('heading', { name: /Results for/i })).toBeVisible()
  await expect(page.getByText('Bitcoin Transaction')).toBeVisible()
})
