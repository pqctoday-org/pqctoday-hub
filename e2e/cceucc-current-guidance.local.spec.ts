// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'

test('EUCC names the November 2026 CSP guidance as non-binding at desktop and phone widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/cc-eucc-certification?tab=learn&path=eucc&section=eucc-scheme')
    const link = page.getByRole('link', {
      name: 'CSP-based evaluation guidance for secure elements',
    })
    await expect(link).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/does not add a new legal certification requirement/)).toBeVisible()
    await page.waitForTimeout(300)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
    await injectAxe(page)
    const violations = await getViolations(page, undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
  }
})
