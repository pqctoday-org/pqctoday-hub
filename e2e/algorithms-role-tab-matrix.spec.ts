// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, type Page } from '@playwright/test'
import { injectAxe, getViolations } from 'axe-playwright'

test.use({ reducedMotion: 'reduce' })
test.setTimeout(180_000)

const ROLES = [
  'executive',
  'ops',
  'grc',
  'developer',
  'architect',
  'researcher',
  'cert-engineer',
  'curious',
] as const

const TABS = ['transition', 'detailed', 'support', 'landscape', 'validation'] as const

async function seedRole(page: Page, role: (typeof ROLES)[number]) {
  await page.addInitScript(
    ({ selectedPersona, visitedTabs }) => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona,
            hasSeenPersonaPicker: true,
            hasAcknowledgedExecutiveGrcSplit: true,
            selectedRegion: 'global',
            viewAccess: 'unlocked',
            curiousGuideDismissed: true,
            algorithmsTabsVisited: visitedTabs,
          },
          version: 11,
        })
      )
    },
    { selectedPersona: role, visitedTabs: [...TABS] }
  )
}

for (const role of ROLES) {
  test(`${role}: all five Algorithms tabs render without serious accessibility or page-overflow defects`, async ({
    page,
  }) => {
    await seedRole(page, role)
    for (const tab of TABS) {
      await page.goto(`/algorithms?tab=${tab}&quickview=none`)
      await page.waitForLoadState('networkidle').catch(() => undefined)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }`,
      })
      const trigger = page.locator(`[data-workshop-target="tab-${tab}"]`)
      await expect(trigger).toHaveAttribute('data-state', 'active', { timeout: 20_000 })
      await expect(
        page.locator(
          `[data-workshop-target="section-algorithm-${tab === 'support' ? 'protocol-support' : tab === 'landscape' ? 'industry-landscape' : tab}"]`
        )
      ).toBeVisible({ timeout: 20_000 })
      await page.waitForTimeout(400)

      const overflow = await page.evaluate(
        () => document.body.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${role}/${tab} page-level horizontal overflow`).toBeLessThanOrEqual(1)

      await injectAxe(page)
      // The first pass scrolls lazy sections into their resting state. This is
      // the same settle pattern used by the route-wide accessibility suite.
      await getViolations(page, undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      const violations = await getViolations(page, undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      const serious = violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious'
      )
      expect(
        serious.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })),
        `${role}/${tab} serious accessibility violations`
      ).toEqual([])
    }
  })
}

test('phone Detailed Comparison supports a bounded three-pick comparison without page spillover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedRole(page, 'developer')
  await page.goto('/algorithms?tab=detailed&quickview=nist-picks')
  await expect(
    page.getByRole('button', { name: 'Compare side-by-side', exact: false }).first()
  ).toBeVisible({
    timeout: 20_000,
  })

  const first = page.getByRole('checkbox', { name: /Add to comparison/ }).first()
  await first.check()
  const second = page
    .getByRole('checkbox', { name: /Add to comparison/ })
    .filter({ visible: true })
    .first()
  await second.check()

  await page
    .getByRole('button', { name: /Compare side-by-side/ })
    .last()
    .click()
  await expect(page.getByText(/Swipe across up to three picks/)).toBeVisible()
  await expect(page.locator('article')).toHaveCount(2)

  const overflow = await page.evaluate(
    () => document.body.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

for (const width of [320, 390]) {
  test(`${width}px phone completes Industry and Validation deep links without spillover`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await seedRole(page, 'cert-engineer')

    await page.goto('/algorithms?tab=landscape')
    await expect(page.getByRole('heading', { name: 'Industry use cases' })).toBeVisible({
      timeout: 20_000,
    })
    await page.locator('button[data-industry]').first().click()
    await expect(page.getByRole('button', { name: /All industries/ })).toBeVisible()
    const coverageLayout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth
      return {
        overflow: document.body.scrollWidth - viewportWidth,
        offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              tag: element.tagName.toLowerCase(),
              className: element.className?.toString().slice(0, 160),
              label: element.getAttribute('aria-label'),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            }
          })
          .filter((item) => item.right > viewportWidth + 1 || item.left < -1)
          .sort((a, b) => b.right - a.right)
          .slice(0, 12),
      }
    })
    expect(
      coverageLayout.overflow,
      JSON.stringify(coverageLayout.offenders, null, 2)
    ).toBeLessThanOrEqual(1)

    await page.goto('/algorithms?tab=validation&section=attacks')
    await expect(
      page.getByText(
        /These records describe attacks demonstrated against particular implementations/
      )
    ).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Reviewed sources').first()).toBeVisible()
    const matrixLayout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth
      return {
        overflow: document.body.scrollWidth - viewportWidth,
        offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              tag: element.tagName.toLowerCase(),
              className: element.className?.toString().slice(0, 160),
              label: element.getAttribute('aria-label'),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            }
          })
          .filter((item) => item.right > viewportWidth + 1 || item.left < -1)
          .sort((a, b) => b.right - a.right)
          .slice(0, 12),
      }
    })
    expect(
      matrixLayout.overflow,
      JSON.stringify(matrixLayout.offenders, null, 2)
    ).toBeLessThanOrEqual(1)

    await page.goto('/algorithms?tab=validation&section=coverage')
    await expect(page.getByText('Capability coverage matrix')).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByRole('region', {
        name: 'Capability coverage matrix; scroll horizontally for all columns',
      })
    ).toBeVisible()
    const coverageMatrixLayout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth
      const region = document.querySelector<HTMLElement>(
        '[aria-label="Capability coverage matrix; scroll horizontally for all columns"]'
      )
      return {
        // A horizontally scrollable evidence table legitimately increases the
        // document element's intrinsic scrollWidth in Chromium. The body width
        // reflects whether that overflow escapes its named scroll region and
        // becomes page-level spillover.
        overflow: document.body.scrollWidth - viewportWidth,
        ancestors: region
          ? Array.from(
              (function* () {
                let current: HTMLElement | null = region
                while (current) {
                  yield current
                  current = current.parentElement
                }
              })()
            ).map((element) => {
              const rect = element.getBoundingClientRect()
              const style = getComputedStyle(element)
              return {
                tag: element.tagName.toLowerCase(),
                className: element.className?.toString().slice(0, 160),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                scrollWidth: element.scrollWidth,
                overflowX: style.overflowX,
                minWidth: style.minWidth,
                maxWidth: style.maxWidth,
              }
            })
          : [],
        offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              tag: element.tagName.toLowerCase(),
              className: element.className?.toString().slice(0, 160),
              label: element.getAttribute('aria-label'),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            }
          })
          .filter((item) => item.right > viewportWidth + 1 || item.left < -1)
          .sort((a, b) => b.right - a.right)
          .slice(0, 12),
      }
    })
    expect(
      coverageMatrixLayout.overflow,
      JSON.stringify(
        {
          offenders: coverageMatrixLayout.offenders,
          ancestors: coverageMatrixLayout.ancestors,
        },
        null,
        2
      )
    ).toBeLessThanOrEqual(1)

    await injectAxe(page)
    const violations = await getViolations(page, undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => ({ id: violation.id, nodes: violation.nodes.length }))
    ).toEqual([])
  })
}
