// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, type Page } from './fixtures/blockAnalytics'
import { TOOL_ROUTE_META } from '../src/seo/toolRouteMeta.generated'
import {
  ALL_PLAYGROUND_TOOL_IDS,
  getPlaygroundCapabilityChecklist,
} from '../src/data/playgroundCapabilityChecklists'

const BROWSER_TOOL_ROUTES = TOOL_ROUTE_META.filter((route) => route.kind === 'browser-tool')
const toolIdOf = (path: string) => path.split('/').pop() ?? path

// Requests the browser cancels on navigation (a lazy chunk, a prefetch) log a
// console error that says nothing about the page; every other error counts.
const ABORTED_REQUEST_NOISE =
  /net::ERR_ABORTED|AbortError|The user aborted a request|signal is aborted|NS_BINDING_ABORTED/i

function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !ABORTED_REQUEST_NOISE.test(msg.text())) {
      errors.push(`console.error: ${msg.text()}`)
    }
  })
  return errors
}

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

test('every browser playground route has its own capability checklist entry', () => {
  expect(BROWSER_TOOL_ROUTES.length).toBeGreaterThan(0)
  const missing = BROWSER_TOOL_ROUTES.map((r) => toolIdOf(r.path)).filter(
    (id) => !ALL_PLAYGROUND_TOOL_IDS.includes(id)
  )
  expect(missing, 'browser routes with no checklist entry').toEqual([])
})

for (const route of BROWSER_TOOL_ROUTES) {
  const spec = getPlaygroundCapabilityChecklist(toolIdOf(route.path))
  test(`${route.path}: the capability banner opens and lists this tool's own requirements`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop full-catalog capability banner sweep')
    await page.goto(route.path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel('How this tool runs').first()).toBeVisible()

    const banner = page.getByTestId('playground-capability-banner')
    await expect(banner).not.toHaveAttribute('open', '')
    await banner.locator('summary').click()
    await expect(banner).toHaveAttribute('open', '')
    const items = banner.locator('ul > li')
    await expect(items).toHaveCount(spec.productionToolRequirements.length)
    await expect(items).toHaveText(spec.productionToolRequirements)
    await expect(banner).toContainText(spec.whatCheckEstablishes)
    await expect(banner).toContainText(spec.sandboxLimitation)
  })
}

for (const path of PRIORITY_REMEDIATION_TOOLS) {
  test(`${path} opens on desktop and phone with no runtime errors or horizontal spillover`, async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    const banner = page.getByTestId('playground-capability-banner')
    await banner.locator('summary').click()
    await expect(banner).toHaveAttribute('open', '')

    await page.setViewportSize({ width: 390, height: 844 })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, `${path} mobile horizontal overflow`).toBeLessThanOrEqual(1)
    expect(runtimeErrors, `Runtime errors on ${path}`).toEqual([])
  })
}
