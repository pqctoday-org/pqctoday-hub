// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * One-off smoke pass for the 2026-07-10 KMIP/PKCS#11 wasm refresh
 * (softhsmrustv3-engine + cacp-kmip rebuilt from pqctoday-hsm v0.14.0).
 *
 * The named WP-0 e2e specs (playground-cacp, acvp-validator, hsm-boundary,
 * strongswan, vpn-rust-module, tls-hsm, cms-hsm-sign) already cover most
 * demo tabs. This fills the remaining gap: the KMIP3.0 Command Lab's own
 * sub-tabs (Learn/Commands/Dev, the latter's palette switched to the OASIS
 * corpus) and the Policy plane, none of which are exercised by those
 * specs — confirming the new bundle renders them without a console error
 * or crash, since there's no reachable path to actually exercise
 * Certify/Re-certify in wasm (see PR description).
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

test('KMIP3.0 Command Lab + Policy plane render cleanly on the refreshed bundle', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /KMIP Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // Policy plane
  await page.getByRole('tab', { name: 'Policy' }).click()
  await expect(page.getByText(/policy/i).first()).toBeVisible({ timeout: 10000 })

  // KMIP3.0 Command Lab
  await page.getByRole('tab', { name: 'KMIP3.0' }).click()
  const subTabs = page.locator('[data-tour="kmip3-subtabs"]')
  await expect(subTabs.getByRole('tab', { name: 'Learn' })).toBeVisible({ timeout: 10000 })

  await subTabs.getByRole('tab', { name: 'Learn' }).click()
  await page.waitForTimeout(500)

  await subTabs.getByRole('tab', { name: 'Commands' }).click()
  await expect(page.getByText(/Register/).first()).toBeVisible({ timeout: 10000 })

  // The OASIS corpus is a palette source inside the Dev sub-tab's pipeline
  // builder (2026-09-01 restructure — see
  // kmip3-corpus-palette-plan-09012026.md), not its own sub-tab any more.
  await subTabs.getByRole('tab', { name: 'Dev' }).click()
  await page.locator('[data-tour="kmip-dev-palette-source"] button').click()
  await page.getByRole('option', { name: /Corpus/ }).click()
  await page.waitForTimeout(500)

  const seriousErrors = consoleErrors.filter(
    (e) => !/ResizeObserver|Download the React DevTools/i.test(e)
  )
  expect(seriousErrors, `unexpected console errors: ${seriousErrors.join('\n')}`).toEqual([])
})
