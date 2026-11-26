// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Lesson pages end with "Related modules" and then a "Related resources" box: every group starts closed (title and
 * count), and opens on its header button. Three real lessons, on a desktop and a phone viewport:
 * the box and its groups are there, "Show all" expands in place, a document row opens its Library record,
 * "Related modules" is there too, and no hand-typed "Related Resources" block is left.
 */
import { test, expect, type Page } from '@playwright/test'
import { injectAxe, getViolations } from 'axe-playwright'

const LESSONS = ['pki-workshop', 'hybrid-crypto', 'kms-pqc']
const VIEWPORTS = [
  { name: 'desktop 1440x900', width: 1440, height: 900 },
  { name: 'phone 390x844', width: 390, height: 844 },
]

/** First visit: the disclaimer and the "what's new" dialog are already dealt with, and a role is chosen (a phone shows the role picker otherwise). */
async function seedFirstVisit(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({ state: { selectedPersona: 'architect' }, version: 10 })
    )
  })
}

type Box = ReturnType<Page['getByRole']>

const boxOf = (page: Page): Box => page.getByRole('region', { name: 'Related resources' })

/** Opens a group by its header button and returns its list. */
async function openGroup(box: Box, title: string) {
  const header = box.getByRole('button', { name: new RegExp(`^${title}`) })
  await expect(header).toHaveAttribute('aria-expanded', 'false')
  await header.click()
  await expect(header).toHaveAttribute('aria-expanded', 'true')
  return box.getByRole('list', { name: new RegExp(`^${title} \\(\\d+\\)$`) })
}

/** Lets the page finish loading before a test opens anything, so a late re-render cannot undo it. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
}

async function axeInBox(page: Page) {
  await injectAxe(page)
  const violations = await getViolations(page, '[data-testid="lesson-resources"]', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(
    violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => v.id)
  ).toEqual([])
}

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const lesson of LESSONS) {
      test(`/learn/${lesson}: Related resources box, closed groups, then open`, async ({
        page,
      }) => {
        await seedFirstVisit(page)
        await page.goto(`/learn/${lesson}`)
        await settle(page)

        const box = boxOf(page)
        await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
        await expect(box).toBeVisible({ timeout: 30_000 })
        await expect(
          box.getByRole('heading', { level: 2, name: 'Related resources' })
        ).toBeVisible()

        // Related modules is on the page, and the box comes directly after it.
        const modulesHeading = page.getByRole('heading', { name: 'Related modules' })
        await expect(modulesHeading).toBeVisible()
        expect((await box.boundingBox())!.y).toBeGreaterThan(
          (await modulesHeading.boundingBox())!.y
        )

        // No hand-typed block (the generated heading is "Related resources", lower case).
        await expect(
          page.getByRole('heading', { name: 'Related Resources', exact: true })
        ).toHaveCount(0)

        // Every group starts closed: a header with the title and the count, no rows, and the box takes little room.
        const headers = box.locator('h3 > button')
        await expect(headers.first()).toBeVisible()
        await expect(
          box.getByRole('button', { name: /^Documents this lesson draws on \(\d+\)$/ })
        ).toBeVisible()
        const count = await headers.count()
        expect(count).toBeGreaterThanOrEqual(4)
        for (let i = 0; i < count; i++) {
          const h = headers.nth(i)
          await expect(h).toHaveAttribute('aria-expanded', 'false')
          await expect(h).toHaveAttribute('aria-controls', /./)
          expect((await h.boundingBox())!.height).toBeGreaterThanOrEqual(43.5)
          await expect(h).toHaveText(/\(\d+\)$/)
        }
        await expect(box.getByRole('link')).toHaveCount(0)
        await expect(box.getByRole('list')).toHaveCount(0)
        expect((await box.boundingBox())!.height).toBeLessThan(count * 60 + 120)
        await axeInBox(page)

        // Keyboard: Tab visits only the headers (closed rows are not reachable), Enter opens, Space closes.
        await headers.first().focus()
        for (let i = 1; i < count; i++) {
          await page.keyboard.press('Tab')
          await expect(headers.nth(i)).toBeFocused()
        }
        await headers.first().focus()
        await page.keyboard.press('Enter')
        await expect(headers.first()).toHaveAttribute('aria-expanded', 'true')
        await expect(box.getByRole('link').first()).toBeVisible()
        await page.keyboard.press('Space')
        await expect(headers.first()).toHaveAttribute('aria-expanded', 'false')
        await expect(box.getByRole('link')).toHaveCount(0)

        // Open every group: opening one does not close another; axe is clean with all open; links are 44px tall.
        for (let i = 0; i < count; i++) await headers.nth(i).click()
        for (let i = 0; i < count; i++) {
          await expect(headers.nth(i)).toHaveAttribute('aria-expanded', 'true')
        }
        await axeInBox(page)
        for (const link of await box.getByRole('link').all()) {
          expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(43.5)
        }

        // Documents: five shown; Show all expands in place and can be folded back.
        const documents = box.getByRole('list', {
          name: /^Documents this lesson draws on \(\d+\)$/,
        })
        const total = Number(
          /\((\d+)\)/.exec(
            await box.getByRole('button', { name: /^Documents this lesson draws on/ }).innerText()
          )?.[1]
        )
        expect(total).toBeGreaterThan(5)
        await expect(documents.getByRole('link')).toHaveCount(5)
        const showAll = documents.locator('xpath=following-sibling::button')
        await expect(showAll).toHaveText(`Show all ${total}`)
        await expect(showAll).toHaveAttribute('aria-expanded', 'false')
        await showAll.click()
        await expect(documents.getByRole('link')).toHaveCount(total)
        await expect(showAll).toHaveText('Show fewer')
        await showAll.click()
        await expect(documents.getByRole('link')).toHaveCount(5)

        // A document row opens its own Library record: the record's title is in the opened drawer or dialog.
        const first = documents.getByRole('listitem').first()
        const title = (await first.locator('span.block.font-bold').innerText()).trim()
        expect(await first.getByRole('link').getAttribute('href')).toMatch(/^\/library\?ref=/)
        await first.getByRole('link').click()
        await expect(page).toHaveURL(/\/library\?.*ref=/)
        const opened = page.getByRole('dialog').first()
        await expect(opened).toBeVisible({ timeout: 30_000 })
        await expect(opened.getByText(title, { exact: false }).first()).toBeVisible({
          timeout: 30_000,
        })
      })
    }
  })
}

/** Lessons that kept hand links: a filtered Library link, a protocol-matrix link, and one of the trust-hardware lessons. */
const KEPT = [
  { lesson: 'api-security-jwt', filtered: '/library?q=JOSE' },
  { lesson: 'tls-basics', filtered: '/algorithms?tab=support&protocol=tls-1-3' },
  { lesson: 'kms-pqc', filtered: '/learn/arch-quantum-impact?tab=workshop&step=5' },
]

