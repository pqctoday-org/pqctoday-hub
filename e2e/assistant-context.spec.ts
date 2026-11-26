// SPDX-License-Identifier: AGPL-3.0-only
import type { Locator, Page } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'
import { test, expect } from './fixtures/blockAnalytics'
import {
  PHONE,
  answerOf,
  ask,
  drawerOf,
  isPhone,
  openDrawer,
  openTab,
  openerOf,
  seedHub,
} from './fixtures/assistantDrawer'

/**
 * The Assistant knows the page it is asked from, offers questions that follow what the learner is doing, and can be closed
 * from its own header and is marked in the top bar while it is open.
 */

// What is BSI? is answered with the lesson "Standards, Certification & Compliance Bodies" (LM-004) among its Learn resources,
// behind another lesson. Asked from that lesson's own page, the lesson comes first.
const QUESTION = 'What is BSI?'
const LESSON_TAG = 'LM-004'
const LESSON_PAGE = '/learn/standards-bodies'

/** The tag of the resource a tab opens on. */
async function firstTagOf(answer: Locator, tab: RegExp): Promise<string> {
  const panel = await openTab(answer, tab)
  return (await panel.getAttribute('data-tag'))!
}

async function tabCounts(answer: Locator): Promise<string[]> {
  return answer
    .getByRole('tab')
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''))
}

test.describe('Asking from a page', () => {
  test.use({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })

  test('a lesson page puts that lesson first in its group, and changes nothing else about the answer', async ({
    page,
  }) => {
    await seedHub(page)
    await page.goto('/timeline')
    let drawer = await openDrawer(page)
    const away = await ask(page, drawer, QUESTION)
    const awayFirst = await firstTagOf(away, /^Learn, \d+ resources?$/)
    const awayTabs = await tabCounts(away)
    expect(awayFirst).not.toBe(LESSON_TAG)

    await page.goto(LESSON_PAGE)
    drawer = await openDrawer(page)
    const here = await ask(page, drawer, QUESTION)
    expect(await firstTagOf(here, /^Learn, \d+ resources?$/)).toBe(LESSON_TAG)
    // the same kinds of resource, in the same numbers: only the order inside a group moved
    expect(await tabCounts(here)).toEqual(awayTabs)
  })

  test('the same question from the lesson page and from a page with no lesson differ only in order', async ({
    page,
  }) => {
    await seedHub(page)
    const tagsOn = async (url: string): Promise<{ all: string[]; order: string[] }> => {
      await page.goto(url)
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, QUESTION)
      const order: string[] = []
      const panel = answer.getByRole('tabpanel')
      const next = answer.getByRole('button', { name: /^(Next resource|No more resources)/ })
      for (let i = 0; i < 200; i++) {
        order.push((await panel.getAttribute('data-tag'))!)
        if ((await next.getAttribute('aria-disabled')) === 'true') break
        await next.click()
      }
      return { all: [...new Set(order)].sort(), order }
    }
    const away = await tagsOn('/threats')
    const here = await tagsOn(LESSON_PAGE)
    expect(here.all).toEqual(away.all)
    expect(here.order).not.toEqual(away.order)
  })
})

const HOME = '/compliance'

/** A learner with a focused objective of two lessons; the first one finished `finishedAgoMs` ago, or not at all. */
async function seedObjective(page: Page, finishedAgoMs: number | null) {
  const step = (id: string, n: number, tag: string) => ({
    id,
    position: n,
    kind: 'module',
    resourceTag: tag,
    required: true,
    origin: { type: 'match' },
  })
  await page.addInitScript(
    ([ago]) => {
      if (localStorage.getItem('pqc-journey') !== null) return
      const goal = {
        id: 'a',
        role: 'architect',
        goal: 'Review our TLS migration design',
        state: 'active',
        steps: [
          {
            id: 'a-1',
            position: 1,
            kind: 'module',
            resourceTag: 'LM-001',
            required: true,
            origin: { type: 'match' },
          },
          {
            id: 'a-2',
            position: 2,
            kind: 'module',
            resourceTag: 'LM-008',
            required: true,
            origin: { type: 'match' },
          },
        ],
        checkpoint: { path: ['journey', 'objectives'], stepId: null },
        createdAt: 1,
        updatedAt: 1,
      }
      const at = ago === null ? null : Date.now() - ago
      localStorage.setItem(
        'pqc-journey',
        JSON.stringify({
          version: 2,
          state: {
            objectives: { a: goal },
            order: ['a'],
            focus: { architect: 'a' },
            completions:
              at === null
                ? {}
                : { 'LM-001': { tag: 'LM-001', kind: 'completed', source: 'self', at } },
          },
        })
      )
    },
    [finishedAgoMs] as const
  )
  void step
}

