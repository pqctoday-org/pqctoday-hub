// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, devices, type Page } from '@playwright/test'

// A 390 x 844 phone, emulated the way a phone behaves: a mobile browser widens its layout viewport
// to fit overflowing content, so a leak shows up as window.innerWidth / scrollWidth above 390
// (a plain 390 px desktop window would hide it). The Validation coverage view has no distilled
// phone screen: on a phone ?section=coverage shows the full view, whose wide tables scroll inside
// their own boxes. Nothing in it may widen the page itself.
const PHONE = { width: 390, height: 844 }
// Run the phone emulation in whichever browser the project uses (the preset names WebKit).
const phone: Record<string, unknown> = { ...devices['iPhone 13'] }
delete phone.defaultBrowserType

test.use({ ...phone, reducedMotion: 'reduce' })
test.setTimeout(120_000)

async function suppressFirstVisitToasts(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
}

const pageWidths = (page: Page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    innerWidth: window.innerWidth,
  }))

test.describe('Validation coverage on a 390 px phone', () => {
  test.beforeEach(async ({ page }) => {
    await suppressFirstVisitToasts(page)
  })

  test('/algorithms?tab=validation&section=coverage does not make the page wider than the screen', async ({
    page,
  }) => {
    await page.goto('/algorithms?tab=validation&section=coverage')
    await expect(page.getByText('Capability coverage matrix')).toBeVisible({ timeout: 30_000 })
    const widths = await pageWidths(page)
    expect(widths.scrollWidth, JSON.stringify(widths)).toBeLessThanOrEqual(PHONE.width)
    expect(widths.innerWidth, JSON.stringify(widths)).toBeLessThanOrEqual(PHONE.width)
  })

  test('the scrolling table boxes are positioned, so screen-reader-only text inside them is clipped with them', async ({
    page,
  }) => {
    // The page width above also depends on ancestors that clip overflow; this pins the cause of the
    // earlier spill: a scrolling box that is not positioned does not clip absolutely positioned
    // descendants such as the "Details" header text.
    await page.goto('/algorithms?tab=validation&section=coverage')
    await expect(page.getByText('Capability coverage matrix')).toBeVisible({ timeout: 30_000 })
    const positions = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          '[role="region"][aria-label$="scroll horizontally for all columns"]'
        )
      ).map((box) => getComputedStyle(box).position)
    )
    expect(positions.length).toBeGreaterThan(1)
    for (const position of positions) expect(position).not.toBe('static')
  })

  test('the phone Validation note links to that view, which also fits the screen', async ({
    page,
  }) => {
    await page.goto('/algorithms?tab=validation')
    const link = page.getByRole('link', { name: 'Open coverage and open gaps' })
    await expect(link).toBeVisible({ timeout: 30_000 })
    await expect(link).toHaveAttribute('href', '/algorithms?tab=validation&section=coverage')
    await link.click()
    await expect(page).toHaveURL(/section=coverage/)
    await expect(page.getByText('Capability coverage matrix')).toBeVisible({ timeout: 30_000 })
    const widths = await pageWidths(page)
    expect(widths.scrollWidth, JSON.stringify(widths)).toBeLessThanOrEqual(PHONE.width)
  })
})
