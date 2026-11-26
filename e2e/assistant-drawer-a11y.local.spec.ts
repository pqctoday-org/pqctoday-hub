// SPDX-License-Identifier: AGPL-3.0-only
import type { Locator, Page } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'
import { test, expect } from './fixtures/blockAnalytics'
import {
  PHONE,
  WIDE,
  ask,
  drawerOf,
  isPhone,
  openDrawer,
  seedHub,
} from './fixtures/assistantDrawer'

/**
 * Accessibility of the Assistant drawer in every state it can show, in both themes, on a wide screen
 * and on a 390 px phone: empty, loading, each kind of answer, the record viewer, the saved note, the
 * empty-question notice, a refused save and the data-not-loaded notice. Each state is scanned with
 * axe (WCAG 2.2 A and AA plus best practice) on the drawer itself.
 */

const FACT = 'When is the CNSA 2.0 deadline?'
const CONCEPT = 'What is ML-KEM?'

async function scan(page: Page, state: string) {
  const root = page.locator('[data-assistant-layout]')
  await expect(root).toBeVisible()
  // The slide-in finishes before colours are measured.
  await expect.poll(() => root.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  await page.waitForTimeout(350)
  const violations = await getViolations(page, '[data-assistant-layout]', {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
    },
  })
  expect(
    violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.html.slice(0, 120)),
    })),
    `axe violations in the "${state}" state`
  ).toEqual([])
}

const send = async (page: Page, drawer: Locator, text: string) => {
  const input = drawer.getByRole('textbox', { name: 'Your question' })
  await input.fill(text)
  if (isPhone(page)) await drawer.getByRole('button', { name: 'Send', exact: true }).click()
  else await input.press('Enter')
}

for (const theme of ['light', 'dark'] as const) {
  for (const [name, viewport] of [
    ['1280 px wide', WIDE],
    ['390 px phone', PHONE],
  ] as const) {
    test.describe(`Assistant drawer accessibility, ${theme}, ${name}`, () => {
      // The PWA worker's own fetches cannot be held or refused from the page, so it is blocked here.
      test.use({ viewport, serviceWorkers: 'block' })

      test('every state has no axe violations', async ({ page }) => {
        test.setTimeout(180_000)
        await page.addInitScript(() => {
          const original = Storage.prototype.setItem
          Object.assign(window, { __refuse: false })
          Storage.prototype.setItem = function (key: string, value: string) {
            if ((window as unknown as { __refuse: boolean }).__refuse && key === 'pqc-my-work') {
              throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
            }
            return original.call(this, key, value)
          }
        })
        await seedHub(page, { theme })
        // The knowledge files are held back until the loading state has been scanned.
        let release: () => void = () => {}
        const gate = new Promise<void>((resolve) => (release = resolve))
        await page.route('**/data/knowledge-*.json', async (route) => {
          await gate
          await route.continue()
        })
        await page.goto('/learn')
        await injectAxe(page)
        const drawer = await openDrawer(page)
        await scan(page, 'empty')

        await send(page, drawer, FACT)
        await expect(
          drawer.getByRole('status').filter({ hasText: 'Looking in the Hub records.' })
        ).toBeVisible()
        await scan(page, 'loading')
        release()
        await expect(drawer.getByRole('group', { name: 'Direct answer' })).toBeVisible({
          timeout: 30_000,
        })
        await page.unroute('**/data/knowledge-*.json')
        await scan(page, 'direct answer')

        // Saved, then a refused save.
        const direct = drawer.getByRole('article', { name: FACT }).last()
        await direct.getByRole('button', { name: 'Save answer' }).click()
        await expect(direct.getByRole('button', { name: 'Saved to My work' })).toBeDisabled()
        await scan(page, 'saved')

        const concept = await ask(page, drawer, CONCEPT)
        await page.evaluate(() => Object.assign(window, { __refuse: true }))
        await concept.getByRole('button', { name: 'Save answer' }).click()
        await expect(concept.getByRole('alert')).toContainText('was not saved')
        await scan(page, 'save refused')
        await page.evaluate(() => Object.assign(window, { __refuse: false }))

        const more = concept.getByRole('button', { name: /^Show \d+ more/ })
        if (await more.count()) {
          await more.click()
          await expect(concept.getByRole('button', { name: 'Show fewer records' })).toBeVisible()
          await scan(page, 'resources with every record shown')
        }

        for (const [state, question] of [
          ['name card', 'ML-KEM'],
          ['choices', 'Kyber'],
          ['broad', 'help'],
          ['not a fact', 'Will ML-KEM be broken by 2030?'],
        ] as const) {
          await ask(page, drawer, question)
          await scan(page, state)
        }

        // The record viewer: a record read inside the drawer.
        const readable = drawer
          .getByRole('article', { name: CONCEPT })
          .last()
          .getByRole('button', { name: /^Read here:/ })
          .first()
        await readable.click()
        // A wide screen shows "Back to your answer"; a phone pins the record with "Close".
        const leave = isPhone(page)
          ? drawer
              .locator('section[aria-label]')
              .getByRole('button', { name: 'Close', exact: true })
          : drawer.getByRole('button', { name: 'Back to your answer', exact: true })
        await expect(leave).toBeVisible()
        await scan(page, 'record viewer')
        await leave.click()

        // An empty question.
        await drawer.getByRole('textbox', { name: 'Your question' }).fill('  ')
        await drawer.getByRole('button', { name: 'Send', exact: true }).click()
        await expect(
          drawer.getByRole('alert').filter({ hasText: 'Type a question first.' })
        ).toBeVisible()
        await scan(page, 'empty question')

        // The data did not load.
        // A new page load drops the engine's loaded files, so the failure is seen on a fresh load.
        await page.route('**/data/knowledge-*.json', (route) => route.abort())
        await page.reload()
        await openDrawer(page)
        await injectAxe(page)
        await send(page, drawerOf(page), 'What is a hybrid certificate?')
        await expect(
          page.getByRole('alert').filter({ hasText: 'could not load the data' })
        ).toBeVisible({
          timeout: 30_000,
        })
        await scan(page, 'data not loaded')
      })
    })
  }
}
