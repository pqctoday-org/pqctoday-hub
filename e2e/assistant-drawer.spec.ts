// SPDX-License-Identifier: AGPL-3.0-only
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures/blockAnalytics'
import {
  PHONE,
  WIDE,
  ask,
  answerOf,
  drawerOf,
  isPhone,
  openDrawer,
  openerOf,
  returnControl,
  seedHub,
  trackForeignRequests,
} from './fixtures/assistantDrawer'

/**
 * The Assistant drawer, end to end: ask, the answer states, save, go to a page and come back, focus,
 * and the phone sheet. It answers from the Hub's own records, so every question here is answered
 * on the device with no request to any other host.
 */

const FACT = 'When is the CNSA 2.0 deadline?'
const CONCEPT = 'What is ML-KEM?'
const NAME = 'ML-KEM'
const CHOICES = 'Kyber'
const BROAD = 'help'
const NOT_A_FACT = 'Will ML-KEM be broken by 2030?'

/** The accessible name of the element that has keyboard focus, or "BODY" when focus is on the page itself. */
const focusedName = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return 'BODY'
    return (el.getAttribute('aria-label') || el.textContent || el.tagName).trim()
  })

/** Press a key until the focused element's name matches; fails if it is never reached. */
async function pressUntil(page: Page, key: 'Tab' | 'Shift+Tab', name: RegExp, limit = 80) {
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press(key)
    if (name.test(await focusedName(page))) return
  }
  throw new Error(`${name} was not reached with ${key}; focus is on "${await focusedName(page)}"`)
}

