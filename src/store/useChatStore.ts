// SPDX-License-Identifier: AGPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * What is left of the old chat store: the one-question hand-off to the Assistant ("Ask the
 * Assistant" buttons set a question, the Assistant picks it up when its drawer is open).
 *
 * The model chat that used to live here is gone. So is everything it saved in the browser: its
 * conversations, its provider, model and download settings and any key a visitor had stored. The
 * version-15 migration below removes them the first time an updated page loads, quietly. Nothing is
 * persisted any more; the stored entry is kept only so that migration can run and rewrite it empty.
 */
interface ChatState {
  pendingQuestion: string | null
  setPendingQuestion: (question: string | null) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      pendingQuestion: null,
      setPendingQuestion: (question) => set({ pendingQuestion: question }),
    }),
    {
      name: 'pqc-chat-storage',
      version: 15,
      storage: createJSONStorage(() => localStorage),
      partialize: () => ({}),
      // Whatever an earlier version stored (conversations, the active conversation, provider,
      // models, download state, an API key) is discarded, whatever the version or the shape.
      migrate: () => ({}),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('Chat store rehydration failed:', error)
      },
    }
  )
)
