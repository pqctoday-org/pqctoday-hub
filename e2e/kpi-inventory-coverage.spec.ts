// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const tool of ['kpi-dashboard', 'kpi-tracker']) {
  test(`${tool}: inventory coverage follows the counts and rejects a bad denominator`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
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
    await denominator.fill('0')
    await expect(result).toContainText('a positive total')
    await denominator.fill('8')
    await expect(result).toContainText('no more inventoried systems than the total')
    await denominator.fill('24')
    await expect(result).toContainText('12 of 24 systems inventoried (50%)')
    await expect(score).toHaveValue(priorScore)

    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: '.md', exact: true }).click()
    let markdown = ''
    for await (const chunk of await (await pending).createReadStream()) markdown += chunk.toString()
    expect(markdown).toContain('12 of 24 systems inventoried (50%)')
    expect(markdown).not.toContain('12 of 20 systems inventoried (60%)')
  })
}
