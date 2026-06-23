// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { REPLACE_ASSETS } from '@/data/migrationAssets'
import { softwareData } from '@/data/migrateData'

export type MigrateViewMode = 'stack' | 'cisaStack' | 'cards' | 'table'

/** Workbench redesign tabs (URL-synced via ?tab=). */
export type MigrateTab = 'replace' | 'plan' | 'roadmaps' | 'vendorrisk'

/** Return a shallow copy of `obj` without `key`. Lint-friendly omit. */
function omitKey<T>(obj: Record<string, T>, key: string): Record<string, T> {
  const rest: Record<string, T> = {}
  for (const k of Object.keys(obj)) {
    // eslint-disable-next-line security/detect-object-injection
    if (k !== key) rest[k] = obj[k]
  }
  return rest
}

/** Replace-asset ids — these stay in the plan even with no chosen product
 *  (they're added/removed via the asset-level "Add to plan" toggle). Foundation
 *  domains, by contrast, are only in the plan because a product was chosen, so
 *  clearing their last product removes them. */
const REPLACE_ASSET_IDS = new Set<string>(REPLACE_ASSETS.map((a) => a.id))

/** Convert old composite key to productId slug */
function migrateKey(key: string): string {
  const name = key.includes('::') ? key.split('::')[0] : key
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface MigrateSelectionState {
  /** Product IDs that the user has hidden */
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
  /** Product IDs the user has marked as "My Products" */
  myProducts: string[]
  toggleMyProduct: (key: string) => void
  clearMyProducts: () => void
  /** Whether the "show only my products" filter is active */
  showOnlyMyProducts: boolean
  setShowOnlyMyProducts: (val: boolean) => void
  /** Active view mode for the migrate catalog */
  viewMode: MigrateViewMode
  setViewMode: (mode: MigrateViewMode) => void
  /** Whether the MigrationWorkflow hero section is collapsed */
  workflowCollapsed: boolean
  setWorkflowCollapsed: (collapsed: boolean) => void

  // ── Workbench redesign (asset-first plan) ────────────────────────────────
  /** Asset ids (from REPLACE_ASSETS) the user has added to their migration plan.
   *  Distinct from `myProducts` (product-keyed, legacy) — kept side-by-side. */
  plan: string[]
  togglePlanAsset: (assetId: string) => void
  removeFromPlan: (assetId: string) => void
  clearPlan: () => void
  /** Chosen replacement products per asset/domain: id → product names.
   *  Multi-valued so several products can be planned per category. */
  choice: Record<string, string[]>
  /** Toggle a chosen product for an asset/domain. Adds it (and ensures the
   *  asset is in the plan) or, if already chosen, removes just that product.
   *  Removing the last product drops the asset/domain from the plan. */
  chooseProduct: (assetId: string, productName: string) => void
  /** Remove a product (by productId) from the effective selection regardless of
   *  which path put it there: drops it from legacy `myProducts` AND un-chooses it
   *  from every `choice` entry whose product name resolves to that id (dropping
   *  any emptied non-replace asset from the plan). Lets cross-page surfaces that
   *  read the union (see {@link useSelectedProductIds}) offer a remove control
   *  that stays consistent with the workbench. */
  removeSelectedProduct: (productId: string) => void
  /** Active workbench tab (URL-synced). */
  tab: MigrateTab
  setTab: (tab: MigrateTab) => void
}

/** softwareName → productId, for resolving workbench `choice` (which stores
 *  product names) back to the productId slugs the rest of the app keys on. */
const PRODUCT_ID_BY_NAME = new Map<string, string>(
  softwareData.map((s) => [s.softwareName, s.productId])
)

/** Effective selected productIds = legacy `myProducts` (productId slugs) ∪ the
 *  workbench `choice` selections (stored as product names, resolved here). The
 *  asset-first /migrate redesign writes only `choice`/`plan`, so any surface that
 *  still reads `myProducts` alone would miss every workbench pick — this union is
 *  the single join both selection paths flow through. */
export function selectedProductIds(
  myProducts: string[],
  choice: Record<string, string[]>
): string[] {
  const out = new Set<string>(myProducts)
  for (const names of Object.values(choice)) {
    for (const name of names) {
      const id = PRODUCT_ID_BY_NAME.get(name)
      if (id) out.add(id)
    }
  }
  return [...out]
}

export const useMigrateSelectionStore = create<MigrateSelectionState>()(
  persist(
    (set) => ({
      hiddenProducts: [],
      activeLayer: 'All',
      activeSubCategory: 'All',
      myProducts: [],
      showOnlyMyProducts: false,
      viewMode: 'stack' as MigrateViewMode,
      workflowCollapsed: true,
      plan: [],
      choice: {},
      tab: 'replace' as MigrateTab,

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

      setShowOnlyMyProducts: (val) => set({ showOnlyMyProducts: val }),

      setViewMode: (mode) => set({ viewMode: mode }),
      setWorkflowCollapsed: (collapsed) => set({ workflowCollapsed: collapsed }),

      togglePlanAsset: (assetId) =>
        set((state) => {
          if (state.plan.includes(assetId)) {
            // leaving the plan also drops any chosen product for this asset
            return {
              plan: state.plan.filter((id) => id !== assetId),
              choice: omitKey(state.choice, assetId),
            }
          }
          return { plan: [...state.plan, assetId] }
        }),

      removeFromPlan: (assetId) =>
        set((state) => ({
          plan: state.plan.filter((id) => id !== assetId),
          choice: omitKey(state.choice, assetId),
        })),

      clearPlan: () => set({ plan: [], choice: {} }),

      chooseProduct: (assetId, productName) =>
        set((state) => {
          // eslint-disable-next-line security/detect-object-injection
          const current = state.choice[assetId] ?? []
          const nextList = current.includes(productName)
            ? current.filter((p) => p !== productName) // remove just this product
            : [...current, productName] // add — keeps any already-chosen products
          if (nextList.length === 0) {
            // Last product removed. Foundation domains exist in the plan only
            // because a product was chosen, so drop them. Replace assets are
            // managed by the "Add to plan" toggle, so keep them planned.
            const choice = omitKey(state.choice, assetId)
            return REPLACE_ASSET_IDS.has(assetId)
              ? { choice }
              : { plan: state.plan.filter((id) => id !== assetId), choice }
          }
          // choosing ensures the asset is in the plan
          const plan = state.plan.includes(assetId) ? state.plan : [...state.plan, assetId]
          return { plan, choice: { ...state.choice, [assetId]: nextList } }
        }),

      removeSelectedProduct: (productId) =>
        set((state) => {
          // Drop from the legacy product-keyed list.
          const myProducts = state.myProducts.filter((id) => id !== productId)

          // Un-choose every workbench `choice` entry whose name resolves to this
          // productId, mirroring chooseProduct's plan bookkeeping: a non-replace
          // asset left with no products drops out of the plan.
          const choice: Record<string, string[]> = {}
          let plan = state.plan
          for (const [assetId, names] of Object.entries(state.choice)) {
            const kept = names.filter((name) => PRODUCT_ID_BY_NAME.get(name) !== productId)
            if (kept.length === names.length) {
              // eslint-disable-next-line security/detect-object-injection
              choice[assetId] = names
              continue
            }
            if (kept.length > 0) {
              // eslint-disable-next-line security/detect-object-injection
              choice[assetId] = kept
            } else if (!REPLACE_ASSET_IDS.has(assetId)) {
              plan = plan.filter((id) => id !== assetId)
            }
          }
          return { myProducts, choice, plan }
        }),

      setTab: (tab) => set({ tab }),
    }),
    {
      name: 'pqc-migrate-selection',
      storage: createJSONStorage(() => localStorage),
      version: 10,
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
          if (
            !state.viewMode ||
            !['stack', 'cisaStack', 'cards', 'table'].includes(state.viewMode)
          ) {
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
        if (version < 7) {
          // v6 → v7: add showOnlyMyProducts
          state.showOnlyMyProducts = false
        }
        if (version < 8) {
          // v7 → v8: convert composite keys (softwareName::categoryId) to productId slugs
          if (Array.isArray(state.hiddenProducts)) {
            state.hiddenProducts = [...new Set(state.hiddenProducts.map(migrateKey))]
          }
          if (Array.isArray(state.myProducts)) {
            state.myProducts = [...new Set(state.myProducts.map(migrateKey))]
          }
        }
        if (version < 9) {
          // v8 → v9: add asset-first plan fields (workbench redesign).
          // `myProducts` is preserved untouched for back-compat.
          state.plan = Array.isArray(state.plan) ? state.plan : []
          state.choice =
            state.choice && typeof state.choice === 'object' && !Array.isArray(state.choice)
              ? state.choice
              : {}
          state.tab = ['replace', 'plan', 'roadmaps', 'vendorrisk'].includes(state.tab)
            ? state.tab
            : 'replace'
        }
        if (version < 10) {
          // v9 → v10: choice became multi-valued (productName → productName[]).
          if (state.choice && typeof state.choice === 'object' && !Array.isArray(state.choice)) {
            const next: Record<string, string[]> = {}
            for (const [k, v] of Object.entries(state.choice)) {
              // eslint-disable-next-line security/detect-object-injection
              next[k] = Array.isArray(v) ? (v as string[]) : typeof v === 'string' && v ? [v] : []
            }
            state.choice = next
          } else {
            state.choice = {}
          }
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

/** The user's effective product selection as productId slugs — the union of the
 *  legacy `myProducts` and the workbench `choice` (see {@link selectedProductIds}).
 *  Cross-page surfaces (Crypto Vulnerability Watch, the executive/business tools,
 *  vendor risk, the report toolkit…) should read THIS rather than `myProducts`
 *  directly, otherwise they miss every selection made in the /migrate redesign.
 *  Selecting the two stored fields separately keeps zustand from handing back a
 *  fresh array each render; the union is memoised on their identities. */
export function useSelectedProductIds(): string[] {
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const choice = useMigrateSelectionStore((s) => s.choice)
  return useMemo(() => selectedProductIds(myProducts, choice), [myProducts, choice])
}
