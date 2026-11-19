// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

for (const tool of ['kpi-dashboard', 'kpi-tracker']) {
  for (const width of [1280, 390]) {
    test(`${tool}: inventory coverage follows the counts at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
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
      await page.goto(`/business/tools/${tool}`)
      const row = page.getByTestId('kpi-dim-systems-inventoried')
      await row.getByText('Sample measure notes', { exact: true }).click()
      const numerator = row.getByLabel('Systems Inventoried Numerator')
      const denominator = row.getByLabel('Systems Inventoried Denominator')
      const score = row.getByRole('slider')
      const priorScore = await score.inputValue()
      await numerator.fill('12')
      await denominator.fill('20')
      const result = row.getByRole('status')
      await expect(result).toContainText('12 of 20 systems inventoried (60%)')
      const markdown = async () => {
        const [file] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: '.md', exact: true }).click(),
        ])
        return text(await file.createReadStream())
      }
      await denominator.fill('0')
      await expect(result).toContainText('a positive total')
      const invalidExport = await markdown()
      expect(invalidExport).toContain('a positive total')
      expect(invalidExport).not.toContain('12 of 20 systems inventoried (60%)')
      await denominator.fill('8')
      await expect(result).toContainText('no more inventoried systems than the total')
      await denominator.fill('24')
      await expect(result).toContainText('12 of 24 systems inventoried (50%)')
      await expect(score).toHaveValue(priorScore)

      const restoredExport = await markdown()
      expect(restoredExport).toContain('12 of 24 systems inventoried (50%)')
      expect(restoredExport).not.toContain('12 of 20 systems inventoried (60%)')
    })
  }
}
