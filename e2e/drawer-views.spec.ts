// SPDX-License-Identifier: AGPL-3.0-only
import { getViolations, injectAxe } from 'axe-playwright'
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
  openerOf,
  seedHub,
} from './fixtures/assistantDrawer'

/**
 * Glossary, Guide, Sources and FAQ open in the same side drawer as the Assistant and Bookmarks: beside
 * the page on a wide screen, as a full-screen sheet on a phone, one view at a time. On a wide screen
 * the top bar's button is pressed while its view is open and a second click closes it. Real pointer
 * clicks throughout.
 */

/** Set E2E_SHOT_DIR to also save screenshots of each view. */
const SHOTS = process.env.E2E_SHOT_DIR

const VIEWS = [
  { button: 'Glossary', title: 'Glossary', phoneEntry: /^Glossary/ },
  { button: 'Guide', title: 'Page guide', phoneEntry: null },
  { button: 'Sources', title: 'Authoritative sources', phoneEntry: /^Sources/ },
  { button: 'FAQ', title: 'FAQ', phoneEntry: /^FAQ/ },
] as const

type View = (typeof VIEWS)[number]

const regionOf = (page: Page, title: string): Locator =>
  isPhone(page)
    ? page.getByRole('dialog', { name: title, exact: true })
    : page.getByRole('region', { name: title, exact: true })

/** Opens a view the way a learner does at this width. */
async function openView(page: Page, view: View): Promise<Locator> {
  if (!isPhone(page)) {
    await page.getByRole('banner').getByRole('button', { name: view.button, exact: true }).click()
  } else if (view.phoneEntry) {
    await openerOf(page).click()
    await page
      .getByTestId('mobile-page-actions-sheet')
      .getByRole('button', { name: view.phoneEntry })
      .click()
  } else {
    await page.getByRole('button', { name: 'Guide', exact: true }).click()
  }
  const region = regionOf(page, view.title)
  await expect(region).toBeVisible({ timeout: 15_000 })
  return region
}

/** True when nothing in the drawer reaches past its right edge or scrolls sideways. */
const noSideScroll = (region: Locator) =>
  region.evaluate((el) => {
    const edge = el.getBoundingClientRect().right + 1
    return Array.from(el.querySelectorAll<HTMLElement>('*')).every((b) => {
      const box = b.getBoundingClientRect()
      if (box.width <= 1 || box.height <= 1) return true // clipped helpers such as screen-reader text
      return (
        box.right <= edge &&
        !(b.scrollWidth > b.clientWidth + 1 && getComputedStyle(b).overflowX !== 'visible')
      )
    })
  })

