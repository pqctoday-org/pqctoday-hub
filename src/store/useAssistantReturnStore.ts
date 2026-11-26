// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Where "Back to your answer" goes after a row opened a page. In memory only.
 */
import { create } from 'zustand'

export interface AssistantReturnTarget {
  /** Route and query the learner came from. */
  path: string
  /** Plain name of that page, for "Back to <page>" on a phone. */
  label: string
  /**
   * The history entry the learner was on when the row was used. The first entry after it is the
   * row's own navigation: if that stays on the same page (a link to the page the learner is on, a
   * hash-only link), nothing was opened and there is no return.
   */
  fromKey: string
  /** The accessible name of the row action that opened the page, so focus can go back to it. */
  origin?: string
}

interface AssistantReturnState {
  target: AssistantReturnTarget | null
  /** The page the row opened, once it has been reached. */
  landedPath: string | null
  begin: (target: AssistantReturnTarget) => void
  land: (path: string) => void
  clear: () => void
}

export const useAssistantReturnStore = create<AssistantReturnState>()((set) => ({
  target: null,
  landedPath: null,
  begin: (target) => set({ target, landedPath: null }),
  land: (path) => set({ landedPath: path }),
  clear: () => set({ target: null, landedPath: null }),
}))
