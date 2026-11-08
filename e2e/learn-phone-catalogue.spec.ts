// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Learn on a phone: the Browse all catalogue and the guided "Where do I start?" flow
 * (release 4.200.0). A 390 x 844 phone (and a 320 wide one), emulated the way a phone behaves: a
 * mobile browser widens its layout viewport to fit overflowing content, so a leak shows up as
 * scrollWidth / innerWidth above the screen width.
 *
 * Covers the links the chat assistant makes (/learn?mode=browse&track=...), which used to open My
 * Path on a phone, the full list (one link per module), search, the guided start button, no
 * sideways scrolling, and axe on the Browse all and Guided views.
 */
import { test, expect, devices, type Page } from '@playwright/test'
import { injectAxe, getViolations } from 'axe-playwright'

// Run the phone emulation in whichever browser the project uses (the preset names WebKit).
const phone: Record<string, unknown> = { ...devices['iPhone 13'] }
delete phone.defaultBrowserType
test.use({ ...phone, reducedMotion: 'reduce' })
test.setTimeout(90_000)

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    // No "what's new" dialog over the page.
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // A fresh phone session shows the "Who's asking?" role picker before any page (MainLayout's
    // first-run gate). Browse all and Guided need no role; this only gets past that gate.
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({ state: { selectedPersona: 'architect' }, version: 10 })
    )
  })
})

const widths = (page: Page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))

async function expectNoSidewaysScroll(page: Page, screenWidth: number) {
  const w = await widths(page)
  expect(w.scrollWidth, JSON.stringify(w)).toBeLessThanOrEqual(screenWidth)
  expect(w.innerWidth, JSON.stringify(w)).toBeLessThanOrEqual(screenWidth)
}

const list = (page: Page) => page.getByTestId('mobile-browse-list')
const moduleLinks = (page: Page) => list(page).getByRole('link')

/** The module count the tab announces ("Browse all 75"), read off the page rather than typed here. */
async function catalogueCount(page: Page): Promise<number> {
  const label = await page.getByRole('tab', { name: /^Browse all \d+$/ }).innerText()
  return Number(/(\d+)$/.exec(label.trim())![1])
}

async function openBrowse(page: Page, query = '') {
  await page.goto(`/learn?mode=browse${query}`)
  await expect(page.getByRole('tab', { name: /^Browse all \d+$/ })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 30_000 }
  )
  await expect(list(page)).toBeVisible()
}

