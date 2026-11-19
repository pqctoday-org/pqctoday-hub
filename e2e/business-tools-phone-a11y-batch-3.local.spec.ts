// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const toolsToCheck = [
  ['raci-builder', 'RACI Builder'],
  ['policy-generator', 'Policy Template Generator'],
  ['kpi-dashboard', 'KPI Dashboard Builder'],
  ['vendor-scorecard', 'Vendor Scorecard Builder'],
  ['supply-chain-matrix', 'Supply Chain Risk Matrix'],
  ['roadmap-builder', 'Roadmap Builder'],
] as const

for (const [slug, title] of toolsToCheck) {
  test(`${title} phone route passes WCAG serious/critical scan without page overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 3 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto(`/business/tools/${slug}`)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)
  })
}
