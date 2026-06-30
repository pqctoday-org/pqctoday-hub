// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** Snapshot of a single framework's key facts at the time the assessment was completed. */
export interface FrameworkSnapshot {
  id: string
  label: string
  deadline: string
  deadlineYear?: number
}

interface ComplianceSelectionState {
  /** Framework IDs the user has marked as "My Frameworks" on the compliance page */
  myFrameworks: string[]
  toggleMyFramework: (id: string) => void
  addFrameworks: (ids: string[]) => void
  clearMyFrameworks: () => void
  /** Whether the "show only mine" filter is active */
  showOnlyMine: boolean
  setShowOnlyMine: (val: boolean) => void
  /** One-shot flag: frameworks auto-seeded from user's country. Prevents re-adding
   *  on every BC visit after user removes one. */
  hasSeededFromCountry: boolean
  markSeededFromCountry: () => void
  /**
   * Snapshot of selected framework facts taken when the assessment is completed.
   * Used by the Report to detect whether any selected framework's deadline or
   * label has changed since the assessment was generated.
   * Keyed by framework id.
   */
  frameworkSnapshots: Record<string, FrameworkSnapshot>
  snapshotFrameworks: (snapshots: FrameworkSnapshot[]) => void
}

export const useComplianceSelectionStore = create<ComplianceSelectionState>()(
  persist(
    (set) => ({
      myFrameworks: [],
      showOnlyMine: false,
      hasSeededFromCountry: false,
      frameworkSnapshots: {},

      toggleMyFramework: (id) =>
        set((state) => ({
          myFrameworks: state.myFrameworks.includes(id)
            ? state.myFrameworks.filter((k) => k !== id)
            : [...state.myFrameworks, id],
        })),

      addFrameworks: (ids) =>
        set((state) => {
          const existing = new Set(state.myFrameworks)
          const next = [...state.myFrameworks]
          for (const id of ids) {
            if (!existing.has(id)) {
              next.push(id)
              existing.add(id)
            }
          }
          return { myFrameworks: next }
        }),

      clearMyFrameworks: () => set({ myFrameworks: [] }),

      setShowOnlyMine: (val) => set({ showOnlyMine: val }),

      markSeededFromCountry: () => set({ hasSeededFromCountry: true }),

      snapshotFrameworks: (snapshots) =>
        set({
          frameworkSnapshots: Object.fromEntries(snapshots.map((s) => [s.id, s])),
        }),
    }),
    {
      name: 'pqc-compliance-selection',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        state.myFrameworks = Array.isArray(state.myFrameworks) ? state.myFrameworks : []
        state.showOnlyMine = state.showOnlyMine ?? false
        state.hasSeededFromCountry = state.hasSeededFromCountry ?? false
        state.frameworkSnapshots = state.frameworkSnapshots ?? {}
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
