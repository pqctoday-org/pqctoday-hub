// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Chat citation tier chip — visual end-to-end (C7).
 *
 * Strategy: pre-seed the chat store with a fixture conversation containing
 * one assistant message whose sourceRefs already carry a known trustTier.
 * We bypass actual chat retrieval (which requires the Gemini API + WebLLM
 * setup) by seeding the message directly. This isolates the binding under
 * test: the CitationTierChip's aria-label must reflect the data.
 *
 * The unit test in src/components/Chat/__tests__/CitationTierChip.binding.test.tsx
 * covers the component-level binding; this spec covers the rendered DOM in a
 * real browser after the right-panel + chat-panel mount cycle.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Suppress the WhatsNew alertdialog so it doesn't intercept clicks.
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // Suppress the bottom-pinned disclaimer banner — it can intercept clicks.
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 1 })
    )

    // Seed right-panel tab to 'chat' (isOpen is not persisted, so we still
    // need to click the FAB to open).
    localStorage.setItem(
      'pqc-right-panel',
      JSON.stringify({ state: { activeTab: 'chat' }, version: 5 })
    )

    // Seed chat-storage with one conversation containing an assistant message
    // whose sourceRefs carry trustTier='Authoritative'. The schema version is
    // 8 (matches useChatStore migrate target).
    localStorage.setItem(
      'pqc-chat-storage',
      JSON.stringify({
        state: {
          apiKey: 'fake-test-key',
          provider: 'gemini',
          localModel: '',
          localContextWindow: 4096,
          model: 'gemini-2.5-flash',
          activeConversationId: 'e2e-c7',
          conversations: [
            {
              id: 'e2e-c7',
              title: 'C7 fixture',
              createdAt: 1_700_000_000_000,
              updatedAt: 1_700_000_000_000,
              messages: [
                {
                  id: 'u1',
                  role: 'user',
                  content: 'What is ML-KEM?',
                  timestamp: 1_700_000_000_000,
                },
                {
                  id: 'a1',
                  role: 'assistant',
                  content:
                    'ML-KEM is the NIST-standardized post-quantum key-encapsulation mechanism (FIPS 203).',
                  timestamp: 1_700_000_000_500,
                  sourceRefs: [
                    {
                      title: 'FIPS 203 — Module-Lattice-Based KEM Standard',
                      source: 'library',
                      deepLink: '/library?ref=NIST-FIPS-203',
                      trustTier: 'Authoritative',
                    },
                  ],
                },
              ],
            },
          ],
        },
        version: 8,
      })
    )
  })
})

test('citation chip renders with the seeded trustTier on the assistant message', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Open the right-panel chat via the FAB. The button is always rendered when
  // isOpen=false (which is the default — isOpen isn't persisted).
  await page.getByRole('button', { name: 'Open PQC Assistant' }).click()

  // Assistant message text proves the conversation rehydrated.
  await expect(page.getByText(/ML-KEM is the NIST-standardized/)).toBeVisible({ timeout: 5_000 })

  // The sources list is collapsed by default — expand it.
  await page.getByRole('button', { name: /^1 source$/ }).click()

  // The chip is a sibling of the source title — assert by accessible label.
  const chip = page.getByLabel('Trust tier: Authoritative')
  await expect(chip).toBeVisible()
  // Glyph is the first letter of the tier name.
  await expect(chip).toHaveText('A')
})