for (const [name, viewport] of [
  ['wide screen', WIDE],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`Assistant drawer on a ${name}`, () => {
    // The PWA worker's own fetches cannot be refused from the page, so the data-not-loaded test needs it blocked.
    test.use({ viewport, serviceWorkers: 'block' })

    test.beforeEach(async ({ page }) => {
      await seedHub(page)
    })

    test('answers a fact with the direct answer, its evidence and the resources', async ({
      page,
      baseURL,
    }) => {
      const foreign = trackForeignRequests(page, baseURL!)
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      await expect(drawer.getByText('Ask anything. No sign-up or objective needed.')).toBeVisible()

      const answer = await ask(page, drawer, FACT)
      const direct = answer.getByRole('group', { name: 'Direct answer' })
      await expect(direct).toContainText('2031')
      await expect(direct).toContainText('Checked against the record.')
      await expect(answer.getByText(/^From: /)).toBeVisible()
      // One card: a bar of resource types, and one resource at a time.
      await expect(answer.getByRole('tablist', { name: 'Resource types' })).toBeVisible()
      await expect(answer.getByRole('tabpanel')).toBeVisible()
      // A polite status line announces the answer without moving focus.
      await expect(
        drawer.getByRole('status').filter({ hasText: /^Answer ready, \d+ resource/ })
      ).toBeAttached()
      await expect(drawer.getByRole('textbox', { name: 'Your question' })).toBeFocused()
      expect(foreign, 'the Assistant makes no request to another host').toEqual([])
    })

    test('reads a name as a card, several names as choices, and says plainly when it has no direct answer', async ({
      page,
    }) => {
      await page.goto('/learn')
      const drawer = await openDrawer(page)

      const concept = await ask(page, drawer, CONCEPT)
      await expect(concept.getByText('No direct answer: resources only.')).toBeVisible()
      await expect(concept.getByText(/^Closest: /)).toBeVisible()

      const card = await ask(page, drawer, NAME)
      await expect(card.getByText('One Hub record matches that name.')).toBeVisible()
      await expect(card.getByRole('group', { name: NAME, exact: true })).toBeVisible()

      const choices = await ask(page, drawer, CHOICES)
      await expect(
        choices.getByText('Several Hub records match that name. Choose one.')
      ).toBeVisible()
      await expect(choices.getByRole('list', { name: 'Records with this name' })).toBeVisible()

      const broad = await ask(page, drawer, BROAD)
      await expect(
        broad.getByText(/Broad match: the Hub has no direct answer to this/)
      ).toBeVisible()

      const guess = await ask(page, drawer, NOT_A_FACT)
      await expect(guess.getByText(/prediction|opinion|advice/i)).toBeVisible()
      await expect(guess.getByText(/^(From|Closest): /)).toHaveCount(0)
    })

    test('each answer is one card; the earlier one folds and keeps its own resources, and an empty question is not sent', async ({
      page,
    }) => {
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const first = await ask(page, drawer, FACT)
      const firstTabs = await first.getByRole('tab').count()
      expect(firstTabs).toBeGreaterThan(1)
      await ask(page, drawer, CONCEPT)
      // Only the newest card is open; the first is one line with its summary.
      await expect(drawer.getByRole('tablist')).toHaveCount(1)
      const folded = answerOf(drawer, FACT).getByRole('button', { name: /^Earlier answer/ })
      await expect(folded).toHaveAttribute('aria-expanded', 'false')
      await expect(folded).toContainText(/\d+ resources · /)
      // Opening it folds the other, and its resources are all still there.
      await folded.click()
      await expect(drawer.getByRole('tablist')).toHaveCount(1)
      await expect(answerOf(drawer, FACT).getByRole('tab')).toHaveCount(firstTabs)
      await expect(
        answerOf(drawer, CONCEPT).getByRole('button', { name: /^Earlier answer/ })
      ).toHaveAttribute('aria-expanded', 'false')

      const input = drawer.getByRole('textbox', { name: 'Your question' })
      await input.fill('   ')
      await drawer.getByRole('button', { name: 'Send', exact: true }).click()
      await expect(drawer.getByRole('alert')).toHaveText('Type a question first.')
      await expect(drawer.getByRole('article')).toHaveCount(2)
    })

    test('keeps the question and offers Try again when the Hub data does not load', async ({
      page,
    }) => {
      // The files are refused before the page loads, so the engine has never read them.
      await page.route('**/data/knowledge-*.json', (route) => route.abort())
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const input = drawer.getByRole('textbox', { name: 'Your question' })
      await input.fill(FACT)
      if (isPhone(page)) await drawer.getByRole('button', { name: 'Send', exact: true }).click()
      else await input.press('Enter')
      const notice = drawer.getByRole('alert').filter({ hasText: 'could not load the data' })
      await expect(notice).toBeVisible({ timeout: 30_000 })
      await expect(notice).toContainText('Nothing was lost.')
      await expect(drawer.getByRole('article')).toHaveCount(0)
      await expect(input).toHaveValue(FACT)

      await page.unroute('**/data/knowledge-*.json')
      await notice.getByRole('button', { name: 'Try again' }).click()
      await expect(
        answerOf(drawer, FACT).getByRole('group', { name: 'Direct answer' })
      ).toBeVisible({ timeout: 30_000 })
      await expect(drawer.getByRole('alert').filter({ hasText: 'could not load' })).toHaveCount(0)
    })

    test('Save answer keeps it in My work, and Open the answer asks it again in the drawer', async ({
      page,
    }) => {
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, FACT)
      const save = answer.getByRole('button', { name: 'Save answer' })
      await save.click()
      const saved = answer.getByRole('button', { name: 'Saved to My work' })
      await expect(saved).toBeDisabled()

      await page.goto('/learn?mode=journey&jview=my-work')
      const card = page.getByText(FACT, { exact: true }).first()
      await expect(card).toBeVisible({ timeout: 30_000 })
      await page.getByRole('button', { name: 'Open the answer' }).first().click()
      const again = drawerOf(page)
      await expect(again).toBeVisible()
      await expect(answerOf(again, FACT).getByRole('group', { name: 'Direct answer' })).toBeVisible(
        {
          timeout: 30_000,
        }
      )
      // The stored copy is untouched.
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem('pqc-my-work')
        return raw ? (JSON.parse(raw).state.answers as { question: string }[]) : []
      })
      expect(stored.map((a) => a.question)).toEqual([FACT])
    })

    test('a refused save keeps the answer on screen and Save answer again stores it once', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const original = Storage.prototype.setItem
        ;(window as unknown as { __refuse: boolean }).__refuse = true
        Storage.prototype.setItem = function (key: string, value: string) {
          if ((window as unknown as { __refuse: boolean }).__refuse && key === 'pqc-my-work') {
            throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
          }
          return original.call(this, key, value)
        }
      })
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, FACT)
      const save = answer.getByRole('button', { name: 'Save answer' })
      await save.click()
      await expect(answer.getByRole('alert')).toHaveText(
        'Your answer was not saved. Nothing was lost. Try again.'
      )
      await expect(save).toBeEnabled()
      await expect(answer.getByRole('group', { name: 'Direct answer' })).toBeVisible()

      await page.evaluate(() => {
        ;(window as unknown as { __refuse: boolean }).__refuse = false
      })
      await save.click()
      await expect(answer.getByRole('button', { name: 'Saved to My work' })).toBeDisabled()
      await expect(answer.getByRole('alert')).toHaveCount(0)
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem('pqc-my-work')
        return raw ? (JSON.parse(raw).state.answers as unknown[]) : []
      })
      expect(stored).toHaveLength(1)
    })

    test('Go to page opens the page and the way back is clicked with a real pointer, even under the page dialog', async ({
      page,
    }) => {
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, FACT)
      await answer.getByRole('button', { name: 'Go to page: CNSA 2.0', exact: true }).click()
      await expect(page).toHaveURL(/\/compliance\?framework=CNSA-2/)

      // The page opens its own detail dialog for the framework; the way back must still be reachable.
      const detail = page.getByRole('dialog', { name: /CNSA 2\.0/ })
      await expect(detail).toBeVisible({ timeout: 30_000 })
      const back = returnControl(page)
      await expect(back).toHaveCount(1)
      await expect(back).toBeVisible()
      if (isPhone(page)) {
        // The Assistant sheet closed when the page opened.
        await expect(drawerOf(page)).toHaveCount(0)
        await expect(back).toHaveAccessibleName(/^Back to /)
      } else {
        await expect(back).toHaveAccessibleName('Back to your answer')
        // The drawer stays beside the page.
        await expect(drawerOf(page)).toBeVisible()
      }
      // It sits inside the open dialog, so assistive technology and the keyboard reach it too.
      await expect(detail.getByRole('button', { name: /^Back to / })).toHaveCount(1)

      const box = await back.boundingBox()
      expect(box).not.toBeNull()
      // A real pointer click at the control's centre, with no force: it fails if anything covers it.
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await expect(page).toHaveURL(/\/learn/)
      await expect(returnControl(page)).toHaveCount(0)
      if (!isPhone(page)) {
        const reopened = drawerOf(page)
        await expect(reopened).toBeVisible()
        await expect(answerOf(reopened, FACT)).toBeVisible()
        // Focus is back on the row action that opened the page.
        await expect(
          reopened.getByRole('button', { name: 'Go to page: CNSA 2.0', exact: true })
        ).toBeFocused()
      }
    })

    test('keyboard only: ask, read, save, go to the page and come back, with focus where it should be', async ({
      page,
    }) => {
      await page.goto('/learn')
      // Open from the keyboard: the opener, then Enter. The question box takes focus.
      const opener = openerOf(page)
      await expect(opener).toBeVisible({ timeout: 30_000 })
      await opener.focus()
      await page.keyboard.press('Enter')
      if (isPhone(page)) {
        await page
          .getByTestId('mobile-page-actions-sheet')
          .getByRole('button', { name: /^Assistant/ })
          .press('Enter')
      }
      const drawer = drawerOf(page)
      await expect(drawer.getByRole('textbox', { name: 'Your question' })).toBeFocused()

      // Ask. A wide screen sends with Return; on a phone Return adds a line and Send is the next control.
      await page.keyboard.type(FACT)
      if (isPhone(page)) {
        await pressUntil(page, 'Tab', /^Send$/, 5)
        await expect(drawer.getByRole('article')).toHaveCount(0)
      }
      await page.keyboard.press('Enter')
      const answer = answerOf(drawer, FACT)
      await expect(answer.getByRole('group', { name: 'Direct answer' })).toBeVisible({
        timeout: 30_000,
      })
      // The answer is announced politely and focus has not moved.
      await expect(drawer.getByRole('status').filter({ hasText: /^Answer ready/ })).toBeAttached()
      expect(await focusedName(page)).toMatch(/^(Your question|Send)$/)

      // Save: reached from the keyboard, and focus stays on the control that now says it is saved.
      await pressUntil(page, 'Shift+Tab', /^Save answer$/)
      await page.keyboard.press('Enter')
      await expect(answer.getByRole('button', { name: 'Saved to My work' })).toBeFocused()
      expect(await focusedName(page)).toBe('Saved to My work')

      // Go to the page the answer points to: the first resource of the card comes after Save answer.
      await pressUntil(page, 'Tab', /^Go to page: CNSA 2\.0$/)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/compliance\?framework=CNSA-2/)
      const detail = page.getByRole('dialog', { name: /CNSA 2\.0/ })
      await expect(detail).toBeVisible({ timeout: 30_000 })

      // The way back is a control of the open dialog, so the keyboard reaches it.
      await pressUntil(page, 'Tab', /^Back to /, 120)
      expect(
        await page.evaluate(() => Boolean(document.activeElement?.closest('[aria-modal="true"]')))
      ).toBe(true)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/learn/)
      if (isPhone(page)) {
        // Back on the page, focus is on a control of the page, not lost to the document.
        await expect.poll(() => focusedName(page)).not.toBe('BODY')
      } else {
        // The drawer shows the answer again and focus is on the action that opened the page.
        await expect(drawerOf(page)).toBeVisible()
        await expect(
          drawerOf(page).getByRole('button', { name: 'Go to page: CNSA 2.0', exact: true })
        ).toBeFocused()
      }
    })

    test('the way back also works on a page that shows no dialog, and ends when the learner moves on', async ({
      page,
    }) => {
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const card = await ask(page, drawer, 'ML-DSA')
      await card
        .getByRole('button', { name: /^Go to page: ML-DSA/ })
        .first()
        .click()
      await expect(page).toHaveURL(/\/algorithms/)
      const back = returnControl(page)
      await expect(back).toBeVisible({ timeout: 30_000 })
      await back.click()
      await expect(page).toHaveURL(/\/learn/)
      await expect(returnControl(page)).toHaveCount(0)

      // Going on to another page instead ends the return.
      const again = isPhone(page) ? await openDrawer(page) : drawerOf(page)
      const second = answerOf(again, 'ML-DSA')
      await second
        .getByRole('button', { name: /^Go to page: ML-DSA/ })
        .first()
        .click()
      await expect(returnControl(page)).toBeVisible({ timeout: 30_000 })
      await page.goto('/library')
      await expect(returnControl(page)).toHaveCount(0)
    })

    test('there is no model chat: no set-up, no key, no model request', async ({
      page,
      baseURL,
    }) => {
      const requested: string[] = []
      page.on('request', (request) => requested.push(request.url()))
      const foreign = trackForeignRequests(page, baseURL!)
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      await ask(page, drawer, CONCEPT)

      // No tabs, no message box of the old chat, no set-up of a model or a key.
      await expect(page.getByRole('tablist', { name: /Tools drawer|Assistant/i })).toHaveCount(0)
      await expect(page.getByRole('textbox', { name: 'Message input' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0)
      const words = await drawer.innerText()
      expect(words).not.toMatch(/API key|WebLLM|Gemini|local model|language model|download/i)
      // No model, model library or model provider was ever requested.
      expect(requested.filter((u) => /web-?llm|\/mlc|generativelanguage/i.test(u))).toEqual([])
      expect(foreign).toEqual([])
      // The page hook that opened the old chat opens this drawer instead.
      await page.keyboard.press('Escape')
      if (!isPhone(page)) {
        await page.evaluate(() =>
          (
            window as unknown as { __e2e_toggle_panel?: (tab?: string) => void }
          ).__e2e_toggle_panel?.('chat')
        )
        await expect(drawerOf(page).getByRole('textbox', { name: 'Your question' })).toBeVisible()
        await expect(page.getByRole('textbox', { name: 'Message input' })).toHaveCount(0)
      }
    })
  })
}

