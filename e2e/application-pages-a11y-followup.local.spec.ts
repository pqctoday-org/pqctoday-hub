// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const pages = [
  { id: 'assess', path: '/assess' },
  { id: 'report', path: '/report' },
  { id: 'landing', path: '/' },
  { id: 'learn', path: '/learn' },
  { id: 'playground-cacp', path: '/playground/cacp' },
  { id: 'playground-hsm', path: '/playground/hsm' },
  { id: 'algorithms', path: '/algorithms' },
  { id: 'compliance', path: '/compliance' },
  { id: 'migrate', path: '/migrate' },
  { id: 'business', path: '/business' },
  { id: 'timeline', path: '/timeline' },
  { id: 'library', path: '/library' },
  { id: 'playground', path: '/playground' },
  { id: 'playground-interactive', path: '/playground/interactive' },
  { id: 'openssl', path: '/openssl' },
  { id: 'threats', path: '/threats' },
  { id: 'simulation', path: '/simulation' },
  { id: 'patents', path: '/patents' },
  { id: 'leaders', path: '/leaders' },
  { id: 'explore', path: '/explore' },
  { id: 'revisions', path: '/revisions' },
  { id: 'faq', path: '/faq' },
  { id: 'editorial', path: '/editorial-independence' },
  { id: 'sponsor', path: '/sponsor' },
  { id: 'terms', path: '/terms' },
  { id: 'navigate', path: '/navigate' },
]

for (const { id, path } of pages) {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`${id} page passes focused WCAG 2 A/AA and overflow checks at ${viewport.width}px`, async ({
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
      await page.goto(path)
      const main = page.getByRole('main')
      await expect(main).toBeVisible({ timeout: 15_000 })
      await expect(main.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 15_000 })
      await injectAxe(page)
      const violations = await getViolations(page, 'main', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(
        violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
        `${id} at ${viewport.width}px`
      ).toEqual([])
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${id} horizontal overflow`).toBeLessThanOrEqual(1)
    })
  }
}
