// SPDX-License-Identifier: AGPL-3.0-only
import type { Locator, Page } from '@playwright/test'
import { test, expect } from './fixtures/blockAnalytics'
import {
  PHONE,
  answerOf,
  ask,
  drawerOf,
  isPhone,
  openDrawer,
  seedHub,
} from './fixtures/assistantDrawer'

/**
 * The response card: one card per question, a bar of resource types as icons with counts ("Top 5" first,
 * then the Hub's left menu order), and one resource at a time with Previous and Next. Also the width of the
 * docked drawer (520 px, 400 px below 1,280 px, resizable from 400 to 640 px) and the sheet below 1,024 px.
 */

const FACT = 'When is the CNSA 2.0 deadline?'
const CONCEPT = 'What is ML-KEM?'

/** The tab labels in the Hub's left menu order, "Top 5" first. */
const MENU_ORDER = [
  'Top 5',
  'Learn',
  'Timeline',
  'Threats',
  'Algorithms',
  'Products',
  'Compliance',
  'Certifications',
  'Tools',
  'Library',
  'Community',
  'Patents',
  'Site pages',
  'Release notes',
  'Glossary',
  'More',
]

/** The tabs of a card as `{ label, count }`, in the order shown. */
async function tabsOf(answer: Locator): Promise<{ label: string; count: number }[]> {
  const names = await answer
    .getByRole('tab')
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''))
  return names.map((n) => {
    const m = /^(.*), (\d+) resources?$/.exec(n)
    return { label: m![1], count: Number(m![2]) }
  })
}

const listOf = (drawer: Locator): Locator => drawer.getByTestId('assistant-list')

/** The drawer's width and the page's right padding, in pixels. */
async function widths(page: Page): Promise<{ drawer: number; padding: number }> {
  return page.evaluate(() => {
    const drawer = document.querySelector('[data-assistant-layout]') as HTMLElement
    let el = document.getElementById('main-content')?.parentElement ?? null
    let padding = 0
    while (el && el !== document.body) {
      const p = parseFloat(getComputedStyle(el).paddingRight)
      if (p > 0) {
        padding = p
        break
      }
      el = el.parentElement
    }
    return { drawer: drawer.getBoundingClientRect().width, padding }
  })
}