const suggested = (drawer: Locator) => drawer.getByRole('group', { name: 'Suggested questions' })
const mainQuestion = async (drawer: Locator) =>
  (await suggested(drawer).getByRole('button').first().textContent())!.trim()

test.describe('Suggested questions follow the learner', () => {
  test.use({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })

  test('a learner with no objective, one with a focused objective and one who just finished a step are offered different questions', async ({
    browser,
  }) => {
    const mains: string[] = []
    const whys: string[] = []
    for (const finished of [undefined, null, 60_000] as const) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        serviceWorkers: 'block',
      })
      const page = await context.newPage()
      await seedHub(page)
      if (finished !== undefined) await seedObjective(page, finished)
      await page.goto(HOME)
      const drawer = await openDrawer(page)
      await expect(suggested(drawer)).toBeVisible()
      mains.push(await mainQuestion(drawer))
      await suggested(drawer).getByRole('button', { name: 'Why this question?' }).click()
      whys.push((await suggested(drawer).locator('p.text-xs').last().textContent())!)
      await context.close()
    }
    expect(mains[0]).toBe('Which lessons are for the Security Architect role?')
    expect(mains[1]).toBe('What will I learn in PQC 101?')
    expect(mains[2]).toBe('Where can I practise PQC 101?')
    expect(new Set(mains).size).toBe(3)
    expect(whys[0]).toMatch(/^Based on: your role, Security Architect\./)
    expect(whys[1]).toMatch(
      /^Based on: next step in your objective, Review our TLS migration design\./
    )
    expect(whys[2]).toMatch(/^Based on: you finished PQC 101\./)
  })

  test('the page being read comes first, a question asked drops out and the next one moves up, and nothing is written to the journey', async ({
    page,
  }) => {
    await seedHub(page)
    await seedObjective(page, null)
    await page.goto('/learn/tls-basics')
    const drawer = await openDrawer(page)
    const stored = () => page.evaluate(() => localStorage.getItem('pqc-journey'))
    const before = await stored()
    expect(before).not.toBeNull()

    const first = await mainQuestion(drawer)
    expect(first).toBe('What is TLS Basics about?')
    const answer = await ask(page, drawer, first)
    await expect(answer.getByRole('tabpanel')).toBeVisible()

    // the question just asked is not offered again; the main one now builds on the answer that was just read
    await expect(suggested(drawer)).toBeVisible()
    const second = await mainQuestion(drawer)
    expect(second).not.toBe(first)
    expect(second).toMatch(/^Which (?:lessons teach|tools go with) /)
    // under an answer the explanation sits with the rest of the questions
    await suggested(drawer)
      .getByRole('button', { name: /^More questions/ })
      .click()
    await suggested(drawer).getByRole('button', { name: 'Why this question?' }).click()
    await expect(suggested(drawer)).toContainText(
      /Based on: (?:a lesson in )?the answer you just read/
    )
    await suggested(drawer).getByRole('button').first().click()
    await expect(answerOf(drawer, second)).toBeVisible({ timeout: 30_000 })

    // asking is not progress: the stored journey is byte for byte what it was
    expect(await stored()).toBe(before)
    // and the objective area reads as before
    await expect(drawer.getByTestId('objective-header-slot')).toContainText(
      'Review our TLS migration design'
    )
  })

  test('a question asked earlier is not offered again after a reload, until the progress changes', async ({
    page,
  }) => {
    await seedHub(page)
    await seedObjective(page, null)
    await page.goto('/learn/tls-basics')
    let drawer = await openDrawer(page)
    const first = await mainQuestion(drawer)
    expect(first).toBe('What is TLS Basics about?')
    await ask(page, drawer, first)

    // only hashes of the question and of the state are kept on the device
    const stored = await page.evaluate(() => localStorage.getItem('pqc-assistant-asked'))
    expect(stored).not.toBeNull()
    expect(stored).not.toContain('TLS')
    expect(JSON.parse(stored!).state.entries[0]).toEqual({
      q: expect.stringMatching(/^[0-9a-f]{8}$/),
      s: expect.stringMatching(/^[0-9a-f]{8}$/),
    })

    // a new visit: the conversation is gone, the memory is not
    await page.reload()
    drawer = await openDrawer(page)
    await expect(suggested(drawer)).toBeVisible()
    expect(await mainQuestion(drawer)).not.toBe(first)
    await expect(suggested(drawer).getByText(first, { exact: true })).toHaveCount(0)

    // the learner finishes a lesson, so the state is no longer the same: the question is offered again
    await page.evaluate(() => {
      const j = JSON.parse(localStorage.getItem('pqc-journey')!)
      j.state.completions['LM-001'] = { tag: 'LM-001', kind: 'completed', source: 'self', at: 1 }
      localStorage.setItem('pqc-journey', JSON.stringify(j))
    })
    await page.reload()
    drawer = await openDrawer(page)
    expect(await mainQuestion(drawer)).toBe(first)
  })

  test('after an answer, the main suggestion builds on it, with the answer named as its basis', async ({
    page,
  }) => {
    await seedHub(page)
    await page.goto('/threats')
    const drawer = await openDrawer(page)
    await ask(page, drawer, 'What is ML-KEM?')
    await expect(suggested(drawer)).toBeVisible()
    expect(await mainQuestion(drawer)).toBe('Which lessons teach ML-KEM?')
    await suggested(drawer)
      .getByRole('button', { name: /^More questions/ })
      .click()
    await suggested(drawer).getByRole('button', { name: 'Why this question?' }).click()
    await expect(suggested(drawer)).toContainText('Based on: the answer you just read, ML-KEM.')
    // the question it forms is answered with resources
    await suggested(drawer).getByRole('button').first().click()
    const next = answerOf(drawer, 'Which lessons teach ML-KEM?')
    await expect(next.getByRole('tabpanel')).toBeVisible({ timeout: 30_000 })
  })

  test('with two objectives and none in focus, the most recently used is resumed and the other is named', async ({
    page,
  }) => {
    await seedHub(page)
    await page.addInitScript(() => {
      if (localStorage.getItem('pqc-journey') !== null) return
      const objective = (id: string, goal: string, tag: string, updatedAt: number) => ({
        id,
        role: 'architect',
        goal,
        state: 'active',
        steps: [
          {
            id: `${id}-1`,
            position: 1,
            kind: 'module',
            resourceTag: tag,
            required: true,
            origin: { type: 'match' },
          },
        ],
        checkpoint: { path: ['journey', 'objectives'], stepId: null },
        createdAt: 1,
        updatedAt,
      })
      const a = objective('a', 'Review our TLS migration design', 'LM-001', 100)
      const b = objective('b', 'Brief the architecture board', 'LM-008', 500)
      localStorage.setItem(
        'pqc-journey',
        JSON.stringify({
          version: 2,
          state: { objectives: { a, b }, order: ['a', 'b'], focus: {}, completions: {} },
        })
      )
    })
    await page.goto(HOME)
    const drawer = await openDrawer(page)
    await expect(suggested(drawer)).toBeVisible()
    expect(await mainQuestion(drawer)).toBe('What will I learn in TLS Basics?')
    await suggested(drawer).getByRole('button', { name: 'Why this question?' }).click()
    await expect(suggested(drawer)).toContainText(
      'Based on: your most recently used objective, Brief the architecture board.'
    )
    await expect(
      suggested(drawer).getByRole('button', { name: /What will I learn in PQC 101\?/ })
    ).toBeVisible()
    await expect(suggested(drawer)).toContainText('Other objective')
  })

  test('the starting questions are still there for a first visit, and the text box is never disabled', async ({
    page,
  }) => {
    await seedHub(page, { persona: null })
    await page.goto('/threats')
    const drawer = await openDrawer(page)
    await expect(suggested(drawer).getByRole('button').first()).toContainText(
      'What is post-quantum cryptography, in two minutes?'
    )
    await expect(drawer.getByRole('textbox', { name: 'Your question' })).toBeEnabled()
  })
})

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Closing the drawer on a wide screen, ${theme}`, () => {
    test.use({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' })

    test('the header has a visible Close that works by keyboard, and the open button is highlighted', async ({
      page,
    }) => {
      await seedHub(page, { theme })
      await page.goto('/learn')
      const opener = openerOf(page)
      const colours = (el: Locator) =>
        el.evaluate((node) => {
          const s = getComputedStyle(node)
          return { fill: s.backgroundColor, border: s.borderTopColor, outline: s.outlineStyle }
        })
      const probe = async (cls: string, prop: 'backgroundColor' | 'borderTopColor') =>
        page.evaluate(
          ([c, p]) => {
            const el = document.createElement('div')
            el.className = c
            document.body.appendChild(el)
            const v = getComputedStyle(el)[p as 'backgroundColor']
            el.remove()
            return v
          },
          [cls, prop] as const
        )
      await expect(opener).toHaveAttribute('aria-pressed', 'false')
      const closed = await colours(opener)

      const drawer = await openDrawer(page)
      await expect(opener).toHaveAttribute('aria-pressed', 'true')
      // the theme's own highlight and ink, read once the page has applied it
      const highlight = await probe('bg-highlight', 'backgroundColor')
      const ink = await probe('border-2 border-ink', 'borderTopColor')
      expect(closed.fill).not.toBe(highlight)
      // the colours settle after the button's own short transition
      await expect.poll(async () => (await colours(opener)).fill).toBe(highlight)
      expect((await colours(opener)).border).toBe(ink)

      // Close: visible, after the width buttons, and reached with the keyboard
      const close = drawer.getByRole('button', { name: 'Close', exact: true })
      await expect(close).toBeVisible()
      // inside the drawer, once its slide-in has finished
      await expect
        .poll(async () => {
          const [b, r] = [(await close.boundingBox())!, (await drawer.boundingBox())!]
          return b.x + b.width <= r.x + r.width + 1 && b.x >= r.x
        })
        .toBe(true)
      const box = (await close.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(36)
      expect(box.height).toBeGreaterThanOrEqual(36)
      const wider = drawer.getByRole('button', { name: 'Wider', exact: true })
      await wider.focus()
      await page.keyboard.press('Tab')
      await expect(close).toBeFocused()
      const outline = await close.evaluate((node) => {
        const s = getComputedStyle(node)
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
      })
      expect(outline.style).not.toBe('none')
      expect(outline.width).toBeGreaterThanOrEqual(2)

      await page.keyboard.press('Enter')
      await expect(drawerOf(page)).toBeHidden()
      await expect(opener).toHaveAttribute('aria-pressed', 'false')
      await expect.poll(async () => (await colours(opener)).fill).not.toBe(highlight)
      // the way back: focus returns to the button that opened it
      await expect(opener).toBeFocused()
    })

    test('the top bar with the drawer open, and the drawer header, pass the contrast and name checks', async ({
      page,
    }) => {
      await seedHub(page, { theme })
      await page.goto('/learn')
      await openDrawer(page)
      await expect(openerOf(page)).toHaveAttribute('aria-pressed', 'true')
      await page.waitForTimeout(600)
      await injectAxe(page)
      for (const scope of ['header', '[data-assistant-layout]']) {
        const violations = await getViolations(page, scope, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
        })
        expect(
          violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html.slice(0, 100)) })),
          scope
        ).toEqual([])
      }
    })

    test('a click on Close closes it, and Escape still does', async ({ page }) => {
      await seedHub(page, { theme })
      await page.goto('/learn')
      let drawer = await openDrawer(page)
      await drawer.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(drawerOf(page)).toBeHidden()
      drawer = await openDrawer(page)
      await page.keyboard.press('Escape')
      await expect(drawerOf(page)).toBeHidden()
    })
  })
}

test.describe('Closing the drawer on a phone', () => {
  test.use({ viewport: PHONE, serviceWorkers: 'block' })

  test('the sheet keeps its Close as the first control', async ({ page }) => {
    await seedHub(page)
    await page.goto('/learn')
    const drawer = await openDrawer(page)
    expect(isPhone(page)).toBe(true)
    const close = drawer.getByRole('button', { name: 'Close', exact: true })
    await expect(close).toBeVisible()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await close.focus()
    await close.press('Enter')
    await expect(drawerOf(page)).toBeHidden()
  })
})
