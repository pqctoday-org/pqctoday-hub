import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
}

export const useMigrateSelectionStore = create<MigrateSelectionState>()(
  persist(
    (set) => ({
      hiddenProducts: [],
      activeLayer: 'All',
      activeSubCategory: 'All',

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
    }),
    {
      name: 'pqc-migrate-selection',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        // v1 → v2: add layer filter fields
        state.hiddenProducts = Array.isArray(state.hiddenProducts) ? state.hiddenProducts : []
        if (!state.activeLayer) state.activeLayer = 'All'
        if (!state.activeSubCategory) state.activeSubCategory = 'All'
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
