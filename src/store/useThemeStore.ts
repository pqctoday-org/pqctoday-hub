import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'dark' | 'light' | 'system'

interface ThemeState {
  theme: Theme
  hasSetPreference: boolean
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      hasSetPreference: false,
      setTheme: (theme) => set({ theme, hasSetPreference: true }),
    }),
    {
      name: 'theme-storage-v1',
      storage: createJSONStorage(() => localStorage),
      // Migration: if user has old data without hasSetPreference, assume they've set it
      migrate: (persistedState: unknown) => {
        if (
          persistedState &&
          typeof persistedState === 'object' &&
          'theme' in persistedState &&
          !('hasSetPreference' in persistedState)
        ) {
          // User has old localStorage format, mark as having set preference
          return {
            ...persistedState,
            hasSetPreference: true,
          } as ThemeState
        }
        return persistedState as ThemeState
      },
    }
  )
)