test.describe('Assistant drawer on a 390 px phone: the dock and the sheet', () => {
  test.use({ viewport: PHONE })

  test.beforeEach(async ({ page }) => {
    await seedHub(page)
  })

  test('the dock is one thin bar; tapping it opens the sheet with an empty, focused box; Close brings back the page', async ({
    page,
  }) => {
    await page.goto('/learn')
    const bar = page.getByRole('button', { name: 'Ask the Assistant about this page' })
    await expect(bar).toBeVisible({ timeout: 30_000 })
    await expect(bar).toHaveText('Ask about this page')

    // One thin row: the whole dock is under 64 px, and the page's first heading is not under it.
    const dock = bar.locator('xpath=..')
    const dockBox = (await dock.boundingBox())!
    expect(dockBox.height).toBeLessThan(64)
    expect((await bar.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    const heading = page.getByRole('heading', { level: 1 }).first()
    await heading.scrollIntoViewIfNeeded()
    const h = (await heading.boundingBox())!
    expect(h.y + h.height).toBeLessThanOrEqual(dockBox.y)

    await bar.click()
    const sheet0 = drawerOf(page)
    await expect(sheet0).toBeVisible()
    const box = sheet0.getByRole('textbox', { name: 'Your question' })
    await expect(box).toBeFocused()
    await expect(box).toHaveValue('')
    // The suggested questions are in the empty Assistant.
    await expect(sheet0.getByText('Suggested for you')).toBeVisible()
    await expect(sheet0.getByRole('article')).toHaveCount(0)
    await box.fill('What is ML-KEM?')
    await box.press('Enter')
    // Return adds a line; only Send sends.
    await expect(box).toHaveValue('What is ML-KEM?\n')
    await expect(sheet0.getByRole('article')).toHaveCount(0)
    await sheet0.getByRole('button', { name: 'Send', exact: true }).click()

    const sheet = drawerOf(page)
    await expect(sheet).toBeVisible()
    await expect(answerOf(sheet, 'What is ML-KEM?')).toBeVisible({ timeout: 30_000 })
    await expect(sheet).toHaveAttribute('aria-modal', 'true')

    // The sheet holds focus: Tab never leaves it.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const dialog = document.querySelector('[data-assistant-layout="sheet"]')
        return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement))
      })
      expect(inside, `focus stayed in the sheet after Tab ${i + 1}`).toBe(true)
    }

    // In the sheet, Return adds a line and Send sends.
    const input = sheet.getByRole('textbox', { name: 'Your question' })
    await input.fill('ML-KEM')
    await input.press('Enter')
    await expect(input).toHaveValue('ML-KEM\n')
    await expect(sheet.getByRole('article')).toHaveCount(1)

    await sheet.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(sheet).toHaveCount(0)
    await expect(openerOf(page)).toBeVisible()
  })

  test('the sheet closes when a page opens and the page behind it scrolls again', async ({
    page,
  }) => {
    await page.goto('/learn')
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, FACT)
    await answer.getByRole('button', { name: 'Go to page: CNSA 2.0', exact: true }).click()
    await expect(page).toHaveURL(/\/compliance/)
    await expect(drawerOf(page)).toHaveCount(0)
    const overflow = await page.evaluate(
      () => document.getElementById('main-content')?.parentElement?.style.overflow ?? ''
    )
    expect(overflow).not.toBe('hidden')
  })
})