for (const viewport of VIEWPORTS) {
  test.describe(`kept links, ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const { lesson, filtered } of KEPT) {
      test(`/learn/${lesson}: Related lessons and Elsewhere on the Hub`, async ({ page }) => {
        await seedFirstVisit(page)
        await page.goto(`/learn/${lesson}`)
        await settle(page)
        const box = boxOf(page)
        await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
        await expect(box).toBeVisible({ timeout: 30_000 })

        // Both kept groups are closed headers with a count, and show at once.
        await expect(box.getByRole('button', { name: /^Related lessons \(\d+\)$/ })).toBeVisible()
        await expect(
          box.getByRole('button', { name: /^Elsewhere on the Hub \(\d+\)$/ })
        ).toBeVisible()
        const lessons = await openGroup(box, 'Related lessons')
        const pages = await openGroup(box, 'Elsewhere on the Hub')
        // Each kept link carries its kind and, where the lesson gave one, its reason.
        await expect(lessons.getByRole('link').first()).toContainText(/Module|Workshop step/)
        await expect(pages.getByRole('link').first()).toContainText('Page: ')

        // Axe is clean inside the box, and every link is at least 44px tall to tap.
        await axeInBox(page)
        for (const list of [lessons, pages]) {
          for (const link of await list.getByRole('link').all()) {
            expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(43.5)
          }
        }

        // A lesson link opens that lesson.
        const target = lessons.locator('a[href^="/learn/"]:not([href*="?"])').first()
        const targetPath = await target.getAttribute('href')
        await target.click()
        await expect(page).toHaveURL((u) => u.pathname === targetPath)
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

        // The next lesson starts closed again: nothing is remembered between lessons.
        const next = boxOf(page)
        await expect(next.locator('h3 > button').first()).toBeVisible({ timeout: 30_000 })
        await expect(next.locator('h3 > button[aria-expanded="true"]')).toHaveCount(0)
      })

      test(`/learn/${lesson}: the filtered link ${filtered} opens with its filter applied`, async ({
        page,
      }) => {
        await seedFirstVisit(page)
        await page.goto(`/learn/${lesson}`)
        await settle(page)
        const box = boxOf(page)
        await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
        await openGroup(
          box,
          filtered.startsWith('/learn/') ? 'Related lessons' : 'Elsewhere on the Hub'
        )
        const link = box.locator(`a[href="${filtered}"]`)
        await expect(link).toHaveCount(1)
        await link.click()
        await expect(page).toHaveURL((u) => u.pathname + u.search === filtered)

        if (filtered.startsWith('/library?q=')) {
          // The search box holds the filter and a result is about it.
          await expect(page.getByRole('textbox', { name: /^Search/ }).first()).toHaveValue('JOSE', {
            timeout: 30_000,
          })
          await expect(page.getByRole('heading', { name: /JOSE/ }).first()).toBeVisible({
            timeout: 30_000,
          })
        } else if (filtered.startsWith('/algorithms?')) {
          // The protocol's own panel is open.
          await expect(page.getByRole('dialog', { name: 'TLS 1.3' })).toBeVisible({
            timeout: 30_000,
          })
        } else {
          // The trust-hardware step of the other lesson is the step on screen.
          await expect(
            page.getByRole('heading', { name: 'Step 6: Trust Hardware Selector' })
          ).toBeVisible({ timeout: 30_000 })
        }
      })
    }
  })
}

for (const viewport of VIEWPORTS) {
  test.describe(`RFC 10033 and print, ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test("/learn/stateful-signatures: the RFC 10033 link opens the Hub's own Library record", async ({
      page,
    }) => {
      await seedFirstVisit(page)
      await page.goto('/learn/stateful-signatures')
      await settle(page)
      const box = boxOf(page)
      await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
      await openGroup(box, 'Elsewhere on the Hub')
      const link = box
        .getByTestId('lesson-resources-pages')
        .locator('a[href^="/library?ref=RFC-10033"]')
      await expect(link).toHaveCount(1)
      await expect(link).toContainText(
        'RFC 10033: Hash-Based Signatures: State and Backup Management'
      )
      await expect(link).toContainText(
        'Practical guidance on state, backup, and recovery for LMS/XMSS deployments'
      )
      await link.click()
      const opened = page.getByRole('dialog').first()
      await expect(opened).toBeVisible({ timeout: 30_000 })
      await expect(opened.getByText('State and Backup Management').first()).toBeVisible({
        timeout: 30_000,
      })
    })

    test('/learn/stateful-signatures: a glossary term opens the glossary beside the lesson, and Back returns to the lesson', async ({
      page,
    }) => {
      await seedFirstVisit(page)
      await page.goto('/learn/stateful-signatures?tab=learn')
      await settle(page)
      const box = boxOf(page)
      await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
      const terms = await openGroup(box, 'Terms taught here')
      const chip = terms.locator('a[href*="glossary="]').first()
      const href = await chip.getAttribute('href')
      // A real link on the lesson's own address, other parameters kept.
      expect(href).toMatch(/^\/learn\/stateful-signatures\?tab=learn&glossary=/)
      const term = new URL(href!, 'http://hub').searchParams.get('glossary')!
      await chip.click()

      // The lesson stays on screen with the glossary drawer beside it, on that term.
      await expect(page).toHaveURL(
        (u) =>
          u.pathname === '/learn/stateful-signatures' && u.searchParams.get('glossary') === term
      )
      const drawer = page.getByRole('textbox', { name: 'Search glossary terms' })
      await expect(drawer).toBeVisible({ timeout: 30_000 })
      await expect(drawer).toHaveValue(term)
      await expect(boxOf(page)).toBeAttached()

      // Back returns to the lesson without the glossary parameter or the drawer.
      await page.goBack()
      await expect(page).toHaveURL(
        (u) => u.pathname === '/learn/stateful-signatures' && !u.searchParams.has('glossary')
      )
      await expect(page.getByRole('textbox', { name: 'Search glossary terms' })).toHaveCount(0)
    })

    test('/learn/pki-workshop: every group prints open, without the Show all control', async ({
      page,
    }) => {
      await seedFirstVisit(page)
      await page.goto('/learn/pki-workshop')
      await settle(page)
      const box = boxOf(page)
      await expect(box.locator('h3 > button').first()).toBeVisible({ timeout: 30_000 })
      // On screen the groups are closed.
      await expect(box.getByRole('link')).toHaveCount(0)
      await page.emulateMedia({ media: 'print' })
      const lists = box.locator('h3 + div ul')
      const n = await lists.count()
      expect(n).toBeGreaterThanOrEqual(4)
      for (let i = 0; i < n; i++) await expect(lists.nth(i)).toBeVisible()
      await expect(box.locator('h3 + div ul a').first()).toBeVisible()
      await expect(box.getByRole('button', { name: /^Show all/ })).toHaveCount(0)
      for (const b of await box.locator('h3 + div button').all()) await expect(b).toBeHidden()
      await page.emulateMedia({ media: 'screen' })
      await expect(box.getByRole('link')).toHaveCount(0)
    })
  })
}
