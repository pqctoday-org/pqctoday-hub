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
    // Wait for the app itself, not the loading shell's own heading: until the
    // app renders there is nothing to Tab to.
    await expect(page.getByText(/Initializing application/i)).toHaveCount(0, { timeout: 30_000 })
    await expect(page.locator('#main-content h1, #main-content h2').first()).toBeVisible({
      timeout: 20_000,
    })

    // Tab moves focus onto a visible control that shows a focus indicator.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body || el === document.documentElement) return null
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return {
        tag: el.tagName,
        visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden',
        // An outline, or a box-shadow layer that is visible: not transparent
        // and with a non-zero spread or blur (a focus ring).
        indicator:
          (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ||
          s.boxShadow.split(/,(?![^(]*\))/).some((layer) => {
            if (/rgba\([^)]*,\s*0\)/.test(layer) || layer.trim() === 'none') return false
            const lengths = (layer.match(/-?[\d.]+px/g) ?? []).map(parseFloat)
            return lengths.slice(2).some((v) => v > 0)
          }),
      }
    })
    expect(focus, `${surface}: Tab moves focus onto a control`).not.toBeNull()
    expect(focus!.visible, `${surface}: the focused ${focus!.tag} is visible`).toBe(true)
    expect(focus!.indicator, `${surface}: the focused ${focus!.tag} shows a focus indicator`).toBe(
      true
    )

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
