// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback } from 'react'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useWorkshopStore, isWorkshopPinning } from '@/store/useWorkshopStore'
import type { RightPanelTab } from '@/types/HistoryTypes'

/**
 * The top bar's Assistant and Bookmarks buttons. Pressing the button of the view that is showing
 * closes the drawer; pressing the other one switches to it. While a guided workshop runs the
 * drawer is pinned open, so the buttons do nothing.
 */
export function useDrawerToggle() {
  const toggle = useRightPanelStore((s) => s.toggle)
  return useCallback(
    (tab: Extract<RightPanelTab, 'chat' | 'bookmarks'>) => {
      if (isWorkshopPinning(useWorkshopStore.getState().mode)) return
      toggle(tab)
    },
    [toggle]
  )
}
