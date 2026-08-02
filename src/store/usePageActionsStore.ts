// SPDX-License-Identifier: GPL-3.0-only
import type { ReactNode } from 'react'
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
  /**
   * Overrides the top bar's route-derived Share copy. Routes whose share text
   * is per-record rather than per-route (every `/learn/<module-id>` page, whose
   * real title is the module's, not "Learn — PQC Today") set this on mount;
   * `ROUTE_SHARE` in `MainLayout.tsx` still covers the static routes.
   */
  shareTitle?: string
  shareText?: string
  /**
   * Escape hatch for page-specific chips/badges with no generic equivalent —
   * rendered at the end of the top bar's strip. Learn module pages ride their
   * `WipModuleBadge` + `ReviewedBadge` here (2026-08-02: "all icons and info
   * goes to the top bar"), which is why this store holds a node rather than
   * only serializable fields. Same `actions` passthrough idea `PageHeader`
   * already exposes; keep it to small inline elements, never a layout.
   */
  extra?: ReactNode
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