for (const [name, viewport] of [
  ['wide screen', WIDE],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`Drawer views on a ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })

    test.beforeEach(async ({ page }) => {
      await seedHub(page)
    })

    for (const view of VIEWS) {
      test(`${view.button}: opens in the drawer, fits it, and closes again`, async ({ page }) => {
        test.setTimeout(60_000)
        await page.goto('/library')
        const region = await openView(page, view)
        await region.evaluate(() => new Promise((r) => setTimeout(r, 400)))
        expect(await noSideScroll(region), 'nothing scrolls sideways in the drawer').toBe(true)

        if (!isPhone(page)) {
          const button = page.getByRole('banner').getByRole('button', { name: view.button })
          await expect(button).toHaveAttribute('aria-pressed', 'true')
          // Beside the page, not over it.
          const [main, drawer] = await Promise.all([
            page.locator('#main-content').boundingBox(),
            region.boundingBox(),
          ])
          expect(main!.x + main!.width).toBeLessThanOrEqual(drawer!.x + 1)
          // A second click closes it, and the button is not pressed.
          await button.click()
          await expect(regionOf(page, view.title)).toHaveCount(0)
          await expect(button).toHaveAttribute('aria-pressed', 'false')
        } else {
          await region.getByRole('button', { name: 'Close', exact: true }).click()
          await expect(regionOf(page, view.title)).toHaveCount(0)
        }
      })

      test(`${view.button}: axe finds no serious problem in the drawer`, async ({ page }) => {
        test.setTimeout(60_000)
        await page.goto('/library')
        const region = await openView(page, view)
        await page.waitForTimeout(500)
        await injectAxe(page)
        const element = await region.elementHandle()
        const violations = await getViolations(page, element!, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        })
        expect(
          violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
          JSON.stringify(violations.map((v) => v.id))
        ).toEqual([])
      })
    }

    test('Escape closes the drawer and focus returns to the view button', async ({ page }) => {
      test.skip(isPhone(page), 'the phone sheet closes with its Close control')
      await page.goto('/library')
      await openView(page, VIEWS[0])
      await page.keyboard.press('Escape')
      await expect(regionOf(page, 'Glossary')).toHaveCount(0)
      await expect(
        page.getByRole('banner').getByRole('button', { name: 'Glossary', exact: true })
      ).toBeFocused()
    })

    test('the Assistant keeps its answer when the drawer shows the Glossary and comes back', async ({
      page,
    }) => {
      test.skip(isPhone(page), 'switching between views is by the top bar on a wide screen')
      await page.goto('/library')
      const drawer = await openDrawer(page)
      await ask(page, drawer, 'What is ML-KEM?')
      const bar = page.getByRole('banner')
      await bar.getByRole('button', { name: 'Glossary', exact: true }).click()
      await expect(regionOf(page, 'Glossary')).toBeVisible()
      await expect(bar.getByRole('button', { name: 'Assistant', exact: true })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
      await bar.getByRole('button', { name: 'Assistant', exact: true }).click()
      await expect(answerOf(drawerOf(page), 'What is ML-KEM?')).toBeVisible()
    })

    test('Guide and Sources follow the route, and a route without them closes the view', async ({
      page,
    }) => {
      test.skip(isPhone(page), 'the route links are in the wide top bar and rail')
      await page.goto('/library')
      await openView(page, VIEWS[2])
      const sources = regionOf(page, 'Authoritative sources')
      await expect(sources.getByText('Sources referenced for Library data')).toBeVisible()
      await page.locator('nav a[href="/migrate"]').first().click()
      await expect(page).toHaveURL(/\/migrate/)
      await expect(sources.getByText('Sources referenced for Migrate data')).toBeVisible()

      await page.getByRole('banner').getByRole('button', { name: 'Guide', exact: true }).click()
      const guide = regionOf(page, 'Page guide')
      await expect(guide).toBeVisible()
      const migrateGuide = await guide.innerText()
      await page.locator('nav a[href="/library"]').first().click()
      await expect(page).toHaveURL(/\/library/)
      await expect.poll(() => guide.innerText()).not.toBe(migrateGuide)

      // A page with neither closes a drawer left on them.
      await page.locator('a[href="/about"]').first().click()
      await expect(page).toHaveURL(/\/about/)
      await expect(regionOf(page, 'Page guide')).toHaveCount(0)
      await expect(
        page.getByRole('banner').getByRole('button', { name: 'Sources', exact: true })
      ).toHaveCount(0)
    })
  })
}

test.describe('Screens of the four views', () => {
  test.skip(!SHOTS, 'set E2E_SHOT_DIR to save them')
  for (const [name, viewport] of [
    ['wide', WIDE],
    ['phone', PHONE],
  ] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${name}, ${theme}`, async ({ page }) => {
        test.setTimeout(90_000)
        await page.setViewportSize(viewport)
        await seedHub(page, { theme })
        await page.goto('/library')
        for (const view of VIEWS) {
          const region = await openView(page, view)
          await page.waitForTimeout(700)
          await page.screenshot({
            path: `${SHOTS}/drawer-${view.button.toLowerCase()}-${name}-${theme}.png`,
          })
          if (!isPhone(page)) {
            await page
              .getByRole('banner')
              .getByRole('button', { name: view.button, exact: true })
              .click()
          } else {
            await region.getByRole('button', { name: 'Close', exact: true }).click()
          }
          await expect(regionOf(page, view.title)).toHaveCount(0)
        }
      })
    }
  }
})

/* The top bar's own toggles stay in view, with any drawer view open or closed. */
const TOGGLE_NAMES = ['Assistant', 'Bookmarks', 'Glossary', 'Guide', 'Sources', 'FAQ'] as const
const TOGGLE_TABS: Record<(typeof TOGGLE_NAMES)[number], string> = {
  Assistant: 'chat',
  Bookmarks: 'bookmarks',
  Glossary: 'glossary',
  Guide: 'guide',
  Sources: 'sources',
  FAQ: 'faq',
}

