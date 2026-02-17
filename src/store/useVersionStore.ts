import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Injected by Vite at build time from package.json version
declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

interface VersionState {
  currentVersion: string
  lastSeenVersion: string | null
  hasSeenCurrentVersion: () => boolean
  markVersionSeen: () => void
  resetForTesting: () => void
}

export const useVersionStore = create<VersionState>()(
  persist(
    (set, get) => ({
      currentVersion: APP_VERSION,
      lastSeenVersion: null,

      hasSeenCurrentVersion: () => {
        const { currentVersion, lastSeenVersion } = get()
        return lastSeenVersion === currentVersion
      },

      markVersionSeen: () => {
        const { currentVersion } = get()
        set({ lastSeenVersion: currentVersion })
      },

      resetForTesting: () => {
        set({ lastSeenVersion: null })
      },
    }),
    {
      name: 'pqc-version-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist lastSeenVersion, not the current version
      partialize: (state) => ({ lastSeenVersion: state.lastSeenVersion }),
    }
  )
)

// Export current version for use elsewhere
export const getCurrentVersion = () => APP_VERSION
