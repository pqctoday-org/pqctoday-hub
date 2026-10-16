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
 *
 * `followedTopics` (v3) holds research-topic ids from
 * `research_topics_vocabulary.json` (`RESEARCH_TOPICS[].id`), kept separate from
 * `followedFields` because the two are different vocabularies counted from
 * different library columns. Same plain-string, degrade-gracefully rule.
 */
interface ResearchFieldsState {
  followedFields: string[]
  followedTopics: string[]
  toggleFollowedField: (id: string) => void
  toggleFollowedTopic: (id: string) => void
  clearFollowedFields: () => void
}

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

export const useResearchFieldsStore = create<ResearchFieldsState>()(
  persist(
    (set) => ({
      followedFields: [],
      followedTopics: [],
      toggleFollowedField: (id) => set((s) => ({ followedFields: toggle(s.followedFields, id) })),
      toggleFollowedTopic: (id) => set((s) => ({ followedTopics: toggle(s.followedTopics, id) })),
      clearFollowedFields: () => set({ followedFields: [], followedTopics: [] }),
    }),
    {
      name: 'pqc-research-fields',
      version: 3,
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

        // v3 (2026-10-16): research topics can be followed alongside algorithm
        // families. Existing readers start with no followed topics.
        if (version < 3) {
          state.followedTopics = Array.isArray(state.followedTopics) ? state.followedTopics : []
        }

        // Every version: never hand the app a non-array, whatever was stored.
        if (!Array.isArray(state.followedFields)) state.followedFields = []
        if (!Array.isArray(state.followedTopics)) state.followedTopics = []

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
