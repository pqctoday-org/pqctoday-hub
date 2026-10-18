// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'
import { TOOL_ROUTE_META } from '../src/seo/toolRouteMeta.generated'

const BUSINESS_TOOL_ROUTES = TOOL_ROUTE_META.filter((route) => route.kind === 'business-tool')

const ROLE_JOURNEYS = [
  ['executive', 'Fund and sponsor the program', 'Charter'],
  ['grc', 'Scope, record, and verify', 'Checklist'],
  ['developer', 'From call sites to a verified change', 'Refactor audit'],
  ['architect', 'Turn scope into a reviewable architecture', 'Scope'],
  ['researcher', 'Test the threat model', 'CRQC scenarios'],
  ['cert-engineer', 'Build an evidence trail without claiming certification', 'Requirements'],
  ['ops', 'Turn the migration plan into an operable change', 'Scope'],
  ['curious', 'Explore one decision at a time', 'Scope'],
] as const

function personaState(persona: string) {
  return JSON.stringify({
    state: { selectedPersona: persona, hasAcknowledgedExecutiveGrcSplit: true },
    version: 11,
  })
}

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
  })
})

test('Business Tools landing explains its role and passes serious accessibility checks', async ({
  page,
}) => {
  await page.goto('/business/tools')
  await expect(page.getByRole('heading', { name: 'Business Tools' })).toBeAttached({
    timeout: 15_000,
  })
  await injectAxe(page)
  await checkA11y(page, 'main', {
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
    includedImpacts: ['critical', 'serious'],
  })
})

for (const [persona, heading, firstStep] of ROLE_JOURNEYS) {
  test(`${persona} sees an intentional Business Tools starting sequence`, async ({ page }) => {
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
      'pqc-learning-persona',
      personaState(persona),
    ] as const)
    await page.goto('/business/tools')
    await expect(page.getByText(heading, { exact: false })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: new RegExp(firstStep, 'i') }).first()).toBeVisible()
  })
}

for (const route of BUSINESS_TOOL_ROUTES) {
  test(`${route.path} loads, states its decision boundary, and fits the viewport`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(route.path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel('How to interpret this business tool')).toBeVisible()
    await expect(page.getByText('Business tool not found')).toHaveCount(0)
    await expect(page.getByText('Page not found')).toHaveCount(0)

    if (isMobile) {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, `${route.path} widens the phone viewport`).toBeLessThanOrEqual(1)
    }
  })
}

test('all 37 registered Business Tools are covered by the route gate', () => {
  expect(BUSINESS_TOOL_ROUTES).toHaveLength(37)
})

test('executive Cost of Inaction flow explains assumptions and never invents a penalty', async ({
  page,
}) => {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    'pqc-learning-persona',
    personaState('executive'),
  ] as const)
  await page.goto('/business/tools/cost-of-inaction')
  await expect(page.getByRole('region', { name: 'Executive decision brief' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Scenario assumptions' })).toBeVisible()
  await expect(page.getByText('$0 by default', { exact: false })).toBeVisible()
  await expect(page.getByText('CRQC scenario range')).toBeVisible()
  await expect(page.getByText('one edition behind', { exact: false }).first()).toBeVisible()

  const delayControl = page.getByLabel(/Migration delay:/)
  const initialDelay = Number(await delayControl.inputValue())
  await delayControl.focus()
  await delayControl.press('ArrowRight')
  await expect(delayControl).toHaveValue(String(initialDelay + 1))

  await page.getByText('Optional organization-verified consequence').click()
  await page.getByLabel('Verified annual consequence').fill('1000000')
  await page.getByLabel('Verified consequence source or owner').fill('Legal memo 2026-10-01')
  await expect(page.getByText('Legal memo 2026-10-01', { exact: false })).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow, 'Cost of Inaction widens the viewport').toBeLessThanOrEqual(1)

  await injectAxe(page)
  await checkA11y(page, 'main', {
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
    includedImpacts: ['critical', 'serious'],
  })
})

test('Business Case Step 4 deep link and Step 5 handoff remain navigable', async ({ page }) => {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    'pqc-learning-persona',
    personaState('executive'),
  ] as const)
  await page.goto('/learn/pqc-business-case?tab=workshop&step=3')
  await expect(page.getByRole('heading', { name: 'Step 4: Cost of Inaction' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Executive decision brief' })).toBeVisible()
  await page.getByRole('button', { name: /Step 5: Board Pitch Builder/ }).click()
  await expect(page.getByRole('heading', { name: 'Step 5: Board Pitch Builder' })).toBeVisible()
  await expect(
    page.getByRole('status').filter({ hasText: /Pre-filled.*Step 4.*Incremental NPV/i })
  ).toBeVisible()
})

test('executive quantum-impact scope preserves unknowns instead of inventing a rating', async ({
  page,
}) => {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    'pqc-learning-persona',
    personaState('executive'),
  ] as const)
  await page.goto('/learn/exec-quantum-impact?tab=workshop&step=3')

  await expect(
    page.getByRole('heading', { name: 'Step 4: Organisational Evidence Scope' })
  ).toBeVisible()
  await expect(page.getByText('Unanswered never means low exposure.')).toBeVisible()
  await expect(page.getByText('Low Exposure', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'unknown' })).toHaveCount(9)

  await page.getByRole('button', { name: 'unknown' }).first().click()
  await expect(page.getByText('Questions requiring evidence:', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Build the executive measurement pack' })
  ).toHaveAttribute('href', '/business/tools/kpi-dashboard')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow, 'Executive Quantum Impact widens the viewport').toBeLessThanOrEqual(1)
})

test('executive KPI dashboard separates catalog context and withholds an unsupported overall score', async ({
  page,
}) => {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    'pqc-learning-persona',
    personaState('executive'),
  ] as const)
  await page.goto('/business/tools/kpi-dashboard')

  await expect(page.getByText('Catalog comparison — not part of your score:')).toBeVisible()
  await expect(page.getByText('Not yet available')).toBeVisible()
  await expect(page.getByText(/Evidence coverage:/)).toBeVisible()
  await expect(page.getByText('Regulatory Exposure Index')).toHaveCount(0)
  await expect(page.getByText('Board-Ready NIST CSF Composite')).toHaveCount(0)

  const compliance = page.getByTestId('kpi-dim-compliance-gaps')
  await expect(compliance).toHaveAttribute('data-pending', 'true')
  const complianceSlider = page.getByLabel('Compliance Gaps Closed score')
  await complianceSlider.focus()
  await complianceSlider.press('ArrowRight')
  await expect(compliance).not.toHaveAttribute('data-pending', 'true')

  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/dated snapshot stored locally/i)).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow, 'Executive KPI Dashboard widens the viewport').toBeLessThanOrEqual(1)

  await injectAxe(page)
  await checkA11y(page, 'main', {
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
    includedImpacts: ['critical', 'serious'],
  })
})