test.describe('Response card, wide screen', () => {
  test.use({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })

  test.beforeEach(async ({ page }) => {
    await seedHub(page)
    await page.goto('/learn')
  })

  test('the open card fits the drawer without scrolling, and its tabs follow the menu order', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, FACT)

    await expect(answer.getByRole('group', { name: 'Direct answer' })).toBeVisible()
    await expect(answer.getByText(/^From: /)).toBeVisible()
    await expect(answer.getByRole('button', { name: 'Save answer' })).toBeVisible()
    await expect(answer.getByRole('tablist', { name: 'Resource types' })).toBeVisible()
    await expect(answer.getByRole('tabpanel')).toBeVisible()
    await expect(answer.getByRole('button', { name: /^Next resource/ })).toBeVisible()

    // The whole card is inside the list's visible area: nothing to scroll to reach it.
    const list = (await listOf(drawer).boundingBox())!
    const card = (await answer.boundingBox())!
    expect(card.y).toBeGreaterThanOrEqual(list.y - 1)
    expect(card.y + card.height).toBeLessThanOrEqual(list.y + list.height + 1)

    const tabs = await tabsOf(answer)
    expect(tabs[0]).toEqual({ label: 'Top 5', count: Math.min(5, tabs.length > 1 ? 5 : 1) })
    const positions = tabs.map((t) => MENU_ORDER.indexOf(t.label))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    // Learn, Timeline and Compliance are in a CNSA answer, in menu order.
    const labels = tabs.map((t) => t.label)
    for (const label of ['Learn', 'Compliance', 'Library']) expect(labels).toContain(label)

    // The card does not change size as the learner steps.
    const before = (await answer.boundingBox())!.height
    await answer.getByRole('button', { name: /^Next resource/ }).click()
    expect((await answer.boundingBox())!.height).toBe(before)
  })

  test('Next alone steps through every resource, crossing types, and ends', async ({ page }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, FACT)
    const tabs = await tabsOf(answer)
    const total = tabs.filter((t) => t.label !== 'Top 5').reduce((n, t) => n + t.count, 0)

    const tags = new Set<string>()
    const footers = new Set<string>()
    const panel = answer.getByRole('tabpanel')
    const next = answer.getByRole('button', { name: /^(Next resource|No more resources)/ })
    let steps = 1
    for (; steps < 200; steps++) {
      tags.add((await panel.getAttribute('data-tag'))!)
      footers.add((await answer.getByText(/ · \d+ of \d+$/).textContent())!.split(' · ')[0])
      if ((await next.getAttribute('aria-disabled')) === 'true') break
      await next.click()
    }
    expect(tags.size).toBe(total)
    // "Top 5" first, then each other type once: the footer named every type.
    expect([...footers]).toEqual(tabs.map((t) => t.label))
    // The five of "Top 5" and then every resource once.
    expect(steps).toBe(Math.min(5, total) + total)
    await expect(next).toHaveText('End')
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    // aria-disabled, not disabled, so keyboard focus is never lost
    await expect(next).toHaveJSProperty('disabled', false)
  })

  test('a second question opens its card at the top of the list and folds the first to one line', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    await ask(page, drawer, FACT)
    const second = await ask(page, drawer, CONCEPT)
    const first = answerOf(drawer, FACT)

    const folded = first.getByRole('button', { name: /^Earlier answer/ })
    await expect(folded).toHaveAttribute('aria-expanded', 'false')
    await expect(folded).toContainText(FACT)
    await expect(folded).toContainText(/\d+ resources · /)
    expect((await folded.boundingBox())!.height).toBeLessThan(80)
    await expect(first.getByRole('tablist')).toHaveCount(0)

    // The second card's top is at the top of the list.
    await expect
      .poll(async () => {
        const list = (await listOf(drawer).boundingBox())!
        const card = (await second.boundingBox())!
        return Math.abs(card.y - list.y)
      })
      .toBeLessThan(3)

    // Opening the folded card folds the open one.
    await folded.click()
    await expect(first.getByRole('tablist')).toBeVisible()
    await expect(second.getByRole('tablist')).toHaveCount(0)
    await expect(second.getByRole('button', { name: /^Earlier answer/ })).toBeVisible()
  })

  test('the drawer is 520 px, drags to 600 px, is remembered after a reload, and the page keeps its padding', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    await expect.poll(async () => (await widths(page)).drawer).toBe(520)
    await expect.poll(async () => (await widths(page)).padding).toBe(520)

    // Drag the left edge 80 px to the left.
    const handle = drawer.getByRole('separator', { name: 'Resize the Assistant' })
    await expect(handle).toHaveAttribute('aria-valuenow', '520')
    const box = (await handle.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 40, y, { steps: 4 })
    await page.mouse.move(x - 80, y, { steps: 4 })
    await page.mouse.up()
    await expect.poll(async () => (await widths(page)).drawer).toBe(600)
    await expect.poll(async () => (await widths(page)).padding).toBe(600)
    await expect(handle).toHaveAttribute('aria-valuenow', '600')
    expect(await page.evaluate(() => localStorage.getItem('pqc-assistant-width'))).toContain('600')

    await page.reload()
    await openDrawer(page)
    await expect.poll(async () => (await widths(page)).drawer).toBe(600)
    await expect.poll(async () => (await widths(page)).padding).toBe(600)
  })

  test('Narrower and Wider step by 60 px and the keyboard moves the handle by 20 px', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    await drawer.getByRole('button', { name: 'Narrower' }).click()
    await expect.poll(async () => (await widths(page)).drawer).toBe(460)
    await drawer.getByRole('button', { name: 'Narrower' }).click()
    await expect.poll(async () => (await widths(page)).drawer).toBe(400)
    await expect(drawer.getByRole('button', { name: 'Narrower' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    await drawer.getByRole('button', { name: 'Wider' }).click()
    await expect.poll(async () => (await widths(page)).drawer).toBe(460)

    const handle = drawer.getByRole('separator', { name: 'Resize the Assistant' })
    await handle.focus()
    await page.keyboard.press('ArrowLeft')
    await expect.poll(async () => (await widths(page)).drawer).toBe(480)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect.poll(async () => (await widths(page)).drawer).toBe(440)
    expect((await widths(page)).padding).toBe(440)
    // A double click goes back to the automatic width.
    await handle.dblclick()
    await expect.poll(async () => (await widths(page)).drawer).toBe(520)
  })

  test('keyboard only: tab bar arrows, Prev and Next, Read here, and Back to your answer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, CONCEPT)

    // The selected tab is the one in the tab order; arrows move and select it, and focus stays.
    const top = answer.getByRole('tab', { name: /^Top 5, / })
    await top.focus()
    await page.keyboard.press('ArrowRight')
    const second = answer.getByRole('tab', { selected: true })
    await expect(second).toBeFocused()
    await expect(second).not.toHaveAccessibleName(/^Top 5/)
    await expect(answer.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      (await second.getAttribute('id'))!
    )
    await page.keyboard.press('Home')
    await expect(top).toBeFocused()
    await expect(top).toHaveAttribute('aria-selected', 'true')

    // Prev and Next with the keyboard: focus stays on the button.
    const next = answer.getByRole('button', { name: /^Next resource/ })
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(answer.getByText(/^Top 5 · 2 of /)).toBeVisible()
    await expect(next).toBeFocused()
    const prev = answer.getByRole('button', { name: /^(Previous resource|No earlier resources)/ })
    await prev.focus()
    await page.keyboard.press('Enter')
    await expect(answer.getByText(/^Top 5 · 1 of /)).toBeVisible()
    await expect(prev).toBeFocused()

    // Read here opens the record in the drawer; Back to your answer returns focus to the same action.
    const read = answer.getByRole('button', { name: 'Read here: ML-KEM', exact: true })
    await read.focus()
    await page.keyboard.press('Enter')
    const back = drawer.getByRole('button', { name: 'Back to your answer', exact: true })
    await expect(back).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(answerOf(drawer, CONCEPT).getByRole('tabpanel')).toBeVisible()
    await expect(read).toBeFocused()
  })
})

