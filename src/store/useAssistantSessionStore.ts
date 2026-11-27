// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The running conversation of the drawer: this visit only. Nothing here is persisted or synced,
 * so what a learner typed never leaves the tab. Each answer keeps its own resources. The one thing
 * kept beyond the visit is a count of questions asked (a number in the achievement store, no text).
 */
import { create } from 'zustand'
import type { AssistantAnswer, AssistantContext, AssistantRow } from '@/services/assistant/contract'
import { askAssistant } from '@/components/Assistant/assistantClient'
import { useAchievementStore } from '@/store/useAchievementStore'
import type { CardNav } from '@/components/Assistant/resourceTabs'

export type AssistantTurn =
  | { id: string; question: string; status: 'loading' }
  | {
      id: string
      question: string
      status: 'done'
      answer: Exclude<AssistantAnswer, { state: 'data-not-loaded' }>
    }

/** The record or tool opened in place from an answer's row ("Read here", "Try it here"). */
export interface AssistantViewer {
  row: AssistantRow
  mode: 'record' | 'tool'
  question: string
}

interface AssistantSessionState {
  turns: AssistantTurn[]
  /** The one answer card that is open; the others fold to one line. Null until a question is asked. */
  openTurnId: string | null
  setOpenTurn: (id: string) => void
  /** Each card's own tab and position, for this visit. A card without an entry opens on "Top 5", first resource. */
  cardNav: Record<string, CardNav>
  setCardNav: (id: string, nav: CardNav) => void
  /**
   * What is open in place in the drawer. Kept here, not in the view, so the drawer can show another
   * view (the Glossary, say) and come back to the answer and the record as they were.
   */
  viewer: AssistantViewer | null
  setViewer: (viewer: AssistantViewer | null) => void
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
  openTurnId: null,
  setOpenTurn: (id) => set({ openTurnId: id }),
  cardNav: {},
  setCardNav: (id, nav) => set((s) => ({ cardNav: { ...s.cardNav, [id]: nav } })),
  viewer: null,
  setViewer: (viewer) => set({ viewer }),
  draft: '',
  failedQuestion: null,

  setDraft: (text) => set({ draft: text }),

  ask: async (rawQuestion, context) => {
    const question = rawQuestion.trim()
    if (!question) return
    // The one place every question passes through (typed, suggested, "more questions", handed over
    // by another page, a saved answer reopened). Counted once, as a number only. Sending again the
    // question that just failed to load ("Try again") is the same question: not counted again.
    if (question !== get().failedQuestion) {
      useAchievementStore.getState().recordAssistantQuestion()
    }
    const id = `turn-${Date.now()}-${++counter}`
    const request = ++latestRequest
    set((s) => ({
      turns: [...s.turns, { id, question, status: 'loading' }],
      openTurnId: id,
      draft: '',
      failedQuestion: null,
    }))
    const answer = await askAssistant(question, context)
    if (answer.state === 'data-not-loaded') {
      // Data did not load: no answer and no resources; the question goes back in the box, unless
      // a newer question has been asked since (its own outcome then decides what the box holds).
      set((s) => {
        const turns = s.turns.filter((t) => t.id !== id)
        return {
          turns,
          // The card that opened for this question is gone: the newest remaining card opens instead.
          ...(s.openTurnId === id ? { openTurnId: turns[turns.length - 1]?.id ?? null } : {}),
          ...(request === latestRequest ? { draft: question, failedQuestion: question } : {}),
        }
      })
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

  reset: () =>
    set({
      turns: [],
      openTurnId: null,
      cardNav: {},
      viewer: null,
      draft: '',
      failedQuestion: null,
    }),
}))
