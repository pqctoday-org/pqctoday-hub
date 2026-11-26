// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'
import { test, expect } from './fixtures/blockAnalytics'
import { PHONE, WIDE, seedHub } from './fixtures/assistantDrawer'

/**
 * What changed in the lessons of an objective since it was built (design note A06 and A07): the four kinds of
 * change to a lesson (new section, new tool, section updated, tool updated), "Curriculum changed" for a new
 * required step, and a retired step with its replacement. The objectives are seeded as they would be stored
 * by an earlier visit, so each state is driven by real Hub data: an old record of what the objective was built on,
 * and a lesson tag the Hub has retired.
 */

const TLS = 'LM-008'

/** The sections the Hub lists for TLS Basics, read from the same data the page is built from. */
function tlsSections(): string[] {
  const core = JSON.parse(readFileSync('public/data/knowledge-core.json', 'utf8')) as {
    records: { id: string; kind: string; parent?: string }[]
  }
  return core.records
    .filter((r) => r.kind === 'module section' && r.parent === TLS)
    .map((r) => r.id.slice(`${TLS}/s:`.length))
}
const SECTIONS = tlsSections()

const step = (id: string, n: number, tag: string, extra: Record<string, unknown> = {}) => ({
  id,
  position: n,
  kind: 'module',
  resourceTag: tag,
  required: true,
  origin: { type: 'match' },
  ...extra,
})
const outcome = (n: number) => ({
  id: `o-s${n}`,
  position: n,
  kind: 'self-assessed',
  resourceTag: 'o/outcome',
  required: true,
  origin: { type: 'match' },
})
const objective = (steps: unknown[], extra: Record<string, unknown> = {}) => ({
  id: 'o',
  role: 'architect',
  goal: 'Review our TLS migration design',
  state: 'active',
  steps,
  checkpoint: { path: ['journey', 'objectives'], stepId: null },
  createdAt: 1,
  updatedAt: 1,
  ...extra,
})

/** Built on an older curriculum: one section, one tool and two prerequisites it does not have, a tool on an older version, and the lesson on version 0. */
const OLD_REVISION = objective([step('o-s1', 1, TLS), outcome(2)], {
  builtOn: {
    origin: 'created',
    revision: 'learn_modules_10012026_r1.csv + tools_10012026_r1.csv',
    prerequisites: { [TLS]: [] },
    lessons: {
      [TLS]: {
        version: 0,
        sections: SECTIONS.slice(1),
        tools: { 'tls-simulator': '0.9.0', 'sbx-tls': null },
      },
    },
    at: 1,
  },
})

/** A step on a lesson the Hub retired (LM-032), with a completion and a comment filed under it. */
const RETIRED = objective([step('o-s1', 1, 'LM-001'), step('o-s2', 2, 'LM-032'), outcome(3)], {
  builtOn: {
    origin: 'created',
    revision: 'learn_modules_10012026_r1.csv + tools_10012026_r1.csv',
    prerequisites: { 'LM-001': [] },
    lessons: { 'LM-001': { version: 99, sections: [], tools: {} } },
    at: 1,
  },
})

/** A step on a tag the Hub does not list at all. */
const UNKNOWN = objective([step('o-s1', 1, 'LM-999'), outcome(2)])

const comment = (id: string, tag: string, body: string, contentVersion: number) => ({
  id,
  tag,
  anchorKind: tag.includes('/s:') ? 'section' : 'module',
  body,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  contentVersion,
  edited: false,
})

async function seedJourney(
  page: Page,
  o: Record<string, unknown>,
  comments: ReturnType<typeof comment>[] = [],
  completions: Record<string, unknown> = {}
) {
  await page.addInitScript(
    ([objectiveJson, commentsJson, completionsJson]) => {
      const run = (key: string, version: number, state: unknown) => {
        // The first load only: a reload keeps what the learner did in the page.
        if (localStorage.getItem(key) === null) {
          localStorage.setItem(key, JSON.stringify({ version, state }))
        }
      }
      const o = JSON.parse(objectiveJson)
      run('pqc-journey', 2, {
        objectives: { o },
        order: ['o'],
        focus: { architect: 'o' },
        completions: JSON.parse(completionsJson),
      })
      run('pqc-my-work', 1, {
        comments: JSON.parse(commentsJson),
        outputs: [],
        answers: [],
        references: [],
      })
    },
    [JSON.stringify(o), JSON.stringify(comments), JSON.stringify(completions)] as const
  )
}

/** A second page in the same browser with its own seeded journey: the first page's stored journey is cleared first. */
async function anotherPage(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('pqc-journey')
    localStorage.removeItem('pqc-my-work')
  })
  return page.context().newPage()
}

const changes = (page: Page) => page.getByTestId('objective-changes')
const cards = (page: Page) => changes(page).getByTestId('objective-change')
const barText = (page: Page) => page.getByTestId('journey-step-bar')

