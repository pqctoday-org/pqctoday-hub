// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
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

test('Timeline teaches evidence boundaries instead of claiming personal applicability', async ({
  page,
}) => {
  await page.goto('/timeline?country=United%20States')

  await expect(page.getByRole('heading', { name: 'Global Migration Timeline' })).toBeVisible()
  await expect(
    page.locator('p:visible', { hasText: /published post-quantum migration milestones/i }).first()
  ).toBeVisible()
  await expect(
    page
      .locator(':visible', {
        hasText: /country selection (?:alone )?does not establish/i,
      })
      .last()
  ).toBeVisible()
  await expect(page.getByText(/next date that applies to you/i)).toHaveCount(0)
  await expect(page.getByText(/Next 12 months/i)).toHaveCount(0)
})

test('Community is framed as a directory and the stack contains no nested buttons', async ({
  page,
}) => {
  await page.goto('/leaders')

  await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible()
  await expect(
    page
      .locator('p:visible', { hasText: /Inclusion is not an endorsement or (?:a )?ranking/i })
      .first()
  ).toBeVisible()
  await expect(page.locator('button button')).toHaveCount(0)

  const stack = page.getByRole('button', { name: /Stack/i }).first()
  if (await stack.isVisible().catch(() => false)) await stack.click()
  await expect(page.locator('button button')).toHaveCount(0)
})

test('Navigate explains its encoding and exposes the keyboard list', async ({ page }) => {
  await page.goto('/navigate')

  await expect(page.getByText('Building the graph from live hub data...')).toBeHidden({
    timeout: 30_000,
  })
  await expect(page.getByRole('heading', { name: 'Explore how the hub connects' })).toBeVisible()
  await expect(page.getByText(/not more important, trustworthy, or mature/i)).toBeVisible()
  await page.getByRole('button', { name: 'Open accessible list' }).click()
  await expect(
    page.getByRole('list', { name: /visible nodes, ranked by connection count/i })
  ).toBeVisible()
})

test('phone layouts keep Navigate controls and details within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/navigate')

  await expect(page.getByText('Building the graph from live hub data...')).toBeHidden({
    timeout: 30_000,
  })
  await expect(page.getByTestId('navigate-guide')).toBeVisible()
  await page.getByRole('button', { name: 'Open accessible list' }).click()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
  await expect(
    page.getByRole('list', { name: /visible nodes, ranked by connection count/i })
  ).toBeVisible()
})

test('phone Timeline and Community preserve their evidence guidance without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/timeline')
  await expect(page.getByRole('heading', { name: /Global PQC timeline/i })).toBeVisible()
  await expect(page.getByText(/Next 12 months/i)).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
  ).toBeLessThanOrEqual(1)

  await page.goto('/leaders')
  await expect(
    page
      .locator('p:visible', { hasText: /Inclusion is not an endorsement or (?:a )?ranking/i })
      .first()
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
  ).toBeLessThanOrEqual(1)
})
