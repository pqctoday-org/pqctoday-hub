// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`coverage planning rounds each wave and widens a failed sample at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/verification-closure?tab=workshop&step=1')
    await page.getByLabel('Tier-1 systems (business-critical)', { exact: true }).fill('1')
    await page.getByLabel('Tier-2 systems (internal, sensitive)', { exact: true }).fill('7')
    await page.getByLabel('Tier-3 systems (long tail)', { exact: true }).fill('5')
    await page.getByLabel('Migration waves', { exact: true }).fill('3')
    const rate = page.getByLabel(/Sample rate for Tier-2\/3/)
    await rate.fill('20')
    const plan = page.getByRole('table', { name: 'Verification plan' })
    const result = plan.getByRole('row', { name: /Total verifications/ })
    // The three waves contain lower-tier pairs of (3,2), (2,2), and (2,1).
    // Each nonempty tier gets one check per wave, for six checks plus Tier-1.
    await expect(result.getByRole('cell', { name: '7', exact: true })).toBeVisible()
    await expect(result).toContainText('54% of 13')
    const failure = page.getByLabel('Wave with a failed lower-tier sample', { exact: true })
    await failure.fill('1')
    await expect(page.getByText('Wave 1 expands from 2 to 5 lower-tier checks.')).toBeVisible()
    await expect(result.getByRole('cell', { name: '10', exact: true })).toBeVisible()
    await expect(result).toContainText('77% of 13')
    await rate.fill('101')
    await expect(page.getByRole('alert')).toContainText('Sample rate must be between 0 and 100%')
    await expect(plan).toHaveCount(0)
    await rate.fill('0')
    await expect(page.getByRole('alert')).toContainText('Wave 1 has no lower-tier sample')
    await failure.fill('0')
    await expect(result.getByRole('cell', { name: '1', exact: true })).toBeVisible()
    await expect(result).toContainText('8% of 13')
  })
}