for (const [name, viewport] of [
  ['wide screen', WIDE],
  ['390 px phone', PHONE],
] as const) {
  test.describe(`Changes in an objective on a ${name}`, () => {
    test.use({ viewport })

    test('an objective built on an older curriculum names each kind of change, in words, and changes nothing by itself', async ({
      page,
    }) => {
      await seedHub(page)
      await seedJourney(page, OLD_REVISION, [
        comment('c1', `${TLS}/s:${SECTIONS[0]}`, 'check the handshake text', 0),
      ])
      await page.goto('/learn?mode=journey')
      await expect(page.getByTestId('objective-workspace')).toBeVisible({ timeout: 30_000 })

      for (const label of ['New section', 'New tool', 'Lesson revised', 'Tool updated']) {
        await expect(cards(page).getByText(label, { exact: true }).first()).toBeVisible()
      }
      await expect(cards(page).getByText(/This section may not have changed\./)).toBeVisible()
      await expect(cards(page).getByText('Curriculum changed', { exact: true })).toHaveCount(2)
      // Each one links to the section or the tool.
      await expect(
        cards(page)
          .filter({ hasText: 'New section' })
          .getByRole('link', { name: /^Open / })
      ).toHaveAttribute('href', new RegExp(`/learn/tls-basics\\?section=${SECTIONS[0]}$`))
      await expect(
        cards(page)
          .filter({ hasText: 'Tool updated' })
          .getByRole('link', { name: /^Open / })
      ).toHaveAttribute('href', '/playground/tls-simulator')
      // The path is the one the learner built: two steps, and the new lessons are not in it.
      await expect(barText(page)).toContainText('Step 1 of 2')

      // Mark seen: that card goes, the others stay, and it stays gone after a reload.
      const section = cards(page).filter({ hasText: 'New section' })
      await section.getByRole('button', { name: 'Mark seen' }).click()
      await expect(section).toHaveCount(0)
      await expect(changes(page).getByRole('status')).toContainText('marked seen')
      await page.reload()
      await expect(page.getByTestId('objective-workspace')).toBeVisible({ timeout: 30_000 })
      await expect(cards(page).filter({ hasText: 'New section' })).toHaveCount(0)
      // The tools it was built with are not new; the ones it was built without are.
      await expect(cards(page).filter({ hasText: 'New tool' }).first()).toBeVisible()
      await expect(
        cards(page).filter({ hasText: 'New tool' }).filter({ hasText: 'TLS 1.3 Simulator' })
      ).toHaveCount(0)
      await expect(barText(page)).toContainText('Step 1 of 2')
    })

    test('"Curriculum changed": Keep my path changes nothing, Add it adds the step only when pressed', async ({
      page,
    }) => {
      await seedHub(page)
      await seedJourney(page, OLD_REVISION)
      await page.goto('/learn?mode=journey')
      await expect(page.getByTestId('objective-workspace')).toBeVisible({ timeout: 30_000 })
      const required = cards(page).filter({ hasText: 'Curriculum changed' })
      await expect(required).toHaveCount(2)
      await expect(required.first()).toContainText('now lists')
      await expect(required.first()).toContainText('Nothing has changed in your objective')

      await required.first().getByRole('button', { name: 'Keep my path' }).click()
      await expect(required).toHaveCount(1)
      await expect(barText(page)).toContainText('Step 1 of 2')

      await required.first().getByRole('button', { name: 'Add it to my objective' }).click()
      await expect(required).toHaveCount(0)
      await expect(barText(page)).toContainText('of 3')
      await expect(changes(page).getByRole('status')).toContainText('was added before')
    })

    test('a completed objective shows its completion date and is reopened only by the learner', async ({
      page,
    }) => {
      await seedHub(page)
      await seedJourney(page, {
        ...OLD_REVISION,
        state: 'completed',
        completedAt: new Date(2026, 9, 2, 12).getTime(),
      })
      await page.goto('/learn?mode=journey')
      await expect(page.getByTestId('objective-workspace')).toBeVisible({ timeout: 30_000 })
      const required = cards(page).filter({ hasText: 'Curriculum changed' }).first()
      await expect(required).toContainText('You completed this objective on 2 October 2026')
      await expect(
        page.getByTestId('objective-workspace').getByRole('button', { name: 'Reopen', exact: true })
      ).toBeVisible()
      await required.getByRole('button', { name: 'Add it and reopen the objective' }).click()
      await expect(
        page.getByTestId('objective-workspace').getByRole('button', { name: 'Pause' })
      ).toBeVisible()
    })

    test('a retired step names the former lesson, the reason and the date, and the swap keeps the learner’s work', async ({
      page,
    }) => {
      await seedHub(page)
      await seedJourney(page, RETIRED, [comment('c2', 'LM-032', 'my note on the old lesson', 1)], {
        'LM-032': { tag: 'LM-032', kind: 'completed', source: 'self', at: 5 },
      })
      await page.goto('/learn?mode=journey')
      await expect(page.getByTestId('objective-workspace')).toBeVisible({ timeout: 30_000 })
      const card = cards(page).filter({ hasText: 'Retired step' })
      await expect(card).toHaveCount(1)
      await expect(card).toContainText('IoT & OT Security was retired on 1 October 2026')
      await expect(card.getByRole('button', { name: /^Swap in / })).toBeVisible()
      // Nothing was swapped on its own.
      await expect(barText(page).getByRole('button', { name: /^IoT & OT Security/ })).toBeVisible()

      await card.getByRole('button', { name: /^Swap in / }).click()
      await expect(card).toHaveCount(0)
      await expect(barText(page).getByRole('button', { name: /^IoT & OT Security/ })).toHaveCount(0)
      await expect(barText(page).getByRole('button', { name: /^IoT .*Embedded/ })).toBeVisible()
      await expect(changes(page).getByRole('status')).toContainText('is now this step')

      // The comment on the retired lesson is still filed under the objective.
      await page.goto('/learn?mode=journey&jview=my-work')
      await expect(page.getByText('my note on the old lesson')).toBeVisible({ timeout: 30_000 })
      const stored = await page.evaluate(() => {
        const j = JSON.parse(localStorage.getItem('pqc-journey') ?? '{}').state
        return {
          former: j.objectives.o.steps.find((s: { id: string }) => s.id === 'o-s2').formerTags,
          kept: j.completions['LM-032']?.at,
        }
      })
      expect(stored).toEqual({ former: ['LM-032'], kept: 5 })
    })

    test('the retired step’s own page shows the same notice; a tag the Hub does not list keeps its wording', async ({
      page,
    }) => {
      await seedHub(page)
      await seedJourney(page, RETIRED)
      await page.goto('/learn?mode=journey&objective=o&step=o-s2')
      const stepPage = page.getByTestId('step-page')
      await expect(stepPage).toBeVisible({ timeout: 30_000 })
      await expect(stepPage.getByText('Retired step', { exact: true }).first()).toBeVisible()
      await expect(stepPage).toContainText('This step was retired')

      const other = await anotherPage(page)
      await seedHub(other)
      await seedJourney(other, UNKNOWN)
      await other.goto('/learn?mode=journey&objective=o&step=o-s1')
      await expect(other.getByTestId('step-page')).toContainText(
        'This step is not in the catalogue any more'
      )
      await expect(other.getByTestId('objective-change')).toHaveCount(0)
    })

    test('Updates lists the same changes, with the count on its tab', async ({ page }) => {
      await seedHub(page)
      await seedJourney(page, OLD_REVISION)
      await page.goto('/learn?mode=journey&jview=updates')
      const list = page.getByTestId('objective-changes-list')
      await expect(list).toBeVisible({ timeout: 30_000 })
      await expect(list.getByText('New tool', { exact: true }).first()).toBeVisible()
      await expect(list.getByRole('heading', { name: /Changes in your objectives/ })).toContainText(
        /\(\d+ new\)/
      )
      await expect(page.getByRole('tab', { name: /^Updates · \d+/ })).toBeVisible()
    })
  })
}

