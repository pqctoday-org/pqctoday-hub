// SPDX-License-Identifier: GPL-3.0-only
//
// Agility Workbench scenario picker — asserts the panel shows ONLY the validated
// scenarios tied to the active policy, swaps the list when the policy changes,
// and runs each scenario's request through the live engine, comparing the
// verdict to the scenario's expectation.
//
// Venue: `*.local.spec.ts` — excluded from CI (project directive 2026-07-01).
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem('cacp-mode', 'expert')
  })
})

test('scenario picker: filters by active policy and validates verdicts', async ({ page }) => {
  // 2026-09-02 redesign: the scenarios are Policy's 6th sub-view (D4),
  // deep-linkable as ?tab=policy&view=scenarios; the policy is picked from
  // the catalog on the same tab.
  await page.goto('/playground/cacp?tab=policy&view=scenarios')
  await expect(page.getByRole('heading', { name: /KMIP Control Plane/i })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByRole('heading', { name: 'Test scenarios' })).toBeVisible({
    timeout: 15000,
  })

  // Default policy (built-in permissive) → only training-permissive scenarios.
  await expect(page.getByTestId('scenario-perm-sign-mldsa')).toBeVisible()
  await expect(page.getByTestId('scenario-pqc-rekey-ecdsa')).toHaveCount(0)
  console.log('default: perm scenario shown, pqc hidden ✓')

  // Pick the PQC policy chip → list swaps to the PQC scenarios only.
  // The catalog button's accessible name is the whole card (label + rule
  // count + blurb) — match on the label as a prefix.
  await page.getByRole('button', { name: /^PQC \(the "after"\)/ }).click()
  await expect(page.getByTestId('scenario-pqc-rekey-ecdsa')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('scenario-perm-sign-mldsa')).toHaveCount(0)
  console.log('after picking PQC: pqc scenarios shown, perm hidden ✓ (filtering works)')

  // Run all → summary + per-scenario verdicts vs expected.
  await page.getByRole('button', { name: 'Run all' }).click()
  await expect(page.getByText(/\d+\/\d+ match/)).toBeVisible({ timeout: 15000 })
  const summary = await page.getByText(/\d+\/\d+ match/).innerText()
  console.log('SUMMARY =', summary)

  // The rekey scenario should show engine: Rekey and "matches".
  const rekey = page.getByTestId('scenario-pqc-rekey-ecdsa')
  await expect(rekey.getByText('engine: Rekey')).toBeVisible()
  await expect(rekey.getByText('matches')).toBeVisible()
  console.log('pqc-rekey scenario: engine Rekey, matches ✓')
})
