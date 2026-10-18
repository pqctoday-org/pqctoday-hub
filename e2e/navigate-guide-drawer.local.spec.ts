// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * /navigate — the "Explore how the hub connects" guide can be closed and stays
 * closed, Escape closes the detail drawer then the guide, and a connection
 * followed in the drawer is flown to and drawn even when the filters or the
 * node-count cap had left it out of the scene.
 *
 * Venue: `*.local.spec.ts` — excluded from CI (directive 2026-07-01: new
 * suites are local-only). Run with:
 *   E2E_SERVER=dev npx playwright test --project=local navigate-guide-drawer
 */

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

// Software-rendered WebGL for a few-thousand-node scene is slow; see
// navigate-motion-modes.local.spec.ts for the same allowance.
test.describe.configure({ timeout: 120_000 })

async function openGraph(page: Page) {
  await page.goto('/navigate')
  // The "Filters" pill only exists once the graph has finished building.
  await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeVisible({
    timeout: 60_000,
  })
}

async function selectFromList(page: Page, name: RegExp) {
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.getByRole('button', { name: /List view/ }).click()
  await page.locator('#navigate-node-list').getByRole('button', { name }).first().click()
}

test('the guide closes, stays closed across a reload, and can be reopened', async ({ page }) => {
  await openGraph(page)
  const guide = page.getByTestId('navigate-guide')
  await expect(guide).toBeVisible()

  await guide.getByRole('button', { name: 'Close guide' }).click()
  await expect(guide).toBeHidden()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeVisible({
    timeout: 60_000,
  })
  await expect(guide).toBeHidden()

  await page.getByRole('button', { name: 'About this graph' }).click()
  await expect(guide).toBeVisible()
})

test('starting the guided tour dismisses the guide', async ({ page }) => {
  await openGraph(page)
  const guide = page.getByTestId('navigate-guide')
  await guide.getByRole('button', { name: 'Start guided tour' }).click()
  await expect(guide).toBeHidden()
})

test('Escape closes the drawer first, then the guide, and the guide does not return', async ({
  page,
}) => {
  await openGraph(page)
  const guide = page.getByTestId('navigate-guide')
  const drawer = page.locator('div[role="complementary"]')

  await selectFromList(page, /FIPS 203/)
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  // Selecting a record already counts as having found the way around.
  await expect(guide).toBeHidden()

  await page.getByRole('button', { name: 'About this graph' }).click()
  await expect(guide).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(guide).toBeHidden()
})

test('a drawer connection the scene was not drawing is drawn and flown to', async ({ page }) => {
  await openGraph(page)
  await page
    .getByTestId('navigate-guide')
    .getByRole('button', { name: 'Open accessible list' })
    .click()

  const list = page.locator('#navigate-node-list')
  const drawn = new Set(
    (await list.getByRole('button').allInnerTexts()).map((t) =>
      t.replace(/^[^:\n]+:\s*/, '').trim()
    )
  )
  const drawnBefore = await list.getByRole('button').count()

  await list
    .getByRole('button', { name: /liboqs/ })
    .first()
    .click()
  // The site's own nav rail is an <aside> with the same implicit role.
  const drawer = page.locator('div[role="complementary"]')
  // Each click turns that group's "Show N more" into "Show less", so always take the first one left.
  const showMore = drawer.getByRole('button', { name: /Show \d+ more/ })
  while ((await showMore.count()) > 0) await showMore.first().click()
  const connections = (await drawer.locator('ul button').allInnerTexts()).map((t) => t.trim())
  const hidden = connections.find((name) => !drawn.has(name))
  expect(hidden, 'liboqs has at least one connection the default view does not draw').toBeTruthy()

  await drawer.locator('ul button', { hasText: hidden }).first().click()
  await expect(drawer.locator('h2')).toHaveText(hidden as string)

  // The node now exists in the scene — it has its label — and the camera is
  // framing it, so that label sits inside the viewport.
  const label = page.getByRole('button', { name: `Select ${hidden}`, exact: true })
  await expect(label).toHaveCount(1)
  await expect
    .poll(
      async () => {
        const box = await label.boundingBox()
        const viewport = page.viewportSize()
        if (!box || !viewport) return false
        return box.x >= 0 && box.y >= 0 && box.x < viewport.width && box.y < viewport.height
      },
      { timeout: 10_000 }
    )
    .toBe(true)

  // Only that one node was added; the cap itself is unchanged.
  await expect(page.getByText(new RegExp(`Nodes ${drawnBefore + 1} / `))).toBeVisible()
})
