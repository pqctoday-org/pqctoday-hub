// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { INFOGRAPHIC_IMAGE_REVISIONS } from '../src/data/infographicImageRevisions'

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

for (const width of [1280, 390]) {
  test.describe(`reviewed infographics at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } })
    for (const [id, revision] of Object.entries(INFOGRAPHIC_IMAGE_REVISIONS)) {
      test(`${id}: versioned image, assumptions, zoom and keyboard return`, async ({ page }) => {
        await page.goto(`/learn/${id}?tab=visual`)
        if (width < 600) {
          const reference = page.locator('details').filter({
            has: page.getByText('Visual reference and worked assumptions', { exact: true }),
          })
          await expect(reference).toBeAttached()
          if ((await reference.getAttribute('open')) === null)
            await reference.locator('summary').click()
        } else if (id === 'tls-basics') {
          await page
            .getByText('Visual reference: TLS handshake sizes and path budget', { exact: true })
            .click()
        }
        await page
          .getByRole('heading', { name: 'In Simple Terms', exact: true })
          .scrollIntoViewIfNeeded()
        const open = page.getByRole('button', { name: 'View infographic full size', exact: true })
        await expect(open).toBeVisible({ timeout: 25000 })
        const image = open.getByRole('img')
        await expect(image).toHaveAttribute(
          'src',
          new RegExp(`pqcstd_${id}\\.png\\?v=${revision}$`)
        )
        expect((await image.getAttribute('alt'))?.length).toBeGreaterThan(30)
        await image.scrollIntoViewIfNeeded()
        await expect
          .poll(() =>
            image.evaluate(
              (element: HTMLImageElement) => element.complete && element.naturalWidth > 0
            )
          )
          .toBe(true)
        await expect(
          page.locator('[data-testid="infographic-sample-assumptions"]:visible')
        ).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
        await open.focus()
        await open.press('Enter')
        const dialog = page.getByRole('dialog', { name: 'Infographic full view' })
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('img')).toHaveAttribute(
          'src',
          (await image.getAttribute('src')) ?? ''
        )
        await dialog
          .getByRole('button', { name: 'Close infographic', exact: true })
          .last()
          .press('Escape')
        await expect(dialog).toHaveCount(0)
        await expect(open).toBeFocused()
        await page.screenshot({
          path: `test-results/reviewed-infographics/${id}-${width}.png`,
          fullPage: true,
        })
      })
    }
  })
}
