// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'

/**
 * Transient, per-page action registration for the global top bar's
 * page-specific icon strip (info/export/endorse/flag) — HEADER-TOPBAR-
 * STANDARDIZATION-PLAN-2026-08-01.md §3. Not persisted: this is ephemeral
 * "what does the current route offer" UI state, not user data, so none of
 * the persistence-convention requirements (version/migrate/onRehydrateStorage)
 * apply here.
 *
 * A page calls `setPageActions(...)` in a mount effect and `clearPageActions()`
 * in its cleanup, so the top bar only ever shows the actions of whichever
 * page is actually mounted right now.
 */
export interface PageActions {
  title?: string
  dataSource?: string
  dataSourceLoading?: boolean
  onExport?: () => void
  endorseUrl?: string
  endorseLabel?: string
  endorseResourceType?: string
  flagUrl?: string
  flagLabel?: string
  flagResourceType?: string
}

interface PageActionsState {
  current: PageActions | null
  setPageActions: (actions: PageActions) => void
  clearPageActions: () => void
}

export const usePageActionsStore = create<PageActionsState>((set) => ({
  current: null,
  setPageActions: (actions) => set({ current: actions }),
  clearPageActions: () => set({ current: null }),
}))