test.describe('Browse all on a 390 px phone', () => {
  test('/learn?mode=browse selects the tab and lists every module as one link', async ({
    page,
  }) => {
    await openBrowse(page)
    const total = await catalogueCount(page)
    expect(total).toBeGreaterThan(50)
    await expect(moduleLinks(page)).toHaveCount(total)
    const hrefs = await moduleLinks(page).evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    expect(new Set(hrefs).size).toBe(total)
    for (const href of hrefs) expect(href).toMatch(/^\/learn\/[a-z0-9-]+$/)
    await expect(page.getByRole('status').filter({ hasText: 'Showing' })).toContainText(
      `Showing ${total} of ${total}`
    )
    await expectNoSidewaysScroll(page, 390)
  })

  test('the assistant link /learn?mode=browse&track=Protocols opens that track, not My Path', async ({
    page,
  }) => {
    await openBrowse(page, '&track=Protocols')
    await expect(page.getByRole('button', { name: /^Protocols · \d+$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    const hrefs = await moduleLinks(page).evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    expect(hrefs.length).toBeGreaterThan(0)
    expect(hrefs.length).toBeLessThan(await catalogueCount(page))
    await expect(list(page).getByRole('heading', { level: 2 })).toHaveCount(1)
    await expect(list(page).getByRole('heading', { level: 2 })).toContainText('Protocols')
  })

  test('a track with an ampersand in its name works from the encoded link', async ({ page }) => {
    await openBrowse(page, '&track=Governance%20%26%20Risk')
    await expect(page.getByRole('button', { name: /^Governance & Risk · \d+$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  test('typing "HSM" narrows the list, and a result opens its module', async ({ page }) => {
    await openBrowse(page)
    const total = await catalogueCount(page)
    await page.getByRole('searchbox', { name: 'Search modules' }).fill('HSM')
    await expect
      .poll(async () => moduleLinks(page).count(), { timeout: 15_000 })
      .toBeLessThan(total)
    expect(await moduleLinks(page).count()).toBeGreaterThan(0)
    await expect(page).toHaveURL(/q=HSM/)
    const first = moduleLinks(page).first()
    const href = await first.getAttribute('href')
    await first.click()
    await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  })

  test('Save keeps a module across a reload, and the Filters sheet narrows to saved modules', async ({
    page,
  }) => {
    await openBrowse(page)
    const firstRow = moduleLinks(page).first().locator('xpath=ancestor::li')
    const savedHref = await moduleLinks(page).first().getAttribute('href')
    await firstRow.getByRole('button', { pressed: false }).click()
    await expect(list(page).getByRole('button', { pressed: true })).toHaveCount(1)

    // A real reload: the saved module is still saved, and it is the same module.
    await page.reload()
    await expect(list(page)).toBeVisible()
    const pressed = list(page).getByRole('button', { pressed: true })
    await expect(pressed).toHaveCount(1)
    await expect(pressed.locator('xpath=ancestor::li').getByRole('link')).toHaveAttribute(
      'href',
      savedHref!
    )

    await page.getByRole('button', { name: /^Filters/ }).click()
    const sheet = page.getByRole('dialog', { name: 'Filters' })
    await expect(sheet.getByLabel('Saved modules only (1)')).toBeVisible()
    await sheet.getByLabel(/^Saved modules only/).check()
    await sheet.getByRole('button', { name: /^Show 1 module$/ }).click()
    await expect(moduleLinks(page)).toHaveCount(1)
    await expect(moduleLinks(page).first()).toHaveAttribute('href', savedHref!)
    await expect(page.getByRole('button', { name: 'Filters (1 active)' })).toBeVisible()
    await expectNoSidewaysScroll(page, 390)
  })

  test('no sideways scrolling with the Filters sheet open or with nothing found', async ({
    page,
  }) => {
    await openBrowse(page)
    await page.getByRole('button', { name: /^Filters/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
    await expectNoSidewaysScroll(page, 390)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('searchbox', { name: 'Search modules' }).fill('zzzznotaword')
    await expect(page.getByText('No modules match your filters.')).toBeVisible()
    await expectNoSidewaysScroll(page, 390)
  })
})

test.describe('The desktop workforce link on a 390 px phone', () => {
  test('/learn?view=nice opens Browse all with the desktop note, not My Path', async ({ page }) => {
    await page.goto('/learn?view=nice')
    await expect(page.getByRole('tab', { name: /^Browse all \d+$/ })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: 30_000 }
    )
    await expect(page.getByRole('tab', { name: 'My Path' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    await expect(page.getByTestId('mobile-learn-nice-note')).toContainText(
      'The workforce (NICE) view is on the desktop site.'
    )
    await expect(moduleLinks(page).first()).toBeVisible()
    await expectNoSidewaysScroll(page, 390)
    // The note belongs to Browse all only: Guided drops it.
    await page.getByRole('tab', { name: 'Guided' }).click()
    await expect(page.getByTestId('mobile-guided-choices')).toBeVisible()
    await expect(page.getByTestId('mobile-learn-nice-note')).toHaveCount(0)
  })
})

test.describe('Browse all on a 320 px phone', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('the list, the track chips and the tab strip stay inside the screen', async ({ page }) => {
    await openBrowse(page)
    await expect(moduleLinks(page).first()).toBeVisible()
    await expectNoSidewaysScroll(page, 320)
    await page.getByRole('tab', { name: 'Guided' }).click()
    await expect(page.getByTestId('mobile-guided-choices')).toBeVisible()
    await expectNoSidewaysScroll(page, 320)
  })
})

test.describe('Guided on a 390 px phone', () => {
  test('/learn?mode=guided: choose a statement, then press the start button', async ({ page }) => {
    await page.goto('/learn?mode=guided')
    await expect(page.getByRole('tab', { name: 'Guided' })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: 30_000 }
    )
    const choices = page.getByTestId('mobile-guided-choices').getByRole('button')
    await expect(choices).toHaveCount(6)
    await expectNoSidewaysScroll(page, 390)

    await choices.first().click()
    const start = page.getByRole('button', { name: /^Start: / })
    await expect(start).toBeVisible()
    await expect(
      page.getByTestId('mobile-guided-answer').getByRole('heading', { level: 2 })
    ).toBeFocused()
    await page.getByText('This phase in other frameworks').click()
    await expectNoSidewaysScroll(page, 390)

    await start.click()
    await expect(page).toHaveURL(/\/learn\/[a-z0-9-]+$/)
  })
})

test.describe('Tabs and keyboard', () => {
  test('arrow keys move between My Path, Browse all and Guided and update the address', async ({
    page,
  }) => {
    await page.goto('/learn')
    const myPath = page.getByRole('tab', { name: 'My Path' })
    await expect(myPath).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })
    await myPath.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /^Browse all/ })).toBeFocused()
    await expect(page).toHaveURL(/mode=browse/)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Guided' })).toBeFocused()
    await expect(page).toHaveURL(/mode=guided/)
    await page.keyboard.press('Home')
    await expect(myPath).toBeFocused()
  })
})

test.describe('Accessibility (axe, serious and critical)', () => {
  const OPTIONS = { runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] } }

  async function expectNoSeriousViolations(page: Page, where: string) {
    await injectAxe(page)
    const violations = await getViolations(page, undefined, OPTIONS)
    const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(
      serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html.slice(0, 140)) })),
      `serious/critical axe violations on ${where}`
    ).toEqual([])
  }

  test('Browse all', async ({ page }) => {
    await openBrowse(page)
    await expect(moduleLinks(page).first()).toBeVisible()
    await expectNoSeriousViolations(page, '/learn?mode=browse')
  })

  test('Browse all with the Filters sheet open', async ({ page }) => {
    await openBrowse(page)
    await page.getByRole('button', { name: /^Filters/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
    await expectNoSeriousViolations(page, 'the Filters sheet')
  })

  test('Browse all from the workforce link, with the desktop note', async ({ page }) => {
    await page.goto('/learn?view=nice')
    await expect(page.getByTestId('mobile-learn-nice-note')).toBeVisible({ timeout: 30_000 })
    await expect(moduleLinks(page).first()).toBeVisible()
    await expectNoSeriousViolations(page, '/learn?view=nice')
  })

  test('Guided, choices and an answer', async ({ page }) => {
    await page.goto('/learn?mode=guided')
    const choices = page.getByTestId('mobile-guided-choices').getByRole('button')
    await expect(choices).toHaveCount(6, { timeout: 30_000 })
    await expectNoSeriousViolations(page, '/learn?mode=guided')
    await choices.first().click()
    await page.getByText('This phase in other frameworks').click()
    await expectNoSeriousViolations(page, 'a guided answer')
  })
})
