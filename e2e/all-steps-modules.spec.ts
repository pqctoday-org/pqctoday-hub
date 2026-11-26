// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, type Page } from './fixtures/blockAnalytics'
import {
  ALL_MODULE_IDS,
  getModuleCapabilityChecklist,
} from '../src/data/moduleCapabilityChecklists'

// Requests the browser cancels on navigation or tab switches (a lazy chunk, an
// image, a prefetch) log a console error that says nothing about the page.
// Every other console error and every uncaught page error still fails a test.
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

// The quiz page is not a module page: it hides the module sidebar, which holds
// the checklist (PKILearningView: showSidebar is false for 'quiz'), and has no
// module tabs.
const MODULES_WITHOUT_SIDEBAR = new Set(['quiz'])

// The checklist registry matching the module manifests is a unit test
// (moduleCapabilityChecklists.test.ts); here each registered module is opened.
test('the module checklist registry lists each module once', () => {
  expect(ALL_MODULE_IDS.length).toBeGreaterThan(0)
  expect(new Set(ALL_MODULE_IDS).size).toBe(ALL_MODULE_IDS.length)
})

for (const moduleId of ALL_MODULE_IDS) {
  test(`module ${moduleId}: the checklist opens with its own capabilities and every tab opens without runtime errors`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop step-by-step tab traversal uses desktop viewport >= 1024px')
    await page.setViewportSize({ width: 1440, height: 900 })
    const runtimeErrors = collectRuntimeErrors(page)
    const spec = getModuleCapabilityChecklist(moduleId)
    expect(spec, `checklist entry for ${moduleId}`).toBeDefined()

    await page.goto(`/learn/${moduleId}`)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 })

    // The checklist belongs to this module and opens to show its entries.
    const checklist = page.getByTestId('production-capability-checklist')
    if (MODULES_WITHOUT_SIDEBAR.has(moduleId)) {
      await expect(checklist).toHaveCount(0)
    } else {
      await expect(checklist).toHaveAttribute('data-module-id', moduleId)
      await expect(checklist).not.toHaveAttribute('open', '')
      // The checklist's own summary: it also holds the evidence worksheet, a nested
      // <details> with a summary of its own.
      await checklist.locator(':scope > summary').click()
      await expect(checklist).toHaveAttribute('open', '')
      const items = checklist.locator('ul > li')
      await expect(items).toHaveCount(spec!.productionCapabilities.length)
      await expect(items).toHaveText(spec!.productionCapabilities)
    }

    expect(runtimeErrors, `Runtime errors opening /learn/${moduleId}`).toEqual([])
    if (MODULES_WITHOUT_SIDEBAR.has(moduleId)) return

    const tablist = page.getByRole('tablist', { name: 'Module sections' })
    await expect(tablist).toBeVisible()

    // Selecting a tab must select it and show its panel.
    for (const name of [/Visual/i, /^Workshop$/i, /References/i]) {
      const tab = tablist.getByRole('tab', { name }).first()
      if ((await tab.count()) === 0) continue
      await tab.click()
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      const panelId = await tab.getAttribute('aria-controls')
      if (panelId) await expect(page.locator(`[id="${panelId}"]`)).toBeVisible()

      if (/Workshop/i.test(String(name))) {
        // In the shared workshop stepper, each step button opens its step: it
        // becomes the current step (aria-current="step").
        const stepButtons = page
          .getByLabel('Workshop steps')
          .getByRole('button', { name: /^Step \d+/ })
        const stepCount = Math.min(await stepButtons.count(), 5)
        for (let i = 0; i < stepCount; i++) {
          const step = stepButtons.nth(i)
          await step.click()
          await expect(step, `${moduleId} workshop step ${i + 1} is current`).toHaveAttribute(
            'aria-current',
            'step'
          )
        }
      }
    }

    expect(runtimeErrors, `Runtime errors on /learn/${moduleId}`).toEqual([])
  })
}

test('pki-enrollment-protocols: each sidebar section link scrolls to its section', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop anchor verification')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/learn/pki-enrollment-protocols')
  for (const anchor of ['enrollment-overview', 'est-protocol', 'cmp-protocol', 'pqc-enrollment']) {
    const section = page.locator(`#${anchor}`)
    await expect(section).toBeAttached({ timeout: 20_000 })
    await page.goto(`/learn/pki-enrollment-protocols#${anchor}`)
    await expect(section).toBeInViewport({ timeout: 10_000 })
  }
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

  // Each section carries its own "Mark section as read" control; the mark is the progress.
  const markRead = () => page.getByRole('checkbox', { name: /^Mark section as read:/ }).first()
  await expect(markRead(), 'a section "mark as read" control on the phone layout').toBeVisible()
  await markRead().check()
  await expect(markRead()).toBeChecked()
  await page.reload()
  await expect(markRead()).toBeChecked({ timeout: 20_000 })
})
