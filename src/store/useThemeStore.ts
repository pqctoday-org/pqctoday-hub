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
      storage: createJSONStorage(() => localStorage),
      // Migration: if user has 'system' or old data, default/migrate to light
      migrate: (persistedState: unknown) => {
        // Safe check for object type
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        // If theme was 'system', force it to 'light'
        if (state.theme === 'system') {
          return {
            ...state,
            theme: 'light',
            hasSetPreference: true,
          } as ThemeState
        }
        // If user has old localStorage format without hasSetPreference
        if ('theme' in state && !('hasSetPreference' in state)) {
          return {
            ...state,
            hasSetPreference: true,
          } as ThemeState
        }

        return persistedState as ThemeState
      },
    }
  )
)
