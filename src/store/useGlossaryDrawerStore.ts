// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Which term the drawer's Glossary view opens on, and whether it was reached from an Assistant
 * answer (then it offers "Back to your answer"). In memory only. `token` changes with every request,
 * so the view starts afresh on each new term.
 */
import { create } from 'zustand'

interface GlossaryDrawerState {
  focusTerm: string | null
  fromAnswer: boolean
  token: number
  focus: (term: string, opts?: { fromAnswer?: boolean }) => void
  clear: () => void
}

export const useGlossaryDrawerStore = create<GlossaryDrawerState>()((set) => ({
  focusTerm: null,
  fromAnswer: false,
  token: 0,
  focus: (term, opts) =>
    set((s) => ({ focusTerm: term, fromAnswer: opts?.fromAnswer === true, token: s.token + 1 })),
  clear: () => set({ focusTerm: null, fromAnswer: false }),
}))
