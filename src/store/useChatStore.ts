// SPDX-License-Identifier: AGPL-3.0-only
import { create } from 'zustand'

/**
 * The one-question hand-off to the Assistant: "Ask the Assistant" buttons set a question, the
 * Assistant picks it up when its drawer is open. It lives in memory only and is never saved.
 *
 * The model chat that used to live here is gone, and so is everything it saved in the browser; that
 * stored entry is removed on every page load by `utils/legacyChatCleanup`, not by this store.
 */
interface ChatState {
  pendingQuestion: string | null
  setPendingQuestion: (question: string | null) => void
}

export const useChatStore = create<ChatState>()((set) => ({
  pendingQuestion: null,
  setPendingQuestion: (question) => set({ pendingQuestion: question }),
}))
