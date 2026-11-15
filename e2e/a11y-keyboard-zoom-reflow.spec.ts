// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { injectAxe, checkA11y } from 'axe-playwright'

const KEY_SURFACES = [
  '/learn/pki-enrollment-protocols',
  '/learn/vpn-ssh-pqc',
  '/playground/vpn-sim',
  '/playground/pki-workshop',
  '/business/tools/cost-of-inaction',
  '/business/tools/kpi-dashboard',
] as const

const ZOOM_AND_MOBILE_VIEWPORTS = [
  { label: '200% desktop zoom (720x450)', width: 720, height: 450 },
  { label: 'Mobile phone (390x844)', width: 390, height: 844 },
] as const

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
    localStorage.setItem('pqc-tour-completed', 'true')
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: { selectedPersona: 'architect', hasAcknowledgedExecutiveGrcSplit: true },
        version: 11,
      })
    )
  })
})

for (const surface of KEY_SURFACES) {
  test(`${surface} supports keyboard Tab navigation with visible focus and passes WCAG 2.1 AA serious/critical axe checks`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop keyboard focus and WCAG 2.1 AA gate')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(surface)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 })

    // Tab moves focus onto a visible control that shows a focus indicator.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused, `${surface}: Tab reaches a control`).toHaveCount(1)
    await expect(focused).toBeVisible()
    const indicator = await focused.evaluate((el) => {
      const s = getComputedStyle(el)
      const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0
      const ring = s.boxShadow !== 'none' && s.boxShadow !== ''
      return outline || ring
    })
    expect(indicator, `${surface}: the focused control shows a focus outline or ring`).toBe(true)

    await injectAxe(page)
    await checkA11y(page, 'main', {
      axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
      includedImpacts: ['critical', 'serious'],
    })
  })
}

for (const viewport of ZOOM_AND_MOBILE_VIEWPORTS) {
  test(`key learning, playground, and business surfaces reflow cleanly at ${viewport.label} without horizontal scroll`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Viewport matrix runs directly on desktop Chromium')
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    for (const surface of KEY_SURFACES) {
      await page.goto(surface)
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${surface} horizontal overflow at ${viewport.label}`).toBeLessThanOrEqual(1)
    }
  })
}
