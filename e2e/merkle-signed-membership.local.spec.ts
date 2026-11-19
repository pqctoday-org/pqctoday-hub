// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const routes = ['/learn/merkle-tree-certs?tab=workshop&step=5', '/playground/merkle-proof?step=5']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`signed checkpoint membership is independent of a changed proof at ${width}px on ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(route)
      await expect(page.getByText('Live HSM Mode Active', { exact: true })).toBeVisible({
        timeout: 25_000,
      })
      await page.getByRole('button', { name: /Generate ML-DSA-65 CA Key/ }).click()
      await page.getByRole('button', { name: 'Load 5 samples' }).click()
      await expect(page.getByText('CA ML-DSA-65 signature created', { exact: true })).toBeVisible()
      const membership = page.getByRole('region', {
        name: 'Verify membership against the signed checkpoint',
      })
      await membership.getByLabel('Certificate to verify').selectOption('1')
      const check = membership.getByRole('button', { name: 'Verify certificate membership' })
      const outcome = membership.getByRole('status', { name: 'Checkpoint membership result' })
      await check.click()
      await expect(outcome).toContainText('Checkpoint signature verified.')
      await expect(outcome).toContainText('Proof path matches the published root.')
      await expect(outcome).toContainText('Membership accepted.')

      const sibling = membership.getByLabel('Change one sibling hash')
      await sibling.check()
      await expect(outcome).toBeEmpty()
      await check.click()
      await expect(outcome).toContainText('Checkpoint signature verified.')
      await expect(outcome).toContainText('Proof path differs from the published root.')
      await expect(outcome).toContainText('Membership rejected.')

      await sibling.uncheck()
      await check.click()
      await expect(outcome).toContainText('Membership accepted.')
    })
  }
}
