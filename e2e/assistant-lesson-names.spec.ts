// SPDX-License-Identifier: AGPL-3.0-only
import type { Locator } from '@playwright/test'
import { test, expect } from './fixtures/blockAnalytics'
import { ask, openDrawer, openTab, seedHub } from './fixtures/assistantDrawer'

/**
 * What the learner reads in the drawer for three kinds of question: a lesson is offered under its own name
 * (never under the name of a test that runs in it), a question of one word the Hub teaches is answered with
 * that subject, and a greeting still gets the introduction.
 */

test.use({ viewport: { width: 1440, height: 900 } })

const LEARN = /^Learn, \d+ resources?$/

/** The tag and text of every resource of the open tab, in the order Next shows them. */
async function resourcesOf(answer: Locator): Promise<{ tag: string; text: string }[]> {
  const panel = answer.getByRole('tabpanel')
  const next = answer.getByRole('button', { name: /^(Next resource|No more resources)/ })
  const seen: { tag: string; text: string }[] = []
  for (let i = 0; i < 30; i++) {
    seen.push({ tag: (await panel.getAttribute('data-tag')) ?? '', text: await panel.innerText() })
    if ((await next.getAttribute('aria-disabled')) === 'true') break
    await next.click()
  }
  return seen
}

test.describe('Assistant: lessons under their own name', () => {
  test.beforeEach(async ({ page }) => {
    await seedHub(page, { persona: null })
    await page.goto('/learn')
  })

  test('a question about a lesson offers the lesson by name', async ({ page }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, 'Is there a module on TLS?')
    const panel = await openTab(answer, LEARN)
    await expect(panel).toContainText('TLS Basics')
    await expect(panel).toContainText('Module')
    const learn = await resourcesOf(answer)
    expect(learn.length).toBeGreaterThan(1)
    for (const r of learn) {
      expect(r.tag, 'no test record stands in for a lesson').not.toMatch(/^KAT:/)
      expect(r.text, 'no test step name is shown as a title').not.toMatch(/\bstep_\d+_/)
    }
  })

  test('the first resources of an answer are never test records', async ({ page }) => {
    const drawer = await openDrawer(page)
    for (const question of [
      'What is ML-KEM?',
      'What is crypto agility?',
      'explain quantum threats',
    ]) {
      const answer = await ask(page, drawer, question)
      await expect(answer.getByRole('tabpanel')).toBeVisible()
      for (const r of await resourcesOf(answer)) {
        expect(r.tag, question).not.toMatch(/^KAT:/)
        expect(r.text, question).not.toMatch(/\bstep_\d+_/)
      }
    }
  })

  test('one word the Hub teaches is answered with that subject, and a greeting with the introduction', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const subject = await ask(page, drawer, '5g')
    await expect(await openTab(subject, LEARN)).toContainText('5G Security')
    const greeting = await ask(page, drawer, 'hello')
    await expect(await openTab(greeting, LEARN)).toContainText('PQC 101')
  })
})
