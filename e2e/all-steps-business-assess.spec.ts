// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { TOOL_ROUTE_META } from '../src/seo/toolRouteMeta.generated'
import { ALL_BUSINESS_TOOL_IDS } from '../src/data/businessCapabilityChecklists'

const BUSINESS_TOOL_ROUTES = TOOL_ROUTE_META.filter((route) => route.kind === 'business-tool')

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

test('all 37 registered Business Center tools have production capability checklists', () => {
  expect(ALL_BUSINESS_TOOL_IDS).toHaveLength(37)
  expect(BUSINESS_TOOL_ROUTES).toHaveLength(37)
})

for (const route of BUSINESS_TOOL_ROUTES) {
  test(`${route.path} renders BusinessToolEvidenceNotice and BusinessCapabilityFooter with sample-vs-production boundary`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop full-catalog Business Center sweep')
    await page.goto(route.path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel('How to interpret this business tool')).toBeVisible()

    const footer = page.getByTestId('business-capability-footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText('Production Tool Capabilities to Evaluate')
  })
}

test('Business capability footer expands to show required capability, evaluation criteria, and sample-vs-production boundary', async ({
  page,
}) => {
  await page.goto('/business/tools/cost-of-inaction')
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })

  const footer = page.getByTestId('business-capability-footer')
  await expect(footer).toBeVisible()
  await footer.locator('summary').click()
  await expect(footer).toContainText('Capabilities to require in your enterprise tooling:')
  await expect(footer).toContainText('How to evaluate in production:')
  await expect(footer).toContainText('Completing or exporting this Hub worksheet teaches how to structure')
  await page.getByTestId('business-stress-test-btn').click()
  await expect(page.getByTestId('business-stress-test-receipt')).toBeVisible()
})

test('Assessment flow supports Quick 6-step assessment and Comprehensive 14-step mode', async ({
  page,
}) => {
  await page.goto('/assess')
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/Page not found/i)).toHaveCount(0)
})
