// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const scenario of [
  { route: '/playground/kdf-derivation', panel: 'QKD/HSM PQC Known Answer Tests', width: 390 },
  { route: '/playground/token-migration', panel: 'IAM PQC Known Answer Tests', width: 1280 },
  {
    route: '/playground/firmware-signing',
    panel: 'Secure Boot PQC Known Answer Tests',
    width: 1280,
  },
]) {
  test(`${scenario.panel}: report engine initialization failure and retry with live results`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: scenario.width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-hsm-mode-storage',
        JSON.stringify({ state: { liveHsmEnabled: false }, version: 1 })
      )
    })
    const engineExecutable = /\/(?:assets|wasm)\/[^?]*softhsm[^?]*\.wasm(?:\?|$)/i
    await page.route(engineExecutable, (route) => route.abort())
    await page.goto(scenario.route)

    const panel = page.getByRole('region', { name: scenario.panel, exact: true })
    const log = panel.getByRole('log', { name: 'Operation log' })
    const status = panel.getByTestId('kat-run-status')
    await panel.getByRole('button', { name: 'Run known-answer checks', exact: true }).click()
    await expect(status).toContainText('the checks could not run')
    await expect(log.locator('[data-operation-status="error"]')).toContainText('HSM init failed')
    await expect(log.locator('[data-operation-status="success"]')).toHaveCount(0)

    await page.unroute(engineExecutable)
    await panel.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(status).toContainText(/\d+ of \d+ checks passed/, { timeout: 35_000 })
    const outcomes = await panel
      .getByTestId('kat-status')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-status')))
    expect(outcomes).toContain('pass')
    await expect(log.locator('[data-operation-status="success"]')).toHaveCount(
      1 + outcomes.filter((value) => value === 'pass').length
    )
    await expect(log.locator('[data-operation-status="skipped"]')).toHaveCount(
      outcomes.filter((value) => value === 'skip').length
    )
    await expect(log.locator('[data-operation-status="error"]')).toHaveCount(
      outcomes.filter((value) => value === 'fail' || value === 'error').length
    )
  })
}