/** The bar that holds the toggles, and whether all six sit inside its visible box with nothing to scroll to. */
const barFits = (page: Page) =>
  page.evaluate((tabs) => {
    const first = document.querySelector<HTMLElement>('[data-drawer-toggle="chat"]')
    const bar = first?.closest<HTMLElement>('.overflow-x-auto')
    if (!bar) return { found: false } as const
    const box = bar.getBoundingClientRect()
    const inside = tabs.map((tab) => {
      const el = document.querySelector<HTMLElement>(`[data-drawer-toggle="${tab}"]`)
      if (!el) return `${tab}: missing`
      const r = el.getBoundingClientRect()
      const ok =
        r.width > 0 &&
        r.left >= box.left - 1 &&
        r.right <= box.right + 1 &&
        r.top >= box.top - 1 &&
        r.bottom <= box.bottom + 1
      return ok
        ? 'ok'
        : `${tab}: outside the bar (${Math.round(r.left)}-${Math.round(r.right)} of ${Math.round(box.left)}-${Math.round(box.right)})`
    })
    return {
      found: true,
      scrollLeft: bar.scrollLeft,
      noScroll: bar.scrollWidth <= bar.clientWidth + 1,
      inside,
    } as const
  }, Object.values(TOGGLE_TABS))

for (const size of [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
]) {
  test.describe(`Top bar toggles at ${size.width} px`, () => {
    test.use({ viewport: size, serviceWorkers: 'block' })

    test.beforeEach(async ({ page }) => {
      await seedHub(page)
    })

    for (const name of TOGGLE_NAMES) {
      test(`with ${name} open, all six toggles are in the bar without scrolling, ${name} is pressed, one click closes it`, async ({
        page,
      }) => {
        test.setTimeout(60_000)
        await page.goto('/library')
        // Wait for the page itself: its own action buttons (Info, Export, Endorse, Flag, Cite) join the bar.
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
          timeout: 30_000,
        })
        await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible({
          timeout: 30_000,
        })
        const bar = page.getByRole('banner')
        await bar.getByRole('button', { name, exact: true }).click()
        await expect(bar.getByRole('button', { name, exact: true })).toHaveAttribute(
          'aria-pressed',
          'true'
        )
        await page.waitForTimeout(500)
        const fit = await barFits(page)
        expect(fit.found).toBe(true)
        if (fit.found) {
          expect(fit.scrollLeft).toBe(0)
          expect(fit.noScroll, 'the bar has nothing to scroll to').toBe(true)
          expect(fit.inside).toEqual(Array(6).fill('ok'))
        }
        for (const other of TOGGLE_NAMES) {
          const box = (await bar.getByRole('button', { name: other, exact: true }).boundingBox())!
          expect(box.width).toBeGreaterThanOrEqual(24)
        }
        if (SHOTS && name === 'Glossary' && size.width === 1280) {
          await page.screenshot({ path: `${SHOTS}/topbar-glossary-open-1280-light.png` })
        }
        if (SHOTS && name === 'Assistant' && size.width === 1024) {
          await page.screenshot({ path: `${SHOTS}/topbar-assistant-open-1024-light.png` })
        }
        // One click on the pressed button closes the view.
        await bar.getByRole('button', { name, exact: true }).click()
        await expect(bar.getByRole('button', { name, exact: true })).toHaveAttribute(
          'aria-pressed',
          'false'
        )
      })
    }
  })
}

test.describe('Top bar toggles with room to spare', () => {
  test.use({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })

  test('at 1440 px with no drawer open, the labels are shown', async ({ page }) => {
    await seedHub(page)
    await page.goto('/library')
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible({ timeout: 30_000 })
    const bar = page.getByRole('banner')
    for (const name of TOGGLE_NAMES) {
      await expect(bar.getByRole('button', { name, exact: true })).toHaveText(name)
    }
    const fit = await barFits(page)
    expect(fit.found && fit.noScroll).toBe(true)
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/topbar-closed-1440-light.png` })
  })

  test('dark theme, Glossary open at 1280 px', async ({ page }) => {
    test.skip(!SHOTS, 'set E2E_SHOT_DIR to save it')
    await page.setViewportSize({ width: 1280, height: 800 })
    await seedHub(page, { theme: 'dark' })
    await page.goto('/library')
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('banner').getByRole('button', { name: 'Glossary', exact: true }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SHOTS}/topbar-glossary-open-1280-dark.png` })
  })
})
