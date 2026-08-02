// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CommandCenterOnboardingState {
  hasSeenExecWalkthrough: boolean
  dismissExecWalkthrough: () => void
}

/** First-time-only gate for the executive "Board pack in 3 steps" walkthrough
 * on /business (design_handoff_2026_pages/IMPLEMENTATION-PLAN-COMMAND-CENTER-
 * 2026-08-01.md §3.1, user decision: "simple 3 steps for first-time use only"). */
export const useCommandCenterOnboardingStore = create<CommandCenterOnboardingState>()(
  persist(
    (set) => ({
      hasSeenExecWalkthrough: false,
      dismissExecWalkthrough: () => set({ hasSeenExecWalkthrough: true }),
    }),
    {
      name: 'pqc-command-center-onboarding-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ hasSeenExecWalkthrough: state.hasSeenExecWalkthrough }),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}
        if (version < 1) {
          state.hasSeenExecWalkthrough =
            typeof state.hasSeenExecWalkthrough === 'boolean' ? state.hasSeenExecWalkthrough : false
        }
        return state as { hasSeenExecWalkthrough: boolean }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Command Center onboarding store rehydration failed:', error)
        }
      },
    }
  )
)
