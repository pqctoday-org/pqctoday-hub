// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { RightPanelTab } from '@/types/HistoryTypes'

interface RightPanelState {
  isOpen: boolean
  activeTab: RightPanelTab

  open: (tab?: RightPanelTab) => void
  close: () => void
  toggle: (tab?: RightPanelTab) => void
  setTab: (tab: RightPanelTab) => void
}

export const useRightPanelStore = create<RightPanelState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      activeTab: 'chat',

      open: (tab) =>
        set({
          isOpen: true,
          ...(tab ? { activeTab: tab } : {}),
        }),

      close: () => set({ isOpen: false }),

      toggle: (tab) => {
        const { isOpen, activeTab } = get()
        if (isOpen && (!tab || tab === activeTab)) {
          set({ isOpen: false })
        } else {
          set({ isOpen: true, ...(tab ? { activeTab: tab } : {}) })
        }
      },

      setTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'pqc-right-panel',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTab: state.activeTab,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        if (version < 1) {
          if (
            state.activeTab !== 'chat' &&
            state.activeTab !== 'history' &&
            state.activeTab !== 'graph'
          ) {
            state.activeTab = 'chat'
          }
        }
        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Right panel store rehydration failed:', error)
        }
      },
    }
  )
)
