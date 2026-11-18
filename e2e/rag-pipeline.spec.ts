// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { openAssistant } from './fixtures/runAssistantQuestion'

test.describe('ASR Copilot RAG Agent Pipeline', () => {
  test.setTimeout(30000)
  // The PWA service worker installs on first visit and its fetch handler is a
  // catch-all that falls through to `fetch(request)` for cross-origin requests.
  // That means the Gemini call is issued BY THE SERVICE WORKER, not the page —
  // and `page.route` cannot intercept those. The mock below silently did
  // nothing, the real endpoint was hit with the fake key, and it answered 400:
  //
  //   HTTP400 .../v1beta/models/gemini-3.8-flash:streamGenerateContent?key=fake-key&alt=sse
  //
  // i.e. the exact URL the route pattern targets. Blocking service workers for
  // this spec puts the request back on the page, where the mock applies.
  test.use({ serviceWorkers: 'block' })
  test('answers a supported question with a source and declines a question without evidence', async ({
    page,
  }) => {
    let providerRequests = 0

    // Inject the Chat Store setup before the page loads.
    // We set the provider to 'gemini' and inject a fake API key.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: {
            provider: 'gemini',
            apiKey: 'fake-key',
            localModel: 'test',
            localContextWindow: 4096,
            conversations: [
              { id: 'e2e-conv', title: 'E2E', messages: [], createdAt: 0, updatedAt: 0 },
            ],
            model: 'gemini-3.8-flash',
            activeConversationId: 'e2e-conv',
            messages: [],
          },
          version: 13,
        })
      )
      window.localStorage.setItem(
        'pqc-right-panel',
        JSON.stringify({
          // Only `activeTab` is partialized by the store; `isOpen` is not persisted.
          // Match the live store version so no migrate runs.
          state: { activeTab: 'chat' },
          version: 5,
        })
      )
      // Suppress the WhatsNew toast (z-100 alertdialog can intercept clicks).
      window.localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.99.99' }, version: 0 })
      )
    })

    // Intercept RAG corpus with enough evidence to exercise generation and the
    // corpus-only post-generation gate.
    await page.route('**/data/rag-corpus.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chunks: [
            {
              id: 'e2e-ml-kem',
              source: 'algorithms',
              title: 'ML-KEM',
              content: 'ML-KEM is a key-encapsulation mechanism standardized by NIST.',
              deepLink: '/algorithms?highlight=ml-kem',
            },
          ],
          generatedAt: new Date().toISOString(),
        }),
      })
    })

    // Mock the external LLM provider backend to guarantee stateless execution.
    // This allows us to test the entire vector-search / RAG Chunking logic WITHOUT hitting the cloud.
    await page.route('https://generativelanguage.googleapis.com/**', async (route, request) => {
      // Handle CORS preflight
      if (request.method() === 'OPTIONS') {
        return route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        })
      }

      providerRequests++
      const mockAnswer =
        'ML-KEM is a key-encapsulation mechanism standardized by NIST.\n\n' +
        '```citations\n' +
        '[{"claimExcerpt":"ML-KEM is a key-encapsulation mechanism standardized by NIST.","evidenceExcerpt":"ML-KEM is a key-encapsulation mechanism standardized by NIST.","chunkId":"e2e-ml-kem"}]\n' +
        '```'
      const mockStream = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: mockAnswer }] } }] })}\n\n`
      await route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/event-stream',
        },
        body: mockStream,
      })
    })

    await page.goto('/timeline')
    const assistant = await openAssistant(page)
    const input = assistant.getByRole('textbox', { name: 'Message input' })
    const send = assistant.getByRole('button', { name: 'Send message' })
    await input.fill('What is ML-KEM?')
    await send.click()

    await expect(
      assistant.getByText('ML-KEM is a key-encapsulation mechanism standardized by NIST.', {
        exact: true,
      })
    ).toBeVisible({ timeout: 15_000 })
    await expect(assistant.getByText('Explore in PQC Today:', { exact: false })).toBeVisible()
    await expect(assistant.getByRole('link', { name: 'ML-KEM', exact: true })).toHaveAttribute(
      'href',
      '/algorithms?highlight=ml-kem'
    )
    expect(providerRequests).toBe(1)

    await input.fill('What is it?')
    await send.click()
    await expect(
      assistant.getByText('ML-KEM is a key-encapsulation mechanism standardized by NIST.', {
        exact: true,
      })
    ).toHaveCount(2)
    expect(providerRequests).toBe(2)

    await input.fill('zxqvjwkpfrx zjqblwmvrqp zkvfhtjg')
    await send.click()
    await expect(
      assistant.getByText(/I don't have enough information about this topic/)
    ).toBeVisible()
    expect(providerRequests).toBe(2)
    expect(
      await page.evaluate(() =>
        ['__e2e_chat_send', '__e2e_chat_store'].filter((key) => Reflect.has(window, key))
      )
    ).toEqual([])
  })
})
