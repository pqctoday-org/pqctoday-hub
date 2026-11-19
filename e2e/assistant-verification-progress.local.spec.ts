// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { openAssistant } from './fixtures/runAssistantQuestion'
import { getViolations, injectAxe } from 'axe-playwright'

const unsupported = 'The fictional training deployment is already approved.'

for (const width of [1280, 390]) {
  test(`Assistant publishes only the checked response at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript((unsupportedClaim) => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: {
            apiKey: 'fictional-test-provider-key',
            provider: 'gemini',
            model: 'gemini-3.8-flash',
            activeConversationId: null,
            conversations: [],
          },
          version: 14,
        })
      )

      const underlyingFetch = window.fetch.bind(window)
      let calls = 0
      window.fetch = (input, init) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (!url.startsWith('https://generativelanguage.googleapis.com/'))
          return underlyingFetch(input, init)

        const body = JSON.parse(String(init?.body ?? '{}')) as {
          systemInstruction?: { parts?: { text?: string }[] }
        }
        const prompt = body.systemInstruction?.parts?.[0]?.text ?? ''
        const sources = Array.from(
          prompt.matchAll(
            /^--- Source: (\S+) \| (.+?) \| id: (\S+) ---\n(?:Deep Link: (\S+)\n)?/gm
          ),
          (m) => ({ kind: m[1], title: m[2], id: m[3], link: m[4] ?? '' })
        )
        const matched = sources.find((source) => /\/library\?ref=.*203\b/i.test(source.link))
        const source = matched ?? sources.find((item) => item.link.startsWith('/algorithms'))
        if (!source)
          return Promise.resolve(
            new Response('A test expected a retrieved algorithm or standard record.', {
              status: 400,
            })
          )

        calls += 1
        const first = calls === 1
        const text = first ? unsupportedClaim : source.title
        const citations = [
          { claimExcerpt: text, evidenceExcerpt: first ? ' ' : source.title, chunkId: source.id },
        ]
        const encoder = new TextEncoder()
        const frame = (piece: string) =>
          encoder.encode(
            `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: piece }] } }] })}\n\n`
          )
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(frame(text))
            document.documentElement.dataset.testProviderDraft = first ? 'unsupported' : 'supported'
            if (!first) {
              document.documentElement.dataset.testCorpusTitle = source.title
              document.documentElement.dataset.testCorpusLink = source.link
            }
            window.addEventListener(
              'test-complete-assistant-stream',
              () => {
                controller.enqueue(
                  frame(`\n\n\`\`\`citations\n${JSON.stringify(citations)}\n\`\`\`\n`)
                )
                controller.close()
              },
              { once: true }
            )
          },
        })
        return Promise.resolve(
          new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
        )
      }
    }, unsupported)
    await page.goto('/algorithms')
    const assistant = await openAssistant(page)
    const input = assistant.getByRole('textbox', { name: 'Message input' })
    const send = assistant.getByRole('button', { name: 'Send message' })
    const assistantElement = await assistant.elementHandle()
    expect(assistantElement).not.toBeNull()
    await page.waitForTimeout(350)
    await injectAxe(page)
    const initialViolations = await getViolations(page, assistantElement!, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(initialViolations).toEqual([])
    const progress = assistant
      .getByRole('status')
      .filter({ hasText: 'Checking sources before showing the answer' })
    const draftStarted = page.locator('html')
    const finish = () =>
      page.evaluate(() => window.dispatchEvent(new Event('test-complete-assistant-stream')))

    await input.fill('What is ML-KEM in FIPS 203?')
    await input.press('Tab')
    await expect(send).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(draftStarted).toHaveAttribute('data-test-provider-draft', 'unsupported', {
      timeout: 35_000,
    })
    await expect(progress).toBeVisible()
    await expect(assistant.getByText(unsupported, { exact: true })).toHaveCount(0)

    const responseViolations = await getViolations(page, assistantElement!, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(responseViolations).toEqual([])
    await finish()
    await expect(
      assistant.getByText(/most relevant entries retrieved from the PQC Today corpus/)
    ).toBeVisible()
    await expect(assistant.getByText(unsupported, { exact: true })).toHaveCount(0)

    await input.fill('Find the algorithm and publication for FIPS 203 ML-KEM')
    await send.click()
    await expect(draftStarted).toHaveAttribute('data-test-provider-draft', 'supported', {
      timeout: 35_000,
    })
    const title = await draftStarted.getAttribute('data-test-corpus-title')
    const href = await draftStarted.getAttribute('data-test-corpus-link')
    expect(title).toBeTruthy()
    expect(href).toBeTruthy()
    await expect(progress).toBeVisible()
    await finish()
    await expect(progress).toHaveCount(0)
    await expect(assistant.getByText(title!, { exact: true }).last()).toBeVisible()
    await expect(assistant.locator(`a[href="${href}"]`).last()).toBeVisible()
    await expect(assistant.getByRole('button', { name: 'Copy response' }).last()).toBeVisible()
    await expect(assistant.getByText(unsupported, { exact: true })).toHaveCount(0)
  })
}
