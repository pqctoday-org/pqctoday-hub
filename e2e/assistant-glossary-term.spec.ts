// SPDX-License-Identifier: AGPL-3.0-only
import type { Locator, Page } from '@playwright/test'
import { test, expect } from './fixtures/blockAnalytics'
import {
  PHONE,
  WIDE,
  ask,
  answerOf,
  drawerOf,
  isPhone,
  openDrawer,
  returnControl,
  seedHub,
} from './fixtures/assistantDrawer'

/**
 * A glossary term in the Assistant: "Read here" opens the record, whose main action opens the lesson
 * that teaches it (the section the knowledge model names), and whose quiet action opens the term in the
 * Glossary panel. `?glossary=<term>` opens that panel on any page. Real pointer clicks throughout.
 */

/** Set E2E_SHOT_DIR to also save screenshots of the opened screens. */
const SHOTS = process.env.E2E_SHOT_DIR

const QUESTION = 'What is ML-KEM?'
const LESSON_HEADING = 'The PQC Algorithms: How They Work and How to Choose'

for (const [name, viewport] of [
  ['wide screen', WIDE],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`Glossary term from the Assistant, on a ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })

    test.beforeEach(async ({ page }) => {
      await seedHub(page)
    })

    const glossaryPanel = (p: Page) =>
      isPhone(p)
        ? p.getByRole('dialog', { name: 'Glossary', exact: true })
        : p.getByRole('region', { name: 'Glossary', exact: true })

    async function closeGlossary(p: Page, panel: Locator) {
      if (isPhone(p)) await panel.getByRole('button', { name: 'Close', exact: true }).click()
      else
        await p.getByRole('banner').getByRole('button', { name: 'Glossary', exact: true }).click()
    }

    async function readHere(page: Page) {
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, QUESTION)
      await answer.getByRole('button', { name: 'Read here: ML-KEM', exact: true }).click()
      return drawer
    }

    test('Open the lesson lands on the lesson that teaches the term, not the Learn index', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      const drawer = await readHere(page)
      await drawer.getByRole('button', { name: /^Open the lesson: / }).click()

      await expect(page).toHaveURL(/\/learn\/pqc-algorithms\?section=ml-kem-fips-203/)
      await expect(page.getByRole('heading', { level: 1, name: LESSON_HEADING })).toBeVisible({
        timeout: 30_000,
      })
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/after-glossary-lesson-${viewport.width}.png` })

      // The way back is reachable with a real pointer and shows the answer again.
      const back = returnControl(page)
      await expect(back).toBeVisible()
      await back.click()
      await expect(page).toHaveURL(/\/learn$/)
      if (!isPhone(page)) {
        await expect(answerOf(drawerOf(page), QUESTION)).toBeVisible()
      }
    })

    test('Open in the glossary shows the Glossary view of the drawer on the term, with the way back', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      const drawer = await readHere(page)
      await drawer.getByRole('button', { name: 'Open in the glossary' }).click()

      // The drawer itself switches to the Glossary; the page does not change.
      const panel = glossaryPanel(page)
      await expect(panel).toBeVisible({ timeout: 30_000 })
      await expect(page).toHaveURL(/\/learn$/)
      const entry = panel.getByRole('heading', { level: 3, name: 'ML-KEM', exact: true })
      await expect(entry).toBeVisible()
      await expect(panel.getByText(/Module-Lattice-Based Key Encapsulation/i).first()).toBeVisible()
      await expect(panel.getByRole('textbox', { name: 'Search glossary terms' })).toHaveValue(
        'ML-KEM'
      )
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/after-glossary-panel-${viewport.width}.png` })

      // Back to your answer returns to the Assistant with the answer and the record as they were.
      await panel.getByRole('button', { name: 'Back to your answer' }).click()
      const again = drawerOf(page)
      await expect(again).toBeVisible()
      await expect(again.getByRole('region', { name: 'ML-KEM' })).toBeVisible()
      // The record is open as it was: "Back to your answer" on a wide screen, "Close" on the phone card.
      const record = again.getByRole('region', { name: 'ML-KEM' })
      await expect(record).toBeVisible()
      await record
        .getByRole('button', { name: isPhone(page) ? 'Close' : 'Back to your answer', exact: true })
        .click()
      await expect(answerOf(again, QUESTION)).toBeVisible()
    })

    test('a direct visit opens the Glossary on the page, and closing leaves the page', async ({
      page,
    }) => {
      await page.goto('/library?glossary=ML-KEM')
      const panel = glossaryPanel(page)
      await expect(panel).toBeVisible({ timeout: 30_000 })
      await expect(
        panel.getByRole('heading', { level: 3, name: 'ML-KEM', exact: true })
      ).toBeVisible()
      await closeGlossary(page, panel)
      await expect(panel).toHaveCount(0)
      await expect(page).toHaveURL(/\/library$/)
      // Back does not reopen it.
      await page.goBack().catch(() => {})
      await expect(panel).toHaveCount(0)
    })

    test('the short link /go/GL:ml-kem ends with the Glossary open on the term', async ({
      page,
    }) => {
      await page.goto('/go/GL:ml-kem')
      const panel = glossaryPanel(page)
      await expect(panel).toBeVisible({ timeout: 30_000 })
      await expect(
        panel.getByRole('heading', { level: 3, name: 'ML-KEM', exact: true })
      ).toBeVisible()
    })
  })
}
