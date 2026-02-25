import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  hasSetPreference: boolean
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light', // Default to light
      hasSetPreference: false,
      setTheme: (theme) => set({ theme, hasSetPreference: true }),
    }),
    {
      name: 'theme-storage-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          // v0 → v1: ensure hasSetPreference exists
          if ('theme' in state && !('hasSetPreference' in state)) {
            state.hasSetPreference = true
          }
          state.hasSetPreference = state.hasSetPreference ?? false
          state.theme = state.theme ?? 'light'
        }

        return state as unknown as ThemeState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Theme store rehydration failed:', error)
        }
      },
    }
  )
)
