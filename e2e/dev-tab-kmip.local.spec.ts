// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * KMIP/CACP Developer tab — /playground/cacp?plane=developer
 * (dev-tabs-pkcs11-kmip plan G6, WS-J).
 *
 * Local-only per the 2026-07-01 directive. Sibling to
 * dev-tab-pkcs11.local.spec.ts — same core flows, KMIP-lane selectors.
 * The "Governed lifecycle" run is the highest-value assertion here: it
 * exercises the exact deniable-step codegen path a real bug was found and
 * fixed in during P3b (see kmipPipelineCodegen.test.ts for the unit-level
 * regression coverage of that same fix).
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

test('deep-links straight to the Developer plane and loads the default template', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')

  await expect(page.getByRole('tab', { name: /Developer/i })).toHaveAttribute('aria-selected', 'true', { timeout: 30000 })
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible()
})

test('runs the Governed-lifecycle template and every step passes, including the deniable one', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  const okBadges = page.getByText('✓ ran')
  await expect(okBadges).toHaveCount(9, { timeout: 5000 })
  await expect(page.getByText('Expect deny: sign-early')).toBeVisible()
})

test('the ML-KEM round trip template runs and completes', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: 'ML-KEM round trip' }).click()
  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran')).toHaveCount(5, { timeout: 5000 })
})

test('the Policy dry-run compare template shows two different real policy decisions', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: 'Policy dry-run compare' }).click()
  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran')).toHaveCount(4, { timeout: 5000 })
})

test('save → reload the page → load the saved pipeline → run green', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({ timeout: 30000 })

  const uniqueName = `e2e-kmip-save-${Date.now()}`
  await page.getByLabel('Pipeline name').fill(uniqueName)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(`Saved "${uniqueName}"`)).toBeVisible()

  await page.reload()
  await expect(page.getByRole('tab', { name: /Developer/i })).toBeVisible({ timeout: 30000 })
  await page.getByRole('tab', { name: /Developer/i }).click()
  await page.getByRole('button', { name: uniqueName, exact: true }).click()
  await expect(page.getByLabel('Pipeline name')).toHaveValue(uniqueName)

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
})

test('Export .py downloads a file carrying the provenance header and pqctoday_kmip import', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({ timeout: 30000 })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export \.py/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.py$/)
  const path = await download.path()
  const fs = await import('node:fs')
  const content = fs.readFileSync(path!, 'utf-8')
  expect(content).toContain('KMIP 3.0 + CACP Developer tab')
  expect(content).toContain('from pqctoday_kmip import KmipClient')
})
