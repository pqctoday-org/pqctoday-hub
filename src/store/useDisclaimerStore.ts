// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Injected by Vite at build time from package.json version
declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

/** Extract the leading major version number (e.g. "2.44.3" → 2). */
export function parseMajorVersion(version: string): number {
  const match = version.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

const APP_MAJOR = parseMajorVersion(APP_VERSION)

interface DisclaimerState {
  acknowledgedMajorVersion: number | null
  hasAcknowledgedCurrentMajor: () => boolean
  acknowledgeDisclaimer: () => void
  resetForTesting: () => void
}

export const useDisclaimerStore = create<DisclaimerState>()(
  persist(
    (set, get) => ({
      acknowledgedMajorVersion: null,

      hasAcknowledgedCurrentMajor: () => {
        return get().acknowledgedMajorVersion === APP_MAJOR
      },

      acknowledgeDisclaimer: () => {
        set({ acknowledgedMajorVersion: APP_MAJOR })
      },

      resetForTesting: () => {
        set({ acknowledgedMajorVersion: null })
      },
    }),
    {
      name: 'pqc-disclaimer-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ acknowledgedMajorVersion: state.acknowledgedMajorVersion }),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}
        if (version < 1) {
          state.acknowledgedMajorVersion =
            typeof state.acknowledgedMajorVersion === 'number'
              ? state.acknowledgedMajorVersion
              : null
        }
        return state as { acknowledgedMajorVersion: number | null }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Disclaimer store rehydration failed:', error)
        }
      },
    }
  )
)

export const getAppMajorVersion = () => APP_MAJOR
