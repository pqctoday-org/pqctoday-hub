// SPDX-License-Identifier: AGPL-3.0-only
import type { Locator } from '@playwright/test'
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
  reveal,
  seedHub,
} from './fixtures/assistantDrawer'

/**
 * Answers from the links between products, vendors, certifications, trusted sources and Library documents, the home lesson of a
 * record, and the questions that follow an answer about one of them. Each relation is asked at 1,440 px and on a 390 px phone.
 */

const RELATIONS: { name: string; question: string; value: RegExp; from: RegExp }[] = [
  {
    name: 'who makes a product',
    question: 'Who makes 1Password?',
    value: /^1Password Inc\.$/,
    from: /Product: 1Password/,
  },
  {
    name: 'which products a vendor makes',
    question: 'Which products does Microsoft Corporation make?',
    value: /^([^;]+; ){5}and \d+ more$/,
    from: /Vendor: Microsoft Corporation/,
  },
  {
    name: 'which certifications a product holds',
    question: 'Which certifications does Nuvoton Cryptographic Library 3.0 hold?',
    value: /^ACVP #A5276: Nuvoton Technology Corporation, .*; FIPS 140-3 #5098/,
    from: /Product: Nuvoton Cryptographic Library 3\.0/,
  },
  {
    name: 'what a certification covers',
    question: 'What does ACVP #A5276 certify?',
    value: /^Nuvoton Cryptographic Library 3\.0$/,
    from: /Certification: ACVP #A5276/,
  },
  {
    name: 'who a certification was issued to',
    question: 'Who was ACVP #A5276 issued to?',
    value: /^Nuvoton Technology Corporation$/,
    from: /Certification: ACVP #A5276/,
  },
  {
    name: 'who published a document',
    question: 'Who is the publisher of PKCS #11 Specification Version 3.2 (OASIS Standard)?',
    value: /^OASIS$/,
    from: /PKCS #11 Specification Version 3\.2 \(OASIS Standard\)/,
  },
  {
    name: 'which documents a source published',
    question: 'Which documents did U.S. Nuclear Regulatory Commission publish?',
    value: /^10 CFR 73\.54 .*; Regulatory Guide 5\.71/,
    from: /U\.S\. Nuclear Regulatory Commission/,
  },
]

