// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`policy rotation period requires an explicit decision at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/policy-generator')
    await page.getByRole('button', { name: 'Key Management Policy' }).click()

    const rotation = page.getByRole('button', { name: 'Maximum Key Rotation Period' })
    await expect(rotation).toContainText(/select/i)
    await expect(
      page.getByText(/Data sensitivity or algorithm agility alone does not determine/)
    ).toBeVisible()
    await expect(page.getByText(/Revision 6 is still an initial public draft/)).toBeVisible()

    await rotation.click()
    await page.getByRole('option', { name: '1 year', exact: true }).click()
    await expect(rotation).toContainText('1 year')
    await page.getByRole('button', { name: /Preview/i }).click()
    await expect(page.getByText(/Rotation Period/)).toBeVisible()
    await expect(page.getByText(/Rotation Period:\s*1 year/)).toBeVisible()
  })
}
