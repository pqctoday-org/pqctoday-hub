// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { PHONE, WIDE, drawerOf, isPhone, openDrawer, seedHub } from './fixtures/assistantDrawer'

/** Set E2E_SHOT_DIR to also save screenshots of the opened screens. */
const SHOTS = process.env.E2E_SHOT_DIR

/**
 * "How do I set objectives in the new Assistant?" The drawer header has one plain link that opens
 * Your journey on the new-objective form with its text box ready to type in.
 */
for (const [name, viewport] of [
  ['wide screen', WIDE],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`Starting an objective from the Assistant, on a ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })

    test.beforeEach(async ({ page }) => {
      await seedHub(page)
    })

    test('"Start an objective" in the drawer header opens the form with the text box focused', async ({
      page,
    }) => {
      await page.goto('/playground')
      const drawer = await openDrawer(page)
      await expect(drawer.getByText('No objective yet')).toBeVisible()
      const link = drawer.getByRole('link', { name: 'Start an objective' })
      // A real pointer click; Playwright waits for the drawer to stop sliding in and for nothing to cover it.
      await link.click()

      await expect(page).toHaveURL(/\/learn\?mode=journey&new=1/)
      await expect(page.getByTestId('new-objective')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByLabel('What do you want to be able to do?')).toBeFocused()
      if (isPhone(page)) await expect(drawerOf(page)).toHaveCount(0)
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/after-start-objective-${viewport.width}.png` })
    })

    test('the address opens the form on first load', async ({ page }) => {
      await page.goto('/learn?mode=journey&new=1')
      await expect(page.getByLabel('What do you want to be able to do?')).toBeFocused({
        timeout: 30_000,
      })
    })
  })
}
