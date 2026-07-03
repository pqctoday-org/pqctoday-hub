// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * CACP Visual policy editor — /playground/cacp → Policy → Visual.
 *
 * Exercises the node-graph editor: open the tab, load a preset, add a rule from
 * the palette, edit a field, run a simulation and assert the engine verdict
 * badge, toggle orientation, and confirm the generated YAML drawer reflects an
 * edit.
 *
 * Venue: `*.local.spec.ts` — excluded from the CI Playwright run via
 * `testIgnore` in playwright.config.ts (directive 2026-07-01: new suites are
 * local-only). Run with `npm run test:e2e:cacp-visual`.
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
    localStorage.setItem('pqc-tour-completed', 'true')
    localStorage.setItem('cacp-mode', 'expert')
  })
})

test('opens the Visual editor, edits a policy, simulates, and reflects it in YAML', async ({
  page,
}) => {
  await page.goto('/playground/cacp')

  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // → Policy plane (plane switcher is a tablist), then the Visual sub-tab.
  await page.getByRole('tab', { name: 'Policy', exact: true }).click()
  await page.getByRole('tab', { name: 'Visual' }).click()

  // The canvas legend confirms the graph rendered (default orientation).
  await expect(page.getByText('↓ waterfall')).toBeVisible({ timeout: 15000 })

  // Add a Deny rule from the palette (expert mode shows the raw type name in the
  // button); the inspector opens for the new node.
  await page.getByRole('button', { name: /algorithm_denylist/ }).click()
  await expect(page.getByText('algorithm_denylist').first()).toBeVisible()

  // Run a simulation → the authoritative engine verdict badge appears.
  await page.getByRole('button', { name: 'Simulate', exact: true }).click()
  await page.getByRole('button', { name: /Run through the pipeline/i }).click()
  await expect(page.getByText('engine verdict')).toBeVisible({ timeout: 15000 })

  // Toggle orientation (waterfall → pipeline) via the toolbar button.
  await page.getByRole('button', { name: 'Waterfall' }).click()
  await expect(page.getByText('→ pipeline')).toBeVisible()

  // The YAML drawer reflects the edited graph.
  await page.getByRole('button', { name: /policy source \(YAML\)/i }).click()
  await expect(page.locator('pre')).toContainText('schema_version: 1')
})
