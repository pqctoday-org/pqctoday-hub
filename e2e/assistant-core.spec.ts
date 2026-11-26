// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import {
  WIDE,
  answerOf,
  ask,
  drawerOf,
  openDrawer,
  returnControl,
  seedHub,
  trackForeignRequests,
} from './fixtures/assistantDrawer'

/**
 * The core of the Assistant drawer, small and fast enough for the pull-request gate: ask and get an answer,
 * save it, go to its page and come back, and the old model chat is not reachable. The whole drawer is
 * covered in `assistant-drawer.spec.ts`, which runs in the full suite.
 */
const FACT = 'When is the CNSA 2.0 deadline?'

test.describe('Assistant drawer, core', () => {
  test.use({ viewport: WIDE })

  test.beforeEach(async ({ page }) => {
    await seedHub(page)
    await page.goto('/learn')
  })

  test('a question gets an answer from the Hub records, with its evidence and resources', async ({
    page,
    baseURL,
  }) => {
    const foreign = trackForeignRequests(page, baseURL!)
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, FACT)
    await expect(answer.getByRole('group', { name: 'Direct answer' })).toContainText('2031')
    await expect(answer.getByRole('group', { name: 'Hub resources in this answer' })).toBeVisible()
    expect(foreign, 'the Assistant makes no request to another host').toEqual([])
  })

  test('Save answer keeps the answer in My work and keeps keyboard focus on the button', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, FACT)
    const save = answer.getByRole('button', { name: 'Save answer' })
    await save.focus()
    await page.keyboard.press('Enter')
    const saved = answer.getByRole('button', { name: 'Saved to My work' })
    await expect(saved).toBeFocused()
    await expect(saved).toHaveAttribute('aria-disabled', 'true')
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('pqc-my-work')
      return raw ? (JSON.parse(raw).state.answers as { question: string }[]) : []
    })
    expect(stored.map((a) => a.question)).toEqual([FACT])
  })

  test('Go to page opens the page, and Back to your answer is clicked with a real pointer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, FACT)
    await answer.getByRole('button', { name: 'Go to page: CNSA 2.0', exact: true }).click()
    await expect(page).toHaveURL(/\/compliance\?framework=CNSA-2/)
    await expect(page.getByRole('dialog', { name: /CNSA 2\.0/ })).toBeVisible({ timeout: 30_000 })
    const back = returnControl(page)
    await expect(back).toHaveAccessibleName('Back to your answer')
    const box = await back.boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await expect(page).toHaveURL(/\/learn/)
    await expect(answerOf(drawerOf(page), FACT)).toBeVisible()
  })

  test('there is no model chat: no set-up, no key, no model request', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (request) => requested.push(request.url()))
    const drawer = await openDrawer(page)
    await ask(page, drawer, 'What is ML-KEM?')
    await expect(page.getByRole('tablist', { name: /Tools drawer|Assistant/i })).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: 'Message input' })).toHaveCount(0)
    expect(await drawer.innerText()).not.toMatch(
      /API key|WebLLM|Gemini|local model|language model/i
    )
    expect(requested.filter((u) => /web-?llm|\/mlc|generativelanguage/i.test(u))).toEqual([])
  })
})
