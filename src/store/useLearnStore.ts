// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface LearnState {
  /** Curious-only escape from the curated path back into the full 55-module catalog. */
  showEverything: boolean
  setShowEverything: (value: boolean) => void
  /** Per-persona phase expansion override, keyed by `${personaId}:${checkpointId|'wrap-up'}`. */
  phaseExpansion: Record<string, boolean>
  setPhaseExpanded: (key: string, expanded: boolean) => void
  /** Researcher-only sort override so changing personas doesn't clobber their selection. */
  researcherSortOverride: string | null
  setResearcherSortOverride: (value: string | null) => void
  reset: () => void
}

const defaults: Pick<
  LearnState,
  'showEverything' | 'phaseExpansion' | 'researcherSortOverride'
> = {
  showEverything: false,
  phaseExpansion: {},
  researcherSortOverride: null,
}

export const useLearnStore = create<LearnState>()(
  persist(
    (set) => ({
      ...defaults,
      setShowEverything: (value) => set({ showEverything: value }),
      setPhaseExpanded: (key, expanded) =>
        set((state) => ({ phaseExpansion: { ...state.phaseExpansion, [key]: expanded } })),
      setResearcherSortOverride: (value) => set({ researcherSortOverride: value }),
      reset: () => set({ ...defaults }),
    }),
    {
      name: 'pqc-learn-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          state.showEverything = typeof state.showEverything === 'boolean' ? state.showEverything : false
          state.phaseExpansion =
            typeof state.phaseExpansion === 'object' && state.phaseExpansion !== null
              ? state.phaseExpansion
              : {}
          state.researcherSortOverride =
            typeof state.researcherSortOverride === 'string' ? state.researcherSortOverride : null
        }

        return state as unknown as LearnState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Learn store rehydration failed:', error)
        }
      },
    }
  )
)
