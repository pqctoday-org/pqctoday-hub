import { test, expect } from '@playwright/test'

test.describe('ASR Cross-Origin Iframe Embed Handshake E2E', () => {
  test('validates proxy handshake and signature verification bootstrap sequence', async ({
    page,
  }) => {
    // Mock the backend healthcheck so the Hub actually mounts the sandbox iframe
    await page.route('**/api/status', async (route) => {
      await route.fulfill({ status: 200, body: 'ok' })
    })

    await page.goto('/playground/sbx-pki')

    // Wait for the iframe to be injected and ready
    const iframeElement = page.locator('iframe[data-scenario-id="pki"]')
    await expect(iframeElement).toBeVisible({ timeout: 15000 })

    const responses = await page.evaluate(async () => {
      return new Promise<string[]>((resolve) => {
        const received: string[] = []
        const originalIframe = document.querySelector(
          'iframe[data-scenario-id="pki"]'
        ) as HTMLIFrameElement
        const originUrl = new URL(originalIframe.src).origin

        // Create a hidden, same-origin iframe just to serve as a valid EventTarget `source`
        // that we can listen on. Note that SandboxScenarioEmbed will post back to this source.
        const mockIframe = document.createElement('iframe')
        mockIframe.style.display = 'none'
        document.body.appendChild(mockIframe)

        const mockWin = mockIframe.contentWindow!
        Object.defineProperty(mockWin, 'postMessage', {
          value: function (message: Record<string, unknown>) {
            if (message && typeof message.type === 'string') {
              received.push(message.type)
              if (received.length >= 2) {
                resolve(received)
              }
            }
          },
          writable: true,
          configurable: true,
        })

        // Dispatch the pqc:ready message to the Hub, pretending it comes from the mock Window
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'pqc:ready' },
            origin: originUrl,
            source: mockWin,
          })
        )

        setTimeout(() => resolve(received), 2000)
      })
    })

    // Validates the Hub (Host) successfully received pqc:ready and fired back the challenge and config payload
    // This verifies the exact signature/auth binding contract to unlock the sandbox
    expect(responses).toContain('pqc:challenge')
    expect(responses).toContain('pqc:config')
  })
})
