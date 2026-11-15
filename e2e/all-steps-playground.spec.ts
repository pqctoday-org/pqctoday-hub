// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { TOOL_ROUTE_META } from '../src/seo/toolRouteMeta.generated'
import { ALL_PLAYGROUND_TOOL_IDS } from '../src/data/playgroundCapabilityChecklists'

const BROWSER_TOOL_ROUTES = TOOL_ROUTE_META.filter((route) => route.kind === 'browser-tool')

const PRIORITY_REMEDIATION_TOOLS = [
  '/playground/vpn-sim',
  '/playground/pqc-ssh-sim',
  '/playground/web-gateway',
  '/playground/secrets-mgr',
  '/playground/jwt-pqc',
  '/playground/lms-hss',
  '/playground/pki-workshop',
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
        state: { selectedPersona: 'developer', hasAcknowledgedExecutiveGrcSplit: true },
        version: 11,
      })
    )
  })
})

test('all 35 native browser playground tools are registered in playgroundCapabilityChecklists', () => {
  expect(ALL_PLAYGROUND_TOOL_IDS).toHaveLength(35)
})

for (const route of BROWSER_TOOL_ROUTES) {
  test(`${route.path} renders PlaygroundCapabilityBanner, evidence notice, and Try it exercise`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop full-catalog capability banner sweep')
    await page.goto(route.path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel('How this tool runs').first()).toBeVisible()

    const banner = page.getByTestId('playground-capability-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Production Tool Capabilities & Verification Requirements')
  })
}

for (const path of PRIORITY_REMEDIATION_TOOLS) {
  test(`${path} opens cleanly on desktop and mobile without console errors or horizontal spillover`, async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })

    const banner = page.getByTestId('playground-capability-banner')
    await expect(banner).toBeVisible()
    await banner.locator('summary').click()
    await expect(banner).toContainText('What this sample check establishes:')
    await expect(banner).toContainText('Browser sandbox limitation (non-certification boundary):')
    await expect(banner).toContainText('What to require and test in your production tools:')
    await page.getByTestId('playground-tamper-toggle-btn').click()
    await expect(page.getByTestId('playground-tamper-status')).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, `${path} mobile horizontal overflow`).toBeLessThanOrEqual(1)
    expect(consoleErrors, `Unhandled page errors on ${path}`).toEqual([])
  })
}
