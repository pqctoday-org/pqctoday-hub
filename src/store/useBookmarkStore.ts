// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { logBookmarkToggle } from '@/utils/analytics'

interface BookmarkState {
  // ── Library ──────────────────────────────────────────────────────────────
  libraryBookmarks: string[] // referenceId values
  toggleLibraryBookmark: (id: string) => void
  isLibraryBookmarked: (id: string) => boolean
  showOnlyLibraryBookmarks: boolean
  setShowOnlyLibraryBookmarks: (val: boolean) => void

  // ── Migrate (legacy deep-link bookmarks — kept for backwards compat) ──────
  migrateBookmarks: string[] // softwareName values
  toggleMigrateBookmark: (name: string) => void
  isMigrateBookmarked: (name: string) => boolean

  // ── Learn ─────────────────────────────────────────────────────────────────
  myLearnModules: string[] // moduleId values
  toggleMyLearnModule: (id: string) => void
  clearMyLearnModules: () => void
  showOnlyLearnModules: boolean
  setShowOnlyLearnModules: (val: boolean) => void

  // ── Timeline ──────────────────────────────────────────────────────────────
  myTimelineCountries: string[] // countryName values
  toggleMyTimelineCountry: (name: string) => void
  clearMyTimelineCountries: () => void
  showOnlyTimelineCountries: boolean
  setShowOnlyTimelineCountries: (val: boolean) => void

  // ── Threats ───────────────────────────────────────────────────────────────
  myThreats: string[] // threatId values
  toggleMyThreat: (id: string) => void
  clearMyThreats: () => void
  showOnlyThreats: boolean
  setShowOnlyThreats: (val: boolean) => void

  // ── Playground ────────────────────────────────────────────────────────────
  myPlaygroundTools: string[] // tool.id values
  toggleMyPlaygroundTool: (id: string) => void
  clearMyPlaygroundTools: () => void
  showOnlyPlaygroundTools: boolean
  setShowOnlyPlaygroundTools: (val: boolean) => void

  // ── Global ────────────────────────────────────────────────────────────────
  clearAll: () => void
}

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      // Library
      libraryBookmarks: [],
      toggleLibraryBookmark: (id) => {
        const action = get().libraryBookmarks.includes(id) ? 'remove' : 'add'
        set((s) => ({ libraryBookmarks: toggle(s.libraryBookmarks, id) }))
        logBookmarkToggle('library', id, action)
      },
      isLibraryBookmarked: (id) => get().libraryBookmarks.includes(id),
      showOnlyLibraryBookmarks: false,
      setShowOnlyLibraryBookmarks: (val) => set({ showOnlyLibraryBookmarks: val }),

      // Migrate (legacy)
      migrateBookmarks: [],
      toggleMigrateBookmark: (name) => {
        const action = get().migrateBookmarks.includes(name) ? 'remove' : 'add'
        set((s) => ({ migrateBookmarks: toggle(s.migrateBookmarks, name) }))
        logBookmarkToggle('migrate', name, action)
      },
      isMigrateBookmarked: (name) => get().migrateBookmarks.includes(name),

      // Learn
      myLearnModules: [],
      toggleMyLearnModule: (id) => {
        const action = get().myLearnModules.includes(id) ? 'remove' : 'add'
        set((s) => ({ myLearnModules: toggle(s.myLearnModules, id) }))
        logBookmarkToggle('learn', id, action)
      },
      clearMyLearnModules: () => set({ myLearnModules: [], showOnlyLearnModules: false }),
      showOnlyLearnModules: false,
      setShowOnlyLearnModules: (val) => set({ showOnlyLearnModules: val }),

      // Timeline
      myTimelineCountries: [],
      toggleMyTimelineCountry: (name) =>
        set((s) => ({ myTimelineCountries: toggle(s.myTimelineCountries, name) })),
      clearMyTimelineCountries: () =>
        set({ myTimelineCountries: [], showOnlyTimelineCountries: false }),
      showOnlyTimelineCountries: false,
      setShowOnlyTimelineCountries: (val) => set({ showOnlyTimelineCountries: val }),

      // Threats
      myThreats: [],
      toggleMyThreat: (id) => set((s) => ({ myThreats: toggle(s.myThreats, id) })),
      clearMyThreats: () => set({ myThreats: [], showOnlyThreats: false }),
      showOnlyThreats: false,
      setShowOnlyThreats: (val) => set({ showOnlyThreats: val }),

      // Playground
      myPlaygroundTools: [],
      toggleMyPlaygroundTool: (id) =>
        set((s) => ({ myPlaygroundTools: toggle(s.myPlaygroundTools, id) })),
      clearMyPlaygroundTools: () => set({ myPlaygroundTools: [], showOnlyPlaygroundTools: false }),
      showOnlyPlaygroundTools: false,
      setShowOnlyPlaygroundTools: (val) => set({ showOnlyPlaygroundTools: val }),

      // Global clear
      clearAll: () =>
        set({
          libraryBookmarks: [],
          migrateBookmarks: [],
          showOnlyLibraryBookmarks: false,
          myLearnModules: [],
          showOnlyLearnModules: false,
          myTimelineCountries: [],
          showOnlyTimelineCountries: false,
          myThreats: [],
          showOnlyThreats: false,
          myPlaygroundTools: [],
          showOnlyPlaygroundTools: false,
        }),
    }),
    {
      name: 'pqc-bookmarks',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          state.libraryBookmarks = Array.isArray(state.libraryBookmarks)
            ? state.libraryBookmarks
            : []
          state.migrateBookmarks = Array.isArray(state.migrateBookmarks)
            ? state.migrateBookmarks
            : []
        }
        if (version < 2) {
          // v1 → v2: add all new page bookmark arrays + showOnly flags
          state.showOnlyLibraryBookmarks = false
          state.myLearnModules = Array.isArray(state.myLearnModules) ? state.myLearnModules : []
          state.showOnlyLearnModules = false
          state.myTimelineCountries = Array.isArray(state.myTimelineCountries)
            ? state.myTimelineCountries
            : []
          state.showOnlyTimelineCountries = false
          state.myThreats = Array.isArray(state.myThreats) ? state.myThreats : []
          state.showOnlyThreats = false
          state.myPlaygroundTools = Array.isArray(state.myPlaygroundTools)
            ? state.myPlaygroundTools
            : []
          state.showOnlyPlaygroundTools = false
        }

        return state as unknown as BookmarkState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Bookmark store rehydration failed:', error)
        }
      },
    }
  )
)
