// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the inspector identifies an Ed448 composite reference without claiming verification at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/hybrid-crypto?tab=workshop&step=6&sv=2')
    await page.getByRole('button', { name: 'IETF Reference Certs', exact: true }).click()
    await page.getByRole('button', { name: /^Composite: MLDSA87-Ed448-SHAKE256/ }).click()
    await page.getByRole('button', { name: 'Raw Output', exact: true }).click()
    await expect(
      page.getByText('Parsed RFC 10073 profile, outside this workshop’s self-signature checker.')
    ).toBeVisible()
    await expect(
      page
        .locator('pre')
        .filter({ hasText: 'Signature Algorithm: MLDSA87-Ed448-SHAKE256 (1.3.6.1.5.5.7.6.51)' })
    ).toBeVisible()
    await expect(page.getByText(/Selected composite self-signature checks passed/)).toHaveCount(0)
  })
}
