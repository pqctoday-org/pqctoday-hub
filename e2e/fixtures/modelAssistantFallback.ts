// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Page } from '@playwright/test'

interface SavedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

function latestMessage(page: Page): Promise<SavedMessage | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('pqc-chat-storage')
    if (!raw) return null
    const { state } = JSON.parse(raw) as {
      state: {
        activeConversationId: string | null
        conversations: { id: string; messages: SavedMessage[] }[]
      }
    }
    const conversation = state.conversations.find((item) => item.id === state.activeConversationId)
    return conversation?.messages.at(-1) ?? null
  })
}

/**
 * The old model chat is not in the normal path. These helpers are for the model measurement suites
 * only: they switch the hidden rollback on in the browser (the same switch a release can set in the
 * build) and then drive the old chat inside the drawer. Nothing here is used by the default path.
 */
export const MODEL_ASSISTANT_STORAGE_KEY = 'pqc-feature-model-assistant'

/** Switch the old chat on in this browser, before any page script runs. */
export async function enableModelAssistantFallback(page: Page) {
  await page.addInitScript((key) => localStorage.setItem(key, '1'), MODEL_ASSISTANT_STORAGE_KEY)
}

export async function runModelAssistantQuestion(
  page: Page,
  question: string,
  timeout: number
): Promise<{ answer: SavedMessage | null; error: string | null }> {
  const assistant = page.getByRole('region', { name: 'Assistant', exact: true })
  const input = assistant.getByRole('textbox', { name: 'Message input' })
  const alert = assistant.getByRole('alert')
  const previous = await latestMessage(page)
  await input.fill(question)
  await assistant.getByRole('button', { name: 'Send message' }).click()

  let answer: SavedMessage | null = null
  let error: string | null = null
  await expect
    .poll(
      async () => {
        const current = await latestMessage(page)
        if (await alert.isVisible()) error = await alert.textContent()
        if (current?.role === 'assistant' && current.id !== previous?.id) answer = current
        return Boolean(answer || error)
      },
      { timeout }
    )
    .toBe(true)
  return { answer, error }
}

export async function openModelAssistant(page: Page) {
  const open = page.getByRole('button', { name: 'Assistant', exact: true }).first()
  await expect(open).toBeVisible()
  await open.click()
  const drawer = page.getByRole('region', { name: 'Assistant', exact: true })
  await expect(drawer.getByRole('textbox', { name: 'Message input' })).toBeVisible()
  return drawer
}
