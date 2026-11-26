// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { ask, openDrawer, seedHub } from './fixtures/assistantDrawer'

/**
 * A visitor who last came when the old model chat was switched on, with a stored key, a chosen
 * provider and saved conversations. After the update the Assistant opens and answers from the Hub's
 * own records: no set-up screen, no download banner, no key left in the browser, no saved
 * conversation left, and not one request to any host other than the Hub itself.
 */
const KEY = 'AIza-synthetic-key-for-this-test-only'

const OLD_CHAT_STORAGE = {
  state: {
    apiKey: KEY,
    provider: 'old-cloud-provider', // stand-in value, not a product name
    model: 'old-cloud-model', // stand-in value, not a product name
    localModel: 'old-local-model', // stand-in value, not a product name
    localContextWindow: 4096,
    conversations: [
      {
        id: 'conv-old',
        title: 'What is ML-KEM?',
        messages: [
          { id: 'u1', role: 'user', content: 'What is ML-KEM?', timestamp: 1 },
          { id: 'a1', role: 'assistant', content: 'A key encapsulation mechanism.', timestamp: 2 },
        ],
        createdAt: 1,
        updatedAt: 2,
      },
    ],
    activeConversationId: 'conv-old',
  },
  version: 14,
}

for (const [name, viewport] of [
  ['1440x900', { width: 1440, height: 900 }],
  ['390x844', { width: 390, height: 844 }],
] as const) {
  test.describe(`a visitor who had the old model chat on, at ${name}`, () => {
    test.use({ viewport })
    test.setTimeout(90_000)

    test('opens the Assistant, answers from Hub records, keeps no key and makes no outside request', async ({
      page,
      baseURL,
    }) => {
      const origin = new URL(baseURL!).origin
      const everyRequest: string[] = []
      page.on('request', (request) => everyRequest.push(request.url()))

      await seedHub(page)
      await page.addInitScript(
        ([storage]) => {
          // Seed once: a reload must show what the app itself left behind, not the seed again.
          if (sessionStorage.getItem('old-visitor-seeded')) return
          sessionStorage.setItem('old-visitor-seeded', '1')
          localStorage.setItem('pqc-feature-model-assistant', '1')
          localStorage.setItem('pqc-chat-storage', storage)
        },
        [JSON.stringify(OLD_CHAT_STORAGE)]
      )

      await page.goto('/learn')
      // The key is gone as soon as the page has loaded, before the Assistant is even opened.
      await expect(page.getByRole('button', { name: /Assistant|More/ }).first()).toBeVisible({
        timeout: 30_000,
      })
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem('pqc-chat-storage') ?? ''))
        .not.toContain(KEY)
      const drawer = await openDrawer(page)
      const answer = await ask(page, drawer, 'FIPS 203')

      // It answers from the Hub's records: the records that carry that name, as buttons into the Hub.
      await expect(
        answer.getByText('Several Hub records match that name. Choose one.')
      ).toBeVisible()
      await expect(answer.getByRole('button', { name: /FIPS 203 \(ML-KEM\)/ })).toBeVisible()
      expect(await answer.getByRole('listitem').count()).toBeGreaterThan(0)

      // No old chat: no message box, no set-up, no download banner, no key or model wording.
      await expect(page.getByRole('textbox', { name: 'Message input' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0)
      expect(await drawer.innerText()).not.toMatch(
        /API key|WebLLM|Gemini|local model|language model|download|provider|Connect/i
      )

      // Nothing of the old chat is left in the browser: no key, no provider, no saved conversation.
      await page.reload()
      await expect(page.getByRole('button', { name: /Assistant|More/ }).first()).toBeVisible({
        timeout: 30_000,
      })
      const stored = await page.evaluate(() =>
        Object.fromEntries(
          Array.from({ length: localStorage.length }, (_, i) => {
            const k = localStorage.key(i)!
            return [k, localStorage.getItem(k)]
          })
        )
      )
      expect(JSON.stringify(stored)).not.toContain(KEY)
      expect(JSON.stringify(stored)).not.toContain('conv-old')
      const chat = JSON.parse(
        (stored['pqc-chat-storage'] as string | null) ?? '{"state":{},"version":15}'
      )
      expect(chat).toEqual({ state: {}, version: 15 })

      // Not one request left the Hub's own origin during the whole visit.
      const outside = everyRequest.filter(
        (u) => !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith(origin)
      )
      expect(outside).toEqual([])
      expect(everyRequest.length).toBeGreaterThan(10)
    })
  })
}
