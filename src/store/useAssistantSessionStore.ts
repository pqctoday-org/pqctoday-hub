// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The running conversation of the drawer: this visit only. Nothing here is persisted or synced,
 * so what a learner typed never leaves the tab. Each answer keeps its own resources.
 */
import { create } from 'zustand'
import type { AssistantAnswer, AssistantContext } from '@/services/assistant/contract'
import { askAssistant } from '@/components/Assistant/assistantClient'

export type AssistantTurn =
  | { id: string; question: string; status: 'loading' }
  | {
      id: string
      question: string
      status: 'done'
      answer: Exclude<AssistantAnswer, { state: 'data-not-loaded' }>
    }

interface AssistantSessionState {
  turns: AssistantTurn[]
  /** The text in the input box. Kept here so a failed question can be put back. */
  draft: string
  /** The question held after the data did not load. */
  failedQuestion: string | null
  setDraft: (text: string) => void
  ask: (question: string, context: AssistantContext) => Promise<void>
  /** Send the held question again. */
  retry: (context: AssistantContext) => Promise<void>
  reset: () => void
}

let counter = 0
let latestRequest = 0

export const useAssistantSessionStore = create<AssistantSessionState>()((set, get) => ({
  turns: [],
  draft: '',
  failedQuestion: null,

  setDraft: (text) => set({ draft: text }),

  ask: async (rawQuestion, context) => {
    const question = rawQuestion.trim()
    if (!question) return
    const id = `turn-${Date.now()}-${++counter}`
    const request = ++latestRequest
    set((s) => ({
      turns: [...s.turns, { id, question, status: 'loading' }],
      draft: '',
      failedQuestion: null,
    }))
    const answer = await askAssistant(question, context)
    if (request !== latestRequest) return
    if (answer.state === 'data-not-loaded') {
      // Data did not load: no answer and no resources; the question goes back in the box.
      set((s) => ({
        turns: s.turns.filter((t) => t.id !== id),
        draft: question,
        failedQuestion: question,
      }))
      return
    }
    set((s) => ({
      turns: s.turns.map((t) => (t.id === id ? { id, question, status: 'done', answer } : t)),
    }))
  },

  retry: async (context) => {
    const held = get().failedQuestion
    if (!held) return
    await get().ask(held, context)
  },

  reset: () => set({ turns: [], draft: '', failedQuestion: null }),
}))
