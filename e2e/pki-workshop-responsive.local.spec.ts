// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { injectAxe, getViolations } from 'axe-playwright'

const routes = [
  '/learn/pki-workshop',
  ...Array.from(
    { length: 8 },
    (_, index) => `/learn/pki-workshop?tab=workshop&step=${index + 1}&sv=2`
  ),
]

for (const width of [1280, 390]) {
  test(`PKI Workshop lesson and eight steps fit ${width}px without serious WCAG 2 A/AA violations`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
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
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({ state: { selectedPersona: 'pki-engineer' }, version: 10 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })

    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${route} at ${width}px horizontal overflow`).toBeLessThanOrEqual(1)
      await injectAxe(page)
      const violations = await getViolations(page, undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious, `${route} at ${width}px`).toEqual([])
    }
  })
}
