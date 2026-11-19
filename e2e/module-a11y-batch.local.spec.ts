// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { checkA11y, injectAxe } from 'axe-playwright'

const modules = ['merkle-tree-certs', 'platform-eng-pqc', 'software-supply-chain-pqc']

for (const moduleId of modules) {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
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
      await expect(page.getByRole('main').getByRole('heading', { level: 1 }).first()).toBeVisible({
        timeout: 15_000,
      })
      await injectAxe(page)
      await checkA11y(page, 'main', {
        axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
        includedImpacts: ['critical', 'serious'],
      })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      ).toBeLessThanOrEqual(1)
    })
  }
}
