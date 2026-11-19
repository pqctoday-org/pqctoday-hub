// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from '@playwright/test'
import { injectAxe, getViolations } from 'axe-playwright'

test.use({ reducedMotion: 'reduce' })

const MODULES = [
  'crypto-mgmt-modernization',
  'entropy-randomness',
  'digital-assets',
  'government-defense-pqc',
  'healthcare-pqc',
  'aerospace-pqc',
  'emv-payment-pqc',
  'ai-security-pqc',
  'database-encryption-pqc',
  'exec-quantum-impact',
  'arch-quantum-impact',
  'cc-eucc-certification',
  'crypto-product-certification',
  'fips-140-3-certification',
  'media-drm-pqc',
  'pqc-candidates',
  'pki-enrollment-protocols',
  'secrets-management-pqc',
]

test.beforeEach(async ({ page }) => {
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
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({ state: { selectedPersona: 'architect' }, version: 10 })
    )
  })
})

for (const id of MODULES) {
  test(`/learn/${id} passes desktop and phone axe/overflow checks`, async ({ page }) => {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(`/learn/${id}`)
      await expect(page.locator('main')).toBeVisible()
      await page.waitForTimeout(300)
      await injectAxe(page)
      const violations = await getViolations(page, undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(
        violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'),
        `${id} at ${width}px`
      ).toEqual([])
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      )
      expect(overflow, `${id} horizontal overflow at ${width}px`).toBe(false)
    }
  })
}
