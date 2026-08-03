// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * useResearchFieldsStore — persisted state for the Researcher persona's
 * "changed in your fields since last visit" watch
 * (IMPLEMENTATION-PLAN-2026-08-01.md §6). Modeled EXACTLY on
 * `useBookmarkStore.ts`'s pattern per the repo's persistence conventions
 * (CLAUDE.md → "Persistence Conventions"): numeric `version`, a `migrate()`
 * that gives every field a safe default, and an `onRehydrateStorage` crash
 * guard.
 *
 * `followedFields` holds bucket ids from `researchFieldTaxonomy.ts`
 * (`RESEARCH_FIELD_BUCKETS[].id`) — deliberately stored as plain strings, not
 * validated against the taxonomy at read time, so a future taxonomy edit
 * (renaming/removing a bucket id) degrades gracefully to "that field just
 * stops matching any row" rather than corrupting the store.
 */
interface ResearchFieldsState {
  followedFields: string[]
  toggleFollowedField: (id: string) => void
  clearFollowedFields: () => void
}

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

export const useResearchFieldsStore = create<ResearchFieldsState>()(
  persist(
    (set) => ({
      followedFields: [],
      toggleFollowedField: (id) => set((s) => ({ followedFields: toggle(s.followedFields, id) })),
      clearFollowedFields: () => set({ followedFields: [] }),
    }),
    {
      name: 'pqc-research-fields',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          state.followedFields = Array.isArray(state.followedFields) ? state.followedFields : []
        }

        // v2 (2026-08-02): `lastVisitedAt` removed. The field watch it drove
        // compared document publication dates against browsing time and could
        // never return a non-zero count; it now reports against the corpus
        // release window instead, which is the same for every visitor and
        // needs no per-user timestamp. Dropped rather than left orphaned in
        // localStorage.
        if (version < 2) {
          delete state.lastVisitedAt
        }

        return state as unknown as ResearchFieldsState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Research fields store rehydration failed:', error)
        }
      },
    }
  )
)
