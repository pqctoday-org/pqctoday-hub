// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { ALL_MODULE_IDS } from '../src/data/moduleCapabilityChecklists'

const TARGET_REMEDIATION_MODULES = [
  'vpn-ssh-pqc',
  'secrets-management-pqc',
  'web-gateway-pqc',
  'tls-basics',
  'stateful-signatures',
  'pki-enrollment-protocols',
  'pki-workshop',
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

test('all 76 registered learning modules are present in the module capability checklist registry', () => {
  expect(ALL_MODULE_IDS).toHaveLength(76)
})

for (const moduleId of ALL_MODULE_IDS) {
  test(`module ${moduleId} renders Learn, Visual, Workshop steps, References, and ProductionCapabilityChecklist with zero console/page errors`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop step-by-step tab traversal uses desktop viewport >= 1024px')
    await page.setViewportSize({ width: 1440, height: 900 })

    const runtimeErrors: string[] = []
    page.on('pageerror', (err) => runtimeErrors.push(`pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        runtimeErrors.push(`console.error: ${msg.text()}`)
      }
    })

    await page.goto(`/learn/${moduleId}`)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })

    const checklist = page.getByTestId('production-capability-checklist')
    await expect(checklist).toBeAttached()
    await expect(checklist).toHaveAttribute('data-module-id', moduleId)
    await checklist.locator('summary').click()
    await expect(page.getByTestId('module-adversarial-lab')).toBeVisible()
    await page.getByTestId('module-verify-adversarial-btn').click()
    await expect(page.getByTestId('module-verify-receipt')).toContainText(
      'REFUSED / TAMPER DETECTED'
    )

    const tablist = page.getByRole('tablist', { name: 'Module sections' })
    await expect(tablist).toBeVisible()

    // Traverse Visual tab if present
    const visualTab = tablist.getByRole('tab', { name: /Visual/i })
    if ((await visualTab.count()) > 0) {
      await visualTab.first().click()
      await expect(visualTab.first()).toHaveAttribute('aria-selected', 'true')
    }

    // Traverse Workshop tab and step buttons if present
    const workshopTab = tablist.getByRole('tab', { name: /^Workshop$/i })
    if ((await workshopTab.count()) > 0) {
      await workshopTab.first().click()
      await expect(workshopTab.first()).toHaveAttribute('aria-selected', 'true')
      const stepButtons = page.getByRole('button', { name: /^Step \d+/i })
      const stepCount = await stepButtons.count()
      for (let i = 0; i < Math.min(stepCount, 5); i++) {
        await stepButtons.nth(i).click()
      }
    }

    // Traverse References tab if present
    const refsTab = tablist.getByRole('tab', { name: /References/i })
    if ((await refsTab.count()) > 0) {
      await refsTab.first().click()
      await expect(refsTab.first()).toHaveAttribute('aria-selected', 'true')
    }

    expect(runtimeErrors, `Runtime errors on /learn/${moduleId}`).toEqual([])
  })
}

test('pki-enrollment-protocols exposes all 4 sidebar section anchors and RFC 9810 / RFC 9483 / RFC 8894 / RFC 8555 / RFC 10073 alignment', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop anchor verification')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/learn/pki-enrollment-protocols')
  await expect(page.locator('#enrollment-overview')).toBeAttached({ timeout: 20_000 })
  await expect(page.locator('#est-protocol')).toBeAttached()
  await expect(page.locator('#cmp-protocol')).toBeAttached()
  await expect(page.locator('#pqc-enrollment')).toBeAttached()
  await expect(page.getByText(/RFC 9810/i).first()).toBeVisible()
  await expect(page.getByText(/RFC 9483/i).first()).toBeVisible()
  await expect(page.getByText(/RFC 8894/i).first()).toBeVisible()
  await expect(page.getByText(/RFC 8555/i).first()).toBeVisible()
  await expect(page.getByText(/RFC 10073/i).first()).toBeVisible()
})

test('learning module progress persists across page reload and fits mobile 390x844 without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/learn/pki-enrollment-protocols')
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 })

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow, '/learn/pki-enrollment-protocols mobile overflow').toBeLessThanOrEqual(1)

  const sectionToggle = page.locator('ul > li > button[aria-pressed]').first()
  if ((await sectionToggle.count()) > 0) {
    await sectionToggle.click()
    await expect(sectionToggle).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(page.locator('ul > li > button[aria-pressed]').first()).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 20_000 }
    )
  }
})