for (const theme of ['light', 'dark'] as const) {
  for (const [name, viewport] of [
    ['1280 px wide', WIDE],
    ['390 px phone', PHONE],
  ] as const) {
    test.describe(`Accessibility of the change notices, ${theme}, ${name}`, () => {
      test.use({ viewport })

      const scan = async (page: Page, selector: string, state: string) => {
        await injectAxe(page)
        await page.waitForTimeout(300)
        const violations = await getViolations(page, selector, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
          },
        })
        expect(
          violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.html.slice(0, 100)),
          })),
          `axe violations in the "${state}" state`
        ).toEqual([])
      }

      test('every state has no axe violations', async ({ page }) => {
        test.setTimeout(120_000)
        await seedHub(page, { theme })
        await seedJourney(page, OLD_REVISION, [
          comment('c1', `${TLS}/s:${SECTIONS[0]}`, 'check the handshake text', 0),
        ])
        await page.goto('/learn?mode=journey')
        await expect(cards(page).first()).toBeVisible({ timeout: 30_000 })
        await scan(page, '[data-testid="objective-changes"]', 'curriculum changes on the objective')
        await page.goto('/learn?mode=journey&jview=updates')
        await expect(page.getByTestId('objective-changes-list')).toBeVisible({ timeout: 30_000 })
        await scan(page, '[data-testid="objective-changes-list"]', 'curriculum changes in Updates')

        const retired = await anotherPage(page)
        await seedHub(retired, { theme })
        await seedJourney(retired, RETIRED)
        await retired.goto('/learn?mode=journey')
        await expect(retired.getByTestId('objective-change').first()).toBeVisible({
          timeout: 30_000,
        })
        await scan(retired, '[data-testid="objective-changes"]', 'retired step on the objective')
        await retired.goto('/learn?mode=journey&objective=o&step=o-s2')
        await expect(retired.getByTestId('step-page')).toBeVisible({ timeout: 30_000 })
        await scan(retired, '[data-testid="step-page"]', 'retired step page')
      })
    })
  }
}