for (const [name, viewport] of [
  ['1440 px', { width: 1440, height: 900 }],
  ['a 390 px phone', PHONE],
] as const) {
  test.describe(`Answers from the links, ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })
    for (const r of RELATIONS) {
      test(`${r.name}: a direct answer with its source`, async ({ page }) => {
        await seedHub(page)
        await page.goto('/library')
        const drawer = await openDrawer(page)
        const answer = await ask(page, drawer, r.question)
        const direct = answer.getByRole('group', { name: 'Direct answer' })
        await expect(direct).toBeVisible()
        await expect(direct.locator('p, div').filter({ hasText: r.value }).first()).toBeVisible()
        await expect(answer.getByText(r.from).first()).toBeVisible()
      })
    }

    test('a vendor answer leads its resources with the products it names', async ({ page }) => {
      await seedHub(page)
      await page.goto('/library')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, 'Which products does Microsoft Corporation make?')
      const panel = await openTab(answer, /^Products, \d+ resources?$/)
      await expect(panel).toHaveAttribute('data-tag', /^PRD:/)
    })
  })
}

async function openFirstWith(answer: Locator, selector: string): Promise<Locator> {
  return reveal(answer, answer.locator(selector))
}

for (const [name, viewport] of [
  ['1440 px', { width: 1440, height: 900 }],
  ['a 390 px phone', PHONE],
] as const) {
  test.describe(`The home lesson of a record, ${name}`, () => {
    test.use({ viewport, serviceWorkers: 'block' })

    test('a product shows "Lesson: <title>", and the link opens the lesson with the way back to the answer', async ({
      page,
    }) => {
      await seedHub(page)
      await page.goto('/library')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, 'Who makes 1Password?')
      const link = await openFirstWith(answer, '[data-home-lesson]')
      await expect(link).toHaveText(/^Lesson: .+/)
      const title = (await link.textContent())!.replace(/^Lesson: /, '').trim()
      await link.click()
      await expect(page).toHaveURL(/\/learn\//)
      await expect(
        page.getByRole('button', { name: isPhone(page) ? /^Back to / : 'Back to your answer' })
      ).toBeVisible({
        timeout: 30_000,
      })
      expect(title.length).toBeGreaterThan(3)
    })

    test('a lesson row has none, and the opened record shows its own', async ({ page }) => {
      await seedHub(page)
      await page.goto('/library')
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, 'What is harvest now, decrypt later?')
      const learn = await openTab(answer, /^Learn, \d+ resources?$/)
      await expect(learn.locator('[data-home-lesson]')).toHaveCount(0)
      // the glossary term is read here; it belongs to Quantum Threats, a lesson other than the one that teaches it
      const read = await reveal(
        answer,
        answer.getByRole('button', { name: /^Read here: Harvest/i })
      )
      await read.click()
      await expect(
        drawerOf(page).getByRole('button', { name: 'Lesson: Quantum Threats', exact: true }).first()
      ).toBeVisible()
    })
  })
}

test.describe('Questions that follow an answer', () => {
  test.use({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })

  test('after an answer about a product, "Who makes <product>?" is the main suggestion and is answered directly', async ({
    page,
  }) => {
    await seedHub(page)
    await page.goto('/library')
    const drawer = await openDrawer(page)
    await ask(page, drawer, 'What is Nuvoton Cryptographic Library 3.0?')
    const group = drawer.getByRole('group', { name: 'Suggested questions' })
    await expect(group.getByRole('button').first()).toHaveText(
      'Who makes Nuvoton Cryptographic Library 3.0?'
    )
    await group.getByRole('button').first().click()
    const next = answerOf(drawer, 'Who makes Nuvoton Cryptographic Library 3.0?')
    await expect(next.getByRole('group', { name: 'Direct answer' })).toContainText(
      'Nuvoton Technology Corporation'
    )
  })

  test('a lesson title that begins with "The" reads as a title in the prerequisite question, and is answered', async ({
    page,
  }) => {
    await seedHub(page)
    await page.addInitScript(() => {
      if (localStorage.getItem('pqc-journey') !== null) return
      const step = (id: string, n: number, tag: string) => ({
        id,
        position: n,
        kind: 'module',
        resourceTag: tag,
        required: true,
        origin: { type: 'match' },
      })
      const o = {
        id: 'a',
        role: 'architect',
        goal: 'Review our TLS migration design',
        state: 'active',
        steps: [step('a-1', 1, 'LM-008')],
        checkpoint: { path: ['journey', 'objectives'], stepId: null },
        createdAt: 1,
        updatedAt: 1,
      }
      localStorage.setItem(
        'pqc-journey',
        JSON.stringify({
          version: 2,
          state: { objectives: { a: o }, order: ['a'], focus: { architect: 'a' }, completions: {} },
        })
      )
    })
    await page.goto('/compliance')
    const drawer = await openDrawer(page)
    const question =
      'What is the lesson “The PQC Algorithms: How They Work and How to Choose” about?'
    const button = drawer
      .getByRole('group', { name: 'Suggested questions' })
      .getByRole('button', { name: question })
    await expect(button).toBeVisible()
    await button.click()
    await expect(answerOf(drawer, question).getByRole('tabpanel')).toBeVisible({ timeout: 30_000 })
  })
})

/** The drawer with a direct answer from a link, a card with its home lesson link, and the opened record: no axe violations. */
for (const theme of ['light', 'dark'] as const) {
  for (const [name, viewport] of [
    ['1280 px wide', { width: 1280, height: 800 }],
    ['390 px phone', PHONE],
  ] as const) {
    test.describe(`Accessibility of the new answers, ${theme}, ${name}`, () => {
      test.use({ viewport, serviceWorkers: 'block' })
      test('a link answer with its lesson link, and the opened record, have no violations', async ({
        page,
      }) => {
        await seedHub(page, { theme })
        await page.goto('/library')
        const drawer = await openDrawer(page)
        const scan = async (state: string) => {
          await page.waitForTimeout(500)
          const violations = await getViolations(page, '[data-assistant-layout]', {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
            },
          })
          expect(
            violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html.slice(0, 120)) })),
            `axe violations in the "${state}" state`
          ).toEqual([])
        }
        const answer = await ask(page, drawer, 'Who makes 1Password?')
        await reveal(answer, answer.locator('[data-home-lesson]'))
        await injectAxe(page)
        await scan('a link answer with its lesson link')
        const second = await ask(page, drawer, 'What is harvest now, decrypt later?')
        const read = await reveal(
          second,
          second.getByRole('button', { name: /^Read here: Harvest/i })
        )
        await read.click()
        await expect(
          drawerOf(page)
            .getByRole('button', { name: /^Lesson: / })
            .first()
        ).toBeVisible()
        await scan('the opened record with its lesson link')
      })
    })
  }
}
