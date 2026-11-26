// SPDX-License-Identifier: AGPL-3.0-only
import { type Page } from '@playwright/test'
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
  reveal,
  seedHub,
} from './fixtures/assistantDrawer'

/** Set E2E_SHOT_DIR to also save screenshots of the opened screens. */
const SHOTS = process.env.E2E_SHOT_DIR

/**
 * A row of an answer that opens a record on another page: the record's own detail drawer or dialog
 * must be fully visible and usable (never under the Assistant drawer), the way back must be reachable
 * with a real pointer, and returning shows the answer again. Real pointer clicks throughout.
 */

const KINDS: readonly {
  kind: string
  question: string
  open: string | RegExp
  url: RegExp
  inlineOnWide?: string
  /** A plain page with no dialog at either width (a lesson): only the way back is checked. */
  plainPage?: boolean
}[] = [
  {
    kind: 'Library',
    question: 'FIPS 203',
    open: /^Library document/,
    url: /\/library\?ref=/,
  },
  {
    kind: 'Library reference row',
    question: 'When is the CNSA 2.0 deadline?',
    open: 'Open reference: CNSA 2.0 Frequently Asked Questions',
    url: /\/library\?ref=/,
  },
  {
    kind: 'Lesson',
    question: 'When is the CNSA 2.0 deadline?',
    open: 'Go to module: PKI',
    url: /\/learn\/pki/,
    plainPage: true,
  },
  {
    kind: 'Compliance',
    question: 'When is the CNSA 2.0 deadline?',
    open: 'Go to page: CNSA 2.0',
    url: /\/compliance\?framework=CNSA-2/,
  },
  {
    kind: 'Threats',
    question: 'harvest now decrypt later threat',
    open: /^Go to page: AUS-GOV-001/,
    url: /\/threats\?id=AUS-GOV-001/,
  },
  {
    kind: 'Leaders',
    question: 'who leads PQC standards',
    open: /^Go to page: Steve Stevens/,
    url: /\/leaders\?leader=/,
    // The wide Leaders page shows the record in its own column rather than a dialog.
    inlineOnWide: 'Steve Stevens',
  },
]

/** Where the page's open dialog is topmost: its own centre and its right edge, where the docked drawer sits. */
async function expectDialogOnTop(page: Page) {
  const probe = await page.evaluate(() => {
    const modals = [
      ...document.querySelectorAll<HTMLElement>('[aria-modal="true"]:not([data-assistant-layout])'),
    ]
    const modal = modals[modals.length - 1]
    if (!modal) return { found: false, hits: [] as boolean[] }
    const box = modal.getBoundingClientRect()
    const points: [number, number][] = [
      [box.left + box.width / 2, box.top + box.height / 2],
      [Math.min(box.right, window.innerWidth) - 40, box.top + box.height / 2],
      [Math.min(box.right, window.innerWidth) - 40, box.top + 120],
    ]
    return {
      found: true,
      hits: points.map(([x, y]) => {
        const hit = document.elementFromPoint(x, y)
        return Boolean(hit) && !hit!.closest('[data-assistant-layout]')
      }),
    }
  })
  expect(probe.found).toBe(true)
  expect(probe.hits, 'nothing of the Assistant drawer covers the opened record').toEqual([
    true,
    true,
    true,
  ])
}

