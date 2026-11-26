// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback } from 'react'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useWorkshopStore, isWorkshopPinning } from '@/store/useWorkshopStore'
import type { DrawerToggleTab } from '@/types/HistoryTypes'

/**
 * The top bar's drawer buttons (Assistant, Bookmarks, Glossary, Guide, Sources, FAQ). Pressing the
 * button of the view that is showing closes the drawer; pressing another one switches to it. While a guided workshop runs the
 * drawer is pinned open, so the buttons do nothing.
 */
export function useDrawerToggle() {
  const toggle = useRightPanelStore((s) => s.toggle)
  return useCallback(
    (tab: DrawerToggleTab) => {
      if (isWorkshopPinning(useWorkshopStore.getState().mode)) return
      toggle(tab)
    },
    [toggle]
  )
}
