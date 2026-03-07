// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ComplianceSelectionState {
  /** Framework IDs the user has marked as "My Frameworks" on the compliance page */
  myFrameworks: string[]
  toggleMyFramework: (id: string) => void
  clearMyFrameworks: () => void
  /** Whether the "show only mine" filter is active */
  showOnlyMine: boolean
  setShowOnlyMine: (val: boolean) => void
}

export const useComplianceSelectionStore = create<ComplianceSelectionState>()(
  persist(
    (set) => ({
      myFrameworks: [],
      showOnlyMine: false,

      toggleMyFramework: (id) =>
        set((state) => ({
          myFrameworks: state.myFrameworks.includes(id)
            ? state.myFrameworks.filter((k) => k !== id)
            : [...state.myFrameworks, id],
        })),

      clearMyFrameworks: () => set({ myFrameworks: [] }),

      setShowOnlyMine: (val) => set({ showOnlyMine: val }),
    }),
    {
      name: 'pqc-compliance-selection',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        state.myFrameworks = Array.isArray(state.myFrameworks) ? state.myFrameworks : []
        state.showOnlyMine = state.showOnlyMine ?? false
        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('ComplianceSelection store rehydration failed:', error)
        }
      },
    }
  )
)
