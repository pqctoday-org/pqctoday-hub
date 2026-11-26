// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { PHONE, WIDE, seedHub } from './fixtures/assistantDrawer'

/** Set E2E_SHOT_DIR to also save screenshots of the opened screens. */
const SHOTS = process.env.E2E_SHOT_DIR

/**
 * A lesson page keeps its sections, their ticks and its completion, and carries no floating step
 * bar, no progress box and no "Next step" card.
 */
const LESSON = '/learn/pqc-business-case'

for (const [name, viewport] of [
  ['wide screen', WIDE],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`Lesson page on a ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })

    test.beforeEach(async ({ page }) => {
      await seedHub(page, { persona: 'developer' })
    })

    test('has no step bar, progress box or Next step card, and ticking every section completes the lesson', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await page.goto(LESSON)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: /^Jump to section/ })).toHaveCount(0)
      await expect(page.getByText('Your Progress', { exact: true })).toHaveCount(0)
      await expect(page.getByText(/\d+\/\d+ sections read/)).toHaveCount(0)
      await expect(page.getByRole('region', { name: 'Next step' })).toHaveCount(0)
      await expect(page.getByText('Next step', { exact: true })).toHaveCount(0)

      const ticks = page.getByRole('checkbox', { name: /^Mark section as read/ })
      await expect(ticks.first()).toBeAttached({ timeout: 30_000 })
      const count = await ticks.count()
      expect(count).toBeGreaterThanOrEqual(2)
      for (let i = 0; i < count; i++) {
        const tick = ticks.nth(i)
        await tick.scrollIntoViewIfNeeded()
        if (!(await tick.isChecked())) {
          const box = (await tick.boundingBox())!
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        }
        await expect(tick).toBeChecked()
      }
      await expect(page.getByText('Reading Complete!')).toBeVisible()
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/after-lesson-ticked-${viewport.width}.png` })
    })

    test('a deep link still lands on its section', async ({ page }) => {
      await page.goto(`${LESSON}?section=board`)
      const section = page.locator('[data-section-id="board"]')
      await expect(section).toBeInViewport({ timeout: 30_000 })
    })
  })
}

test.describe('Lesson page top bar on a wide screen', () => {
  test.use({ viewport: WIDE, serviceWorkers: 'block' })

  test('the review mark reads "Reviewed · Mon YYYY" and keeps the full statement for assistive technology', async ({
    page,
  }) => {
    await seedHub(page, { persona: 'developer' })
    await page.goto(LESSON)
    const badge = page.getByRole('button', { name: /^Reviewed · \w{3} \d{4}\. / })
    await expect(badge).toBeVisible({ timeout: 30_000 })
    await expect(badge).toHaveText(/^Reviewed · \w{3} \d{4}$/)
    await expect(badge).toHaveAccessibleName(/reviewed/i)
    await badge.click()
    await expect(
      page.getByText(/Drafted with an AI model|Not drafted with an AI model/).first()
    ).toBeVisible()
  })
})
