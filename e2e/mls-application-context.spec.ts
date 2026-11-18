// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, width, useHsm } of [
  { route: '/learn/mls-group-messaging?tab=workshop', width: 390, useHsm: false },
  { route: '/playground/mls-group-messaging', width: 1280, useHsm: true },
]) {
  test(`${route}: receive the same application content under matching and mismatched contexts`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await page.goto(route)
    const card = page.getByRole('region', { name: /Application message encryption/ })
    await expect(card).toBeVisible()
    const hsmMode = page.getByText('Live HSM Mode Active', { exact: true }).first()
    await expect(hsmMode).toBeVisible({ timeout: 20_000 })
    if (!useHsm) await page.getByRole('button', { name: 'Disable', exact: true }).first().click()

    const message = 'Quarterly exercise café'
    await card.getByLabel('Message:').fill(message)
    const context = card.getByRole('button', { name: 'Receiver context' })
    const run = card.getByRole('button', { name: 'Run', exact: true })
    const output = card.locator('pre')
    for (const label of ['Different epoch', 'Different group', 'Different content type']) {
      await context.click()
      await page.getByRole('option', { name: label, exact: true }).click()
      await run.click()
      await expect(output).toContainText('Receiver rejected the message.')
      await expect(output).not.toContainText(message)
      if (useHsm) await expect(output).toContainText('[HSM] Ciphertext')
    }

    await context.click()
    await page.getByRole('option', { name: 'Matching context', exact: true }).click()
    await run.click()
    await expect(output).toContainText('Receiver accepted the message.')
    await expect(output).toContainText(`Recovered message: "${message}"`)
    if (useHsm) await expect(output).toContainText('[HSM] Ciphertext')
  })
}
