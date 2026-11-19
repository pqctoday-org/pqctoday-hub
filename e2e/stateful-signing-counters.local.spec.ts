// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the stateful signer waits for one key operation before advancing the counter at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/stateful-signatures?tab=workshop&step=2')
    const simulator = page
      .getByRole('heading', { name: 'State Management Simulator' })
      .locator('../..')
    await expect(simulator.getByText('Live HSM Mode Active', { exact: true })).toBeVisible({
      timeout: 25_000,
    })
    const sign = simulator.getByRole('button', { name: 'Sign Message', exact: true })
    await sign.evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
    await expect(simulator.getByText('Used: 1', { exact: true })).toBeVisible()
    await expect(sign).toBeEnabled()
    const log = simulator.getByRole('heading', { name: 'Signature Log', exact: true }).locator('..')
    await expect(log.getByText('#0000', { exact: true })).toHaveCount(1)
    await sign.click()
    await expect(simulator.getByText('Used: 2', { exact: true })).toBeVisible()
    await expect(log.getByText('#0001', { exact: true })).toHaveCount(1)
    await simulator.getByRole('button', { name: 'Reset key', exact: true }).click()
    await expect(simulator.getByText('Used: 0', { exact: true })).toBeVisible()
    await expect(log.getByText('#0000', { exact: true })).toHaveCount(0)
    await sign.click()
    await expect(simulator.getByText('Used: 1', { exact: true })).toBeVisible()
    await expect(log.getByText('#0000', { exact: true })).toHaveCount(1)
  })
}
