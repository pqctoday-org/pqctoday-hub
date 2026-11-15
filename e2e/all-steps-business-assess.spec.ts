// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { TOOL_ROUTE_META } from '../src/seo/toolRouteMeta.generated'
import {
  ALL_BUSINESS_TOOL_IDS,
  getBusinessCapabilityChecklist,
} from '../src/data/businessCapabilityChecklists'

const BUSINESS_TOOL_ROUTES = TOOL_ROUTE_META.filter((route) => route.kind === 'business-tool')
const toolIdOf = (path: string) => path.split('/').pop() ?? path

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
        state: { selectedPersona: 'executive', hasAcknowledgedExecutiveGrcSplit: true },
        version: 11,
      })
    )
  })
})

test('the Business Center routes and the capability checklist list the same tools', () => {
  expect(BUSINESS_TOOL_ROUTES.length).toBeGreaterThan(0)
  const routeIds = BUSINESS_TOOL_ROUTES.map((r) => toolIdOf(r.path)).sort()
  expect([...ALL_BUSINESS_TOOL_IDS].sort()).toEqual(routeIds)
})

for (const route of BUSINESS_TOOL_ROUTES) {
  const spec = getBusinessCapabilityChecklist(toolIdOf(route.path))
  test(`${route.path}: the capability footer opens and lists this tool's own capabilities`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop full-catalog Business Center sweep')
    expect(spec, `checklist entry for ${route.path}`).toBeDefined()
    await page.goto(route.path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel('How to interpret this business tool')).toBeVisible()

    const footer = page.getByTestId('business-capability-footer')
    await expect(footer).not.toHaveAttribute('open', '')
    await footer.locator('summary').click()
    await expect(footer).toHaveAttribute('open', '')
    const items = footer.locator('ul > li')
    await expect(items).toHaveCount(spec!.requiredCapabilities.length)
    await expect(items).toHaveText(spec!.requiredCapabilities)
    await expect(footer).toContainText(spec!.evaluationCriteria)
    await expect(footer).toContainText(spec!.sampleVsProductionBoundary)
  })
}

for (const mode of ['quick', 'comprehensive'] as const) {
  test(`the ${mode} assessment answers its first question and moves to the next one`, async ({
    page,
  }) => {
    await page.goto(`/assess?mode=${mode}`)
    const firstQuestion = page.getByRole('heading', { name: /what industry are you in/i })
    await expect(firstQuestion).toBeVisible({ timeout: 20_000 })
    await page.getByRole('radio', { name: /Finance & Banking/i }).click()
    await page.getByRole('button', { name: /^Continue/ }).click()
    await expect(firstQuestion).toBeHidden()
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
  })
}
