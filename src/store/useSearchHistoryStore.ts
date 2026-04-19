// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SearchHistoryState {
  recentQueries: string[]
  pushQuery: (query: string) => void
  clearHistory: () => void
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recentQueries: [],

      pushQuery: (query) =>
        set((s) => {
          const trimmed = query.trim()
          if (!trimmed) return s
          const filtered = s.recentQueries.filter((q) => q !== trimmed)
          return { recentQueries: [trimmed, ...filtered].slice(0, 10) }
        }),

      clearHistory: () => set({ recentQueries: [] }),
    }),
    {
      name: 'pqc-search-history',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as Record<string, unknown>
        s.recentQueries = Array.isArray(s.recentQueries) ? s.recentQueries : []
        return s
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('useSearchHistoryStore rehydrate error', error)
      },
    }
  )
)
