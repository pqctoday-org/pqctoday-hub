// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'

test('phone: save, preview and restore the crypto API refactor audit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
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
  await page.goto('/business/tools/crypto-api-refactor-audit')

  const plan = page.getByRole('textbox', { name: 'Refactor plan narrative' })
  await expect(plan).toBeVisible()
  await plan.fill(
    'Migrate the inventory after call-site ownership review; test approved fallbacks.'
  )
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await expect(page.getByText(/Recommended Refactor Phase/)).toBeVisible()
  await expect(
    page.getByText('Migrate the inventory after call-site ownership review')
  ).toBeVisible()

  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(
    violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
    `${JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })))}`
  ).toEqual([])

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Refactor plan narrative' })).toHaveValue(
    'Migrate the inventory after call-site ownership review; test approved fallbacks.'
  )
})
