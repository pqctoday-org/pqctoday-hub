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

export async function runAssistantQuestion(
  page: Page,
  question: string,
  timeout: number
): Promise<{ answer: SavedMessage | null; error: string | null }> {
  const assistant = page.getByRole('dialog', { name: 'PQC Assistant' })
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

export async function openAssistant(page: Page) {
  const open = page.getByRole('button', { name: 'Open PQC Assistant', exact: true })
  const more = page.getByRole('button', { name: 'More', exact: true })
  await expect(open.or(more).first()).toBeVisible()
  if (await open.isVisible()) {
    await open.click()
  } else {
    await more.click()
    await page.getByRole('button', { name: /Assistant Ask a question about this page/ }).click()
  }
  return page.getByRole('dialog', { name: 'PQC Assistant' })
}