test.describe('Response card, breakpoints', () => {
  test.use({ serviceWorkers: 'block' })

  test('1,100 px: a 400 px drawer beside the page', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 })
    await seedHub(page)
    await page.goto('/learn')
    const drawer = await openDrawer(page)
    await expect(drawer).toHaveAttribute('data-assistant-layout', 'docked')
    await expect.poll(async () => (await widths(page)).drawer).toBe(400)
    await expect.poll(async () => (await widths(page)).padding).toBe(400)
    const answer = await ask(page, drawer, FACT)
    const box = (await answer.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual((await drawer.boundingBox())!.x)
    expect(box.x + box.width).toBeLessThanOrEqual(1100)
  })

  test('900 px: the full-screen sheet', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 })
    await seedHub(page)
    await page.goto('/learn')
    expect(isPhone(page)).toBe(true)
    const drawer = await openDrawer(page)
    await expect(drawer).toHaveAttribute('data-assistant-layout', 'sheet')
    expect((await drawer.boundingBox())!.width).toBe(900)
    await expect(drawer.getByRole('separator')).toHaveCount(0)
    await ask(page, drawer, FACT)
  })
})

test.describe('Response card, phone', () => {
  test.use({ viewport: PHONE, serviceWorkers: 'block' })

  test.beforeEach(async ({ page }) => {
    await seedHub(page)
    await page.goto('/learn')
  })

  test('the same card in the sheet: every tab of the ML-KEM answer on one row', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, CONCEPT)
    const tabs = answer.getByRole('tab')
    const n = await tabs.count()
    expect(n).toBeGreaterThanOrEqual(2)
    const rows = new Set<number>()
    for (let i = 0; i < n; i++) {
      await expect(tabs.nth(i)).toBeVisible()
      const box = (await tabs.nth(i).boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(34)
      expect(box.x + box.width).toBeLessThanOrEqual(PHONE.width)
      rows.add(Math.round(box.y))
    }
    // Up to eight types fit on one row.
    if (n <= 8) expect(rows.size).toBe(1)
    // No horizontal scrolling inside the sheet.
    expect(await listOf(drawer).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  })

  test('Read here opens the pinned card, capped at 40 percent, and Close returns focus to the stepper action', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, CONCEPT)
    const read = answer.getByRole('button', { name: 'Read here: ML-KEM', exact: true })
    await read.click()
    const pinned = drawer.getByRole('region', { name: 'ML-KEM', exact: true })
    await expect(pinned).toBeVisible()
    expect((await pinned.boundingBox())!.height).toBeLessThanOrEqual(PHONE.height * 0.4 + 2)
    await pinned.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(pinned).toHaveCount(0)
    await expect(read).toBeFocused()
  })
})

