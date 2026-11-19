// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const modules = [
  'crypto-agility',
  'crypto-registry',
  'email-signing',
  'digital-id',
  'dev-quantum-impact',
  'acvp-lab-workflow',
  'mls-group-messaging',
  'trust-services-pqc',
  'verification-closure',
]

for (const moduleId of modules) {
  for (const viewport of [
    { label: 'desktop', width: 1280, height: 900 },
    { label: 'phone', width: 390, height: 844 },
  ]) {
    test(`${moduleId} Learn page has no serious or critical WCAG 2 A/AA issues at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
        )
        localStorage.setItem('pqc-tour-completed', 'true')
      })
      await page.goto(`/learn/${moduleId}`)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('main').getByRole('heading', { level: 1 }).first()).toBeVisible({
        timeout: 15_000,
      })
      await injectAxe(page)
      const violations = await getViolations(page, 'main', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(
        violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
        `${moduleId} at ${viewport.width}px`
      ).toEqual([])
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${moduleId} horizontal overflow`).toBeLessThanOrEqual(1)
    })
  }
}
