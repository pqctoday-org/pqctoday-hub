// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Lesson pages end with "Related modules" and then a generated "Related resources" box (terms, documents and
 * industry use cases from the Hub's knowledge file). Three real lessons, on a desktop and a phone viewport:
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

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const lesson of LESSONS) {
      test(`/learn/${lesson}: Related resources box after Related modules, no hand-typed block`, async ({
        page,
      }) => {
        await seedFirstVisit(page)
        await page.goto(`/learn/${lesson}`)

        const box = page.getByRole('region', { name: 'Related resources' })
        await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
        await expect(box).toBeVisible({ timeout: 30_000 })

        // Related modules is on the page, and the box comes directly after it.
        const modulesHeading = page.getByRole('heading', { name: 'Related modules' })
        await expect(modulesHeading).toBeVisible()
        const modulesY = (await modulesHeading.boundingBox())!.y
        const boxY = (await box.boundingBox())!.y
        expect(boxY).toBeGreaterThan(modulesY)

        // No hand-typed block (the generated heading is "Related resources", lower case).
        await expect(
          page.getByRole('heading', { name: 'Related Resources', exact: true })
        ).toHaveCount(0)

        // The groups this lesson has records for.
        const documents = box.getByRole('list', {
          name: /^Documents this lesson draws on \(\d+\)$/,
        })
        await expect(documents).toBeVisible()
        const heading = await box
          .getByTestId('lesson-resources-documents')
          .getByRole('heading')
          .innerText()
        const total = Number(/\((\d+)\)/.exec(heading)?.[1])
        expect(total).toBeGreaterThan(5)
        await expect(documents.getByRole('link')).toHaveCount(5)
        await expect(
          box.getByRole('list', { name: /^Industry use cases covered \(\d+\)$/ })
        ).toBeVisible()

        // No serious or critical accessibility violation inside the box (names, contrast, tap targets are checked by hand).
        await injectAxe(page)
        const violations = await getViolations(page, '[data-testid="lesson-resources"]', {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        })
        expect(
          violations
            .filter((v) => v.impact === 'critical' || v.impact === 'serious')
            .map((v) => v.id)
        ).toEqual([])

        // Every link in the visible groups is at least 44px tall to tap.
        for (const link of await box.getByRole('link').all()) {
          expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(43.5)
        }

        // Show all expands in place and can be folded back.
        const showAll = box.getByRole('button', { name: `Show all ${total}` })
        await expect(showAll).toHaveAttribute('aria-expanded', 'false')
        await showAll.click()
        await expect(documents.getByRole('link')).toHaveCount(total)
        await expect(box.getByRole('button', { name: 'Show fewer' }).first()).toHaveAttribute(
          'aria-expanded',
          'true'
        )
        await box.getByRole('button', { name: 'Show fewer' }).first().click()
        await expect(documents.getByRole('link')).toHaveCount(5)

        // A document row opens its own Library record: the record's title is in the opened drawer or dialog.
        const first = documents.getByRole('listitem').first()
        const title = (await first.locator('span.block.font-bold').innerText()).trim()
        const href = await first.getByRole('link').getAttribute('href')
        expect(href).toMatch(/^\/library\?ref=/)
        await first.getByRole('link').click()
        await expect(page).toHaveURL(/\/library\?.*ref=/)
        const opened = page.getByRole('dialog').first()
        await expect(opened).toBeVisible()
        await expect(opened.getByText(title, { exact: false }).first()).toBeVisible()
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
        const box = page.getByRole('region', { name: 'Related resources' })
        await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
        await expect(box).toBeVisible({ timeout: 30_000 })

        const lessons = box.getByRole('list', { name: /^Related lessons \(\d+\)$/ })
        const pages = box.getByRole('list', { name: /^Elsewhere on the Hub \(\d+\)$/ })
        await expect(lessons).toBeVisible()
        await expect(pages).toBeVisible()
        // Each kept link carries its kind and, where the lesson gave one, its reason.
        await expect(lessons.getByRole('link').first()).toContainText(/Module|Workshop step/)
        await expect(pages.getByRole('link').first()).toContainText('Page: ')

        // Axe is clean inside the box, and every link is at least 44px tall to tap.
        await injectAxe(page)
        const violations = await getViolations(page, '[data-testid="lesson-resources"]', {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        })
        expect(
          violations
            .filter((v) => v.impact === 'critical' || v.impact === 'serious')
            .map((v) => v.id)
        ).toEqual([])
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
      })

      test(`/learn/${lesson}: the filtered link ${filtered} opens with its filter applied`, async ({
        page,
      }) => {
        await seedFirstVisit(page)
        await page.goto(`/learn/${lesson}`)
        const box = page.getByRole('region', { name: 'Related resources' })
        await box.scrollIntoViewIfNeeded({ timeout: 30_000 })
        const link = box.locator(`a[href="${filtered}"]`)
        await expect(link).toHaveCount(1)
        await link.click()
        await expect(page).toHaveURL((u) => u.pathname + u.search === filtered)

        if (filtered.startsWith('/library?q=')) {
          // The search box holds the filter and a result is about it.
          await expect(page.getByRole('textbox', { name: /^Search/ }).first()).toHaveValue('JOSE')
          await expect(page.getByRole('heading', { name: /JOSE/ }).first()).toBeVisible()
        } else if (filtered.startsWith('/algorithms?')) {
          // The protocol's own panel is open.
          await expect(page.getByRole('dialog', { name: 'TLS 1.3' })).toBeVisible()
        } else {
          // The trust-hardware step of the other lesson is the step on screen.
          await expect(
            page.getByRole('heading', { name: 'Step 6: Trust Hardware Selector' })
          ).toBeVisible()
        }
      })
    }
  })
}
