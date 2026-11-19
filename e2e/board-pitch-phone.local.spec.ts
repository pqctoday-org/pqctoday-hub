// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'

test('phone: record, preview and restore the Board Pitch assumptions', async ({ page }) => {
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
  await page.goto('/business/tools/board-pitch')

  const basis = page.getByRole('textbox', { name: 'Sources and assumptions used' })
  await expect(basis).toBeVisible()
  await basis.fill('Synthetic estimate; Finance owner; reviewed 2026-11-18; ±30% range.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await expect(page.getByText(/Synthetic estimate; Finance owner/)).toBeVisible()
  await expect(
    page.getByText(/educational proposal template, not an approved budget/i)
  ).toBeVisible()
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(
    violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
    JSON.stringify(
      violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => ({ html: node.html, failure: node.failureSummary })),
      })),
      null,
      2
    )
  ).toEqual([])

  await page.reload()
  const restored = page.getByRole('textbox', { name: 'Sources and assumptions used' })
  await expect(restored).toHaveValue(
    'Synthetic estimate; Finance owner; reviewed 2026-11-18; ±30% range.'
  )
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(widths.content).toBeLessThanOrEqual(widths.viewport)
})
