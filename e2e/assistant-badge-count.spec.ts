import { test, expect } from './fixtures/blockAnalytics'
import { ask, openDrawer, seedHub } from './fixtures/assistantDrawer'

/**
 * "Conversation Starter" is earned by asking the Assistant 10 questions, on a wide screen and on a
 * phone. The device keeps only how many were asked, and that number survives a reload.
 */
const QUESTIONS = [
  'ML-KEM',
  'ML-DSA',
  'SLH-DSA',
  'FN-DSA',
  'HQC',
  'FIPS 203',
  'FIPS 204',
  'FIPS 205',
  'CNSA 2.0',
  'X25519MLKEM768',
]

const VIEWPORTS = [
  { name: 'wide 1440x900', size: { width: 1440, height: 900 } },
  { name: 'phone 390x844', size: { width: 390, height: 844 } },
] as const

/** What the achievement store holds on this device. */
async function deviceCopy(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('pqc-achievements')
    const parsed = raw ? JSON.parse(raw) : { state: {} }
    return {
      raw: raw ?? '',
      count: parsed.state.assistantQuestionCount as number | undefined,
      earned: (parsed.state.unlocked ?? []).map((u: { id: string }) => u.id) as string[],
    }
  })
}

for (const { name, size } of VIEWPORTS) {
  test.describe(`Conversation Starter, ${name}`, () => {
    test.use({ viewport: size })

    test('ten Assistant questions earn the badge, and the count survives a reload', async ({
      page,
    }) => {
      await seedHub(page)
      await page.goto('/learn')
      const drawer = await openDrawer(page)

      // Nine questions: counted, no badge yet.
      for (const q of QUESTIONS.slice(0, 9)) await ask(page, drawer, q)
      await expect.poll(async () => (await deviceCopy(page)).count, { timeout: 10_000 }).toBe(9)
      expect((await deviceCopy(page)).earned).not.toContain('chat-engaged')
      await expect(
        page.getByRole('status', { name: /Achievement unlocked: Conversation Starter/ })
      ).toHaveCount(0)

      // The tenth earns it, with the celebration the other badges get.
      await ask(page, drawer, QUESTIONS[9])
      await expect
        .poll(async () => (await deviceCopy(page)).earned, { timeout: 10_000 })
        .toContain('chat-engaged')
      await expect(
        page.getByRole('status', { name: 'Achievement unlocked: Conversation Starter' })
      ).toBeVisible({ timeout: 15_000 })
      await expect(
        page.getByRole('status', { name: 'Achievement unlocked: Conversation Starter' })
      ).toContainText('Asked the PQC Assistant 10 or more questions')

      // Only a number is kept: no question text on the device.
      const before = await deviceCopy(page)
      expect(before.count).toBe(10)
      for (const q of QUESTIONS) expect(before.raw).not.toContain(q)

      // Reload: the number and the badge are still there, and the next question counts from 10.
      await page.reload()
      const after = await deviceCopy(page)
      expect(after.count).toBe(10)
      expect(after.earned).toContain('chat-engaged')
      const drawerAgain = await openDrawer(page)
      await ask(page, drawerAgain, 'ML-KEM and ML-DSA')
      await expect.poll(async () => (await deviceCopy(page)).count, { timeout: 10_000 }).toBe(11)
    })
  })
}