for (const [name, viewport] of [
  ['wide screen', WIDE],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`Opening a record from an answer, on a ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })

    test.beforeEach(async ({ page }) => {
      await seedHub(page)
    })

    for (const { kind, question, open, url, inlineOnWide, plainPage } of KINDS) {
      test(`${kind}: the opened record is fully visible and usable, and the way back restores the answer`, async ({
        page,
      }) => {
        test.setTimeout(60_000)
        await page.goto('/learn')
        const drawer = await openDrawer(page)
        const answer = await ask(page, drawer, question)
        // Step through the card until the resource's action is on screen, as a learner does.
        const action = await reveal(
          answer,
          typeof open === 'string'
            ? answer.getByRole('button', { name: open, exact: true })
            : answer.getByRole('button', { name: open }).first()
        )
        await action.click()
        await expect(page).toHaveURL(url)

        if (plainPage) {
          // A lesson: no dialog. The way back is offered on the page, on a phone too.
          await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
            timeout: 30_000,
          })
          const back = returnControl(page)
          await expect(back).toBeVisible()
          if (isPhone(page)) await expect(drawerOf(page)).toHaveCount(0)
          await back.click()
          await expect(page).toHaveURL(/\/learn$/)
          if (!isPhone(page)) await expect(answerOf(drawerOf(page), question)).toBeVisible()
          return
        }

        if (inlineOnWide && !isPhone(page)) {
          // Not a dialog: the record sits in the page, beside the drawer. It must not be under it.
          const record = page.locator('main').getByText(inlineOnWide).first()
          await expect(record).toBeVisible({ timeout: 30_000 })
          await record.scrollIntoViewIfNeeded()
          const covered = await record.evaluate((el) => {
            const r = el.getBoundingClientRect()
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
            return Boolean(hit?.closest('[data-assistant-layout]'))
          })
          expect(covered, 'the record is not under the Assistant drawer').toBe(false)
          const back = returnControl(page)
          await expect(back).toBeVisible()
          const box = (await back.boundingBox())!
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
          await expect(page).toHaveURL(/\/learn/)
          await expect(answerOf(drawerOf(page), question)).toBeVisible()
          return
        }

        const dialog = page.locator('[aria-modal="true"]:not([data-assistant-layout])').last()
        await expect(dialog).toBeVisible({ timeout: 30_000 })
        if (SHOTS)
          await page.screenshot({
            path: `${SHOTS}/after-open-${kind.toLowerCase().replace(/ /g, '-')}-${viewport.width}.png`,
          })
        await expectDialogOnTop(page)

        // The way back is reachable with a real pointer, and stays out of the record's way.
        const back = returnControl(page)
        await expect(back).toHaveCount(1)
        await expect(back).toBeVisible()
        if (isPhone(page)) {
          await expect(drawerOf(page)).toHaveCount(0)
        } else {
          // Beside the page, the drawer is still mounted, behind the record.
          await expect(drawerOf(page)).toBeAttached()
        }

        // The record is usable: a real pointer click on its own Close control closes it.
        const close = dialog.getByRole('button', { name: /^close/i }).first()
        if ((await close.count()) > 0 && (await close.isVisible())) {
          const box = (await close.boundingBox())!
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
          await expect(dialog).toHaveCount(0)
          if (!isPhone(page)) {
            // With the record closed, the drawer is in front again and its answer is still there.
            await expect(drawerOf(page)).toBeVisible()
            await expect(answerOf(drawerOf(page), question)).toBeVisible()
          }
        } else {
          const box = (await back.boundingBox())!
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
          await expect(page).toHaveURL(/\/learn/)
          if (!isPhone(page)) {
            await expect(answerOf(drawerOf(page), question)).toBeVisible()
          }
        }
      })
    }

    test('Library: "Back to your answer" returns to the answer with the drawer in front', async ({
      page,
    }) => {
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, 'FIPS 203')
      await (
        await reveal(answer, answer.getByRole('button', { name: /^Library document/ }))
      ).click()
      await expect(page).toHaveURL(/\/library\?ref=/)
      await expect(
        page.locator('[aria-modal="true"]:not([data-assistant-layout])').last()
      ).toBeVisible({ timeout: 30_000 })
      const back = returnControl(page)
      await expect(back).toBeVisible()
      const box = (await back.boundingBox())!
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      await expect(page).toHaveURL(/\/learn/)
      await expect(returnControl(page)).toHaveCount(0)
      if (!isPhone(page)) {
        await expect(answerOf(drawerOf(page), 'FIPS 203')).toBeVisible()
        await expect(drawerOf(page)).toHaveClass(/z-panel(?!-)/)
      }
    })
  })
}
