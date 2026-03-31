// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type MigrateViewMode = 'stack' | 'cards' | 'table'

interface MigrateSelectionState {
  /** Row keys ('softwareName::categoryId') that the user has hidden */
  hiddenProducts: string[]
  hideProduct: (key: string) => void
  /** Unhide specific keys (e.g. all keys belonging to a layer) */
  restoreLayerProducts: (keysToRestore: string[]) => void
  restoreAll: () => void
  /** Selected infrastructure layer (InfrastructureLayerType stored as string) */
  activeLayer: string
  /** Selected sub-category chip */
  activeSubCategory: string
  setActiveLayer: (layer: string) => void
  setActiveSubCategory: (cat: string) => void
  /** Row keys ('softwareName::categoryId') the user has marked as "My Products" */
  myProducts: string[]
  toggleMyProduct: (key: string) => void
  clearMyProducts: () => void
  /** Active view mode for the migrate catalog */
  viewMode: MigrateViewMode
  setViewMode: (mode: MigrateViewMode) => void
  /** Whether the MigrationWorkflow hero section is collapsed */
  workflowCollapsed: boolean
  setWorkflowCollapsed: (collapsed: boolean) => void
}

export const useMigrateSelectionStore = create<MigrateSelectionState>()(
  persist(
    (set) => ({
      hiddenProducts: [],
      activeLayer: 'All',
      activeSubCategory: 'All',
      myProducts: [],
      viewMode: 'stack' as MigrateViewMode,
      workflowCollapsed: true,

      hideProduct: (key) =>
        set((state) => ({
          hiddenProducts: state.hiddenProducts.includes(key)
            ? state.hiddenProducts
            : [...state.hiddenProducts, key],
        })),

      restoreLayerProducts: (keysToRestore) =>
        set((state) => ({
          hiddenProducts: state.hiddenProducts.filter((k) => !keysToRestore.includes(k)),
        })),

      restoreAll: () => set({ hiddenProducts: [] }),

      setActiveLayer: (layer) => set({ activeLayer: layer, activeSubCategory: 'All' }),

      setActiveSubCategory: (cat) => set({ activeSubCategory: cat }),

      toggleMyProduct: (key) =>
        set((state) => ({
          myProducts: state.myProducts.includes(key)
            ? state.myProducts.filter((k) => k !== key)
            : [...state.myProducts, key],
        })),

      clearMyProducts: () => set({ myProducts: [] }),

      setViewMode: (mode) => set({ viewMode: mode }),
      setWorkflowCollapsed: (collapsed) => set({ workflowCollapsed: collapsed }),
    }),
    {
      name: 'pqc-migrate-selection',
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate: (persistedState: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        if (version < 2) {
          // v0/v1 → v2: add layer filter fields
          state.hiddenProducts = Array.isArray(state.hiddenProducts) ? state.hiddenProducts : []
          if (!state.activeLayer) state.activeLayer = 'All'
          if (!state.activeSubCategory) state.activeSubCategory = 'All'
        }
        if (version < 3) {
          // v2 → v3: add myProducts
          state.myProducts = Array.isArray(state.myProducts) ? state.myProducts : []
        }
        if (version < 4) {
          // v3 → v4: add viewMode + workflowCollapsed
          if (!state.viewMode || !['stack', 'cards', 'table'].includes(state.viewMode)) {
            state.viewMode = 'stack'
          }
          state.workflowCollapsed = state.workflowCollapsed ?? false
        }
        if (version < 5) {
          // v4 → v5: default workflowCollapsed to true (hide by default)
          state.workflowCollapsed = true
        }
        if (version < 6) {
          // v5 → v6: three-way split of Application layer
          if (state.activeLayer === 'Application') {
            state.activeLayer = 'AppServers'
          }
          state.activeSubCategory = state.activeSubCategory ?? 'All'
        }
        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('MigrateSelection store rehydration failed:', error)
        }
      },
    }
  )
)