/** A focused objective and a second one, as an earlier visit would have stored them. */
async function seedObjectives(page: Page) {
  const step = (id: string, n: number, tag: string) => ({
    id,
    position: n,
    kind: 'module',
    resourceTag: tag,
    required: true,
    origin: { type: 'match' },
  })
  const outcome = (id: string, n: number) => ({
    id,
    position: n,
    kind: 'self-assessed',
    resourceTag: 'o/outcome',
    required: true,
    origin: { type: 'match' },
  })
  const objective = (id: string, goal: string) => ({
    id,
    role: 'architect',
    goal,
    state: 'active',
    steps: [step(`${id}-s1`, 1, 'LM-008'), outcome(`${id}-s2`, 2)],
    checkpoint: { path: ['journey', 'objectives'], stepId: null },
    createdAt: 1,
    updatedAt: 1,
  })
  await page.addInitScript(
    ([a, b]) => {
      if (localStorage.getItem('pqc-journey') === null) {
        localStorage.setItem(
          'pqc-journey',
          JSON.stringify({
            version: 2,
            state: {
              objectives: { a: JSON.parse(a), b: JSON.parse(b) },
              order: ['a', 'b'],
              focus: { architect: 'a' },
              completions: {},
            },
          })
        )
      }
    },
    [
      JSON.stringify(objective('a', 'Review our TLS migration design')),
      JSON.stringify(objective('b', 'Plan the certificate rollout')),
    ] as const
  )
}

for (const [name, viewport] of [
  ['wide screen', { width: 1440, height: 900 }],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`The objective area beside the response card, on a ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })

    test('with a focused objective: its title, Switch and the card below it all work', async ({
      page,
    }) => {
      await seedHub(page)
      await seedObjectives(page)
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const slot = drawer.getByTestId('objective-header-slot')
      await expect(slot).toContainText('Review our TLS migration design')

      await slot.getByRole('button', { name: 'Switch' }).click()
      const choices = slot.getByRole('list', { name: 'Your objectives' })
      await expect(choices).toContainText('Plan the certificate rollout')
      await expect(choices.getByRole('link', { name: 'Manage objectives' })).toBeVisible()
      await expect(choices.getByRole('link', { name: 'New objective' })).toBeVisible()
      await slot.getByRole('button', { name: 'Switch' }).click()
      await expect(choices).toHaveCount(0)

      const answer = await ask(page, drawer, FACT)
      await expect(answer.getByRole('tabpanel')).toBeVisible()
      await expect(slot).toBeVisible()
      // The card is whole inside the list, with the objective area showing.
      const list = (await listOf(drawer).boundingBox())!
      const card = (await answer.boundingBox())!
      expect(card.y).toBeGreaterThanOrEqual(list.y - 1)
      if (!isPhone(page)) expect(card.y + card.height).toBeLessThanOrEqual(list.y + list.height + 1)
    })

    test('with none: "Start an objective" opens the new-objective form, and the card works below it', async ({
      page,
    }) => {
      await seedHub(page)
      await page.goto('/learn')
      const drawer = await openDrawer(page)
      const slot = drawer.getByTestId('objective-header-slot')
      await expect(slot).toContainText('No objective yet')
      const answer = await ask(page, drawer, CONCEPT)
      await expect(answer.getByRole('tabpanel')).toBeVisible()
      await slot.getByRole('link', { name: 'Start an objective' }).click()
      await expect(page).toHaveURL(/\/learn\?mode=journey&new=1/)
      await expect(page.getByTestId('new-objective')).toBeVisible({ timeout: 30_000 })
      if (!isPhone(page)) await expect(drawerOf(page)).toBeVisible()
    })
  })
}
