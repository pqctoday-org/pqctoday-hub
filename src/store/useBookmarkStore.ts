// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface BookmarkState {
  libraryBookmarks: string[] // referenceId values
  migrateBookmarks: string[] // softwareName values

  toggleLibraryBookmark: (id: string) => void
  toggleMigrateBookmark: (name: string) => void
  isLibraryBookmarked: (id: string) => boolean
  isMigrateBookmarked: (name: string) => boolean
  clearAll: () => void
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      libraryBookmarks: [],
      migrateBookmarks: [],

      toggleLibraryBookmark: (id) =>
        set((state) => ({
          libraryBookmarks: state.libraryBookmarks.includes(id)
            ? state.libraryBookmarks.filter((b) => b !== id)
            : [...state.libraryBookmarks, id],
        })),

      toggleMigrateBookmark: (name) =>
        set((state) => ({
          migrateBookmarks: state.migrateBookmarks.includes(name)
            ? state.migrateBookmarks.filter((b) => b !== name)
            : [...state.migrateBookmarks, name],
        })),

      isLibraryBookmarked: (id) => get().libraryBookmarks.includes(id),
      isMigrateBookmarked: (name) => get().migrateBookmarks.includes(name),

      clearAll: () => set({ libraryBookmarks: [], migrateBookmarks: [] }),
    }),
    {
      name: 'pqc-bookmarks',
      version: 1,
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
