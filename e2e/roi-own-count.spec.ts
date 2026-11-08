// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Page } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'

/**
 * ROI calculator: the learner enters their own count of systems or products.
 *
 * The count opens as a labelled example of 50, is typed by the learner, never limited or set by
 * the Hub catalogue, and survives a reload once the model has been saved.
 */

const ROUTE = '/business/tools/roi-calculator'
const COUNT_LABEL = /Systems or products in your scenario/

async function seedClean(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })
}

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

async function checkOwnCount(page: Page) {
  await page.goto(ROUTE)
  const field = page.getByLabel(COUNT_LABEL)
  await expect(field).toBeVisible({ timeout: 20_000 })

  // Opens as an editable example of 50.
  await expect(field).toHaveValue('50')
  await expect(page.getByText('Example: change to your own count')).toBeVisible()
  await expect(field).toHaveAttribute('inputmode', 'numeric')

  // Typing the learner's own count: capex follows it, the example tag goes.
  await field.fill('120')
  await expect(page.getByText('Example: change to your own count')).toBeHidden()
  await expect(page.getByText(/Capex: 120 systems or products \(entered by you\)/)).toBeVisible()
  await expect(page.getByText(/× \$75K = \$9\.0M/)).toBeVisible()

  // A bad entry is explained and the figures keep the last valid count.
  await field.fill('abc')
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#roi-products-message')).toContainText(
    'The figures on this page still use 120.'
  )
  await field.fill('120')
  await expect(field).not.toHaveAttribute('aria-invalid', 'true')

  // Typing a number with a comma passes through "1," and "1,2": no error is announced on the way.
  await field.fill('')
  await field.pressSequentially('1,')
  await expect(field).not.toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#roi-products-message')).toBeEmpty()
  await field.pressSequentially('200')
  await expect(field).not.toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText(/Capex: 1,200 systems or products/)).toBeVisible()
  await field.fill('120')

  // The markdown download carries the count, its unit and its source.
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '.md', exact: true }).click()
  const file = await download
  const stream = await file.createReadStream()
  let text = ''
  for await (const chunk of stream) text += chunk.toString()
  expect(text).toContain('Systems or products in scenario (your count): 120 (entered by you)')
  expect(text).toContain('not taken from the Hub catalogue')
  expect(text).not.toContain('Catalogue products in selected scenario')

  // Saved, then restored after a reload.
  await expect(page.getByText(/^Saved/).first()).toBeVisible({ timeout: 10_000 })
  await page.reload()
  await expect(page.getByLabel(COUNT_LABEL)).toHaveValue('120')
  await expect(page.getByText('Example: change to your own count')).toBeHidden()

  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedClean(page)
})

test('desktop: the learner enters, saves and restores their own count', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await checkOwnCount(page)
  await injectAxe(page)
  await checkA11y(page, 'main', {
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
    includedImpacts: ['critical', 'serious'],
  })
})

test('phone 375 px: a full-width numeric field, the unit under it and no sideways scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(ROUTE)
  const field = page.getByLabel(COUNT_LABEL)
  await expect(field).toBeVisible({ timeout: 20_000 })
  const box = await field.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(box!.x + box!.width).toBeLessThanOrEqual(375)
  // The unit text sits under the field, not beside it.
  const help = page.locator('#roi-products-help')
  const helpBox = await help.boundingBox()
  expect(helpBox!.y).toBeGreaterThanOrEqual(box!.y + box!.height)
  await expect(help).toContainText('This is not the Hub catalogue')
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  await checkOwnCount(page)
})
