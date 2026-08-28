// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * PKCS#11 Developer tab — /playground/hsm?tab=developer
 * (dev-tabs-pkcs11-kmip plan G6, WS-J).
 *
 * Local-only per the 2026-07-01 directive (new suites start here; promote
 * to the full/smoke tier only once proven reliably green). Covers the core
 * flows the plan's WS-J section names: load, template switch, a real
 * green run, save→reload→load→run, detach/revert, and export.
 *
 * Every "run" assertion here is genuinely live — the same Pyodide +
 * softhsmv3-wasm + p11 shim seam proven in P1/P2/R1, not mocked.
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
  })
})

test('loads with the default template and a labeled Developer token slot', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')

  await expect(page.getByRole('button', { name: 'Encrypt + sign (PQ)' })).toBeVisible({ timeout: 30000 })
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
})

test('runs the default template and shows a real per-step pass', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  const okBadges = page.getByText('✓ ran')
  await expect(okBadges.first()).toBeVisible()
  expect(await okBadges.count()).toBeGreaterThan(0)
  await expect(page.locator('.bg-red-500\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})

test('switching templates changes the visible step count', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: 'ML-KEM round trip' }).click()
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible()
})

test('save → reload the page → load the saved pipeline → run green', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: 'ML-KEM round trip' }).click()
  const uniqueName = `e2e-save-${Date.now()}`
  await page.getByLabel('Pipeline name').fill(uniqueName)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(`Saved "${uniqueName}"`)).toBeVisible()

  await page.reload()
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: uniqueName, exact: true }).click()
  await expect(page.getByLabel('Pipeline name')).toHaveValue(uniqueName)

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
})

test('editing the generated code detaches the builder; Revert restores it', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  const editor = page.locator('.monaco-editor .view-lines').first()
  await editor.click()
  await page.keyboard.press('End')
  await page.keyboard.type('\n# e2e-edit-marker')

  const detachBanner = page.getByText('you edited the generated code')
  await expect(detachBanner).toBeVisible()
  await page.getByRole('button', { name: 'Revert to builder' }).click()
  await expect(detachBanner).not.toBeVisible()
})

test('Export .py downloads a file carrying the provenance header', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export \.py/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.py$/)
  const path = await download.path()
  const fs = await import('node:fs')
  const content = fs.readFileSync(path!, 'utf-8')
  expect(content).toContain("PKCS#11 v3.2 Developer tab")
  expect(content).toContain('import p11')
})

test('the guided lesson drives the real Developer tab end to end, including a live run', async ({ page }) => {
  await page.goto('/playground/hsm')
  await page.getByRole('button', { name: /Lessons/i }).click()
  await page.getByRole('button', { name: /Build a PKCS#11 v3\.2 sequence/ }).click()

  // Step 1 (tourStep 0): no act — spotlights the real palette.
  await expect(page.getByText('The palette')).toBeVisible({ timeout: 30000 })

  // Step 2: act() clicks the real "Encrypt + sign (PQ)" template button —
  // lands on the Developer tab with it applied and a labeled token slot live.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Or start from a template')).toBeVisible()
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  // Step 3: no act — spotlights the Sign step's bound input.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText("Every step's inputs are bound")).toBeVisible()

  // Step 4: act() fires the real Run click — wait for the genuine
  // completion signal, not the tour's own step-advance timing.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Run it for real')).toBeVisible()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  // Step 5: no act — spotlights the real per-step result.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Read the result')).toBeVisible()

  // Step 6 (last): spotlights the export panel.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Take it to the sandbox')).toBeVisible()

  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('Take it to the sandbox')).not.toBeVisible()
})
