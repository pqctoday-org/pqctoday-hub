// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Crypto Lab Workbench acceptance — /playground.
 *
 * The redesign replaced the seven-control monolith (and the curious
 * "minimal-mode" gate) with one app-like two-pane layout: a persistent sidebar
 * and one main pane. Role is now a single optional re-sorting input — there is
 * no per-persona gate; every role sees the same chrome.
 *
 * Phase 0.2 fix: Playground no longer has its own page-local "Viewing as"
 * persona control — it only READS `usePersonaStore` (role is set elsewhere,
 * e.g. the shared `PersonaChip` used by other pages' headers, or the Persona
 * Journeys landing page) and re-sorts/re-titles its content accordingly.
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
  // "KMIP Control Plane" is now the one consistent name used on both the feature
  // card and the "Featured" banner further down this Overview (playground.md item 3).
  await expect(page.getByText('KMIP Control Plane').first()).toBeVisible()

  // No role selected → the shared top-bar PersonaChip renders nothing (it
  // returns null when selectedPersona is unset) and Playground has no
  // page-local persona control of its own (Phase 0.2) — no minimal-mode
  // gate exists either.
  await expect(page.getByRole('button', { name: /Viewing as/i })).toHaveCount(0)
  await expect(page.getByTestId('playground-show-full-catalog')).toHaveCount(0)
})

test('curious persona sees the same workbench (no minimal-mode gate)', async ({ page }) => {
  await page.addInitScript(seedPersona, 'curious')
  await page.goto('/playground')

  await expect(page.getByText('Crypto Lab')).toBeVisible({ timeout: 15000 })
  // No page-local persona control exists (Phase 0.2) — Playground only reads
  // the seeded persona and re-titles its content, it never renders a picker.
  await expect(page.getByRole('button', { name: /Viewing as/i })).toHaveCount(0)
  await expect(page.getByText('Recommended for Curious Explorer')).toBeVisible()
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

// playground.md item 4 — deep-linked sub-pages must show executive orientation
// too, not just the workshop index (previously the only page with this banner).
test('executive persona deep-linked directly to /playground/interactive sees orientation framing', async ({
  page,
}) => {
  await page.addInitScript(seedPersona, 'executive')
  await page.goto('/playground/interactive')

  await expect(
    page.getByText('Interactive Playground is a hands-on engineering workbench.')
  ).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByRole('link', { name: 'Command Center →' })).toBeVisible()
})

test('executive persona deep-linked directly to /playground/hsm sees orientation framing', async ({
  page,
}) => {
  await page.addInitScript(seedPersona, 'executive')
  await page.goto('/playground/hsm')

  await expect(
    page.getByText('PKCS#11 HSM Playground is a hands-on engineering workbench.')
  ).toBeVisible({ timeout: 15000 })
})

test('executive persona deep-linked directly to /playground/cacp sees orientation framing', async ({
  page,
}) => {
  await page.addInitScript(seedPersona, 'executive')
  await page.goto('/playground/cacp')

  // This asserted the old ExecutiveRedirectBanner — "KMIP Control Plane is a
  // hands-on engineering workbench." — which B+ remediation 4.5 (2026-08-10)
  // deliberately removed. That banner answered the site's most important
  // audience, on its clearest demonstration of crypto agility, by pointing at
  // the door. The replacement tells the three-step story the console can
  // actually deliver, so the orientation an executive gets here is the story
  // panel, and that is what this test now pins.
  const story = page.getByRole('region', { name: /Crypto agility in three steps/i })
  await expect(story).toBeVisible({ timeout: 20000 })

  // The links out survive INSIDE the panel, as an exit after the story rather
  // than an alternative to it — the distinction the remediation turned on.
  await expect(story.getByRole('link').first()).toBeVisible()

  // And the console itself is present: the panel narrates a real engine, it
  // does not stand in for one.
  await expect(page.getByRole('heading', { name: /KMIP Control Plane/i })).toBeVisible()
})
