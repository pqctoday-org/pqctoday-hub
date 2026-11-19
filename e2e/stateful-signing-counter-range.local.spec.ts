// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the HSS workshop previews capacity beyond the exact counter at ${width}px`, async ({
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
    await simulator.getByRole('button', { name: 'L3 — HSS', exact: true }).click()
    const heights = simulator.getByRole('group', { name: 'Signing key parameters' })
    await heights.getByRole('button', { name: /H25/ }).first().click()
    const sign = simulator.getByRole('button', { name: 'Sign Message', exact: true })
    await expect(sign).toBeDisabled()
    await expect(simulator.getByText('Capacity preview', { exact: true })).toBeVisible()
    await expect(simulator.getByText(/can report at most 4,294,967,295/)).toBeVisible()

    await simulator.getByRole('button', { name: 'L1 — LMS', exact: true }).click()
    await heights.getByRole('button', { name: 'H5', exact: true }).click()
    await expect(simulator.getByText('Capacity preview', { exact: true })).toHaveCount(0)
    await sign.click()
    await expect(simulator.getByText('Used: 1', { exact: true })).toBeVisible()
    await expect(simulator.getByText('Remaining: 31', { exact: true })).toBeVisible()
  })
}
