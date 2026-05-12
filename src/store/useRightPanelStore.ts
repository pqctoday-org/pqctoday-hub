// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { RightPanelTab } from '@/types/HistoryTypes'

interface RightPanelState {
  isOpen: boolean
  activeTab: RightPanelTab
  /** True when the panel was collapsed (not closed) — chat history preserved */
  isMinimized: boolean
  /** True when the panel is expanded to a wider layout (~80vw vs ~40vw default) */
  isExpanded: boolean

  open: (tab?: RightPanelTab) => void
  close: () => void
  minimize: () => void
  toggle: (tab?: RightPanelTab) => void
  setTab: (tab: RightPanelTab) => void
  toggleExpanded: () => void
}

export const useRightPanelStore = create<RightPanelState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      activeTab: 'chat',
      isMinimized: false,
      isExpanded: false,

      open: (tab) =>
        set({
          isOpen: true,
          isMinimized: false,
          ...(tab ? { activeTab: tab } : {}),
        }),

      close: () => set({ isOpen: false, isMinimized: false }),

      minimize: () => set({ isOpen: false, isMinimized: true }),

      toggle: (tab) => {
        const { isOpen, activeTab } = get()
        if (isOpen && (!tab || tab === activeTab)) {
          set({ isOpen: false })
        } else {
          set({ isOpen: true, isMinimized: false, ...(tab ? { activeTab: tab } : {}) })
        }
      },

      setTab: (tab) => set({ activeTab: tab }),

      toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),
    }),
    {
      name: 'pqc-right-panel',
      version: 6,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTab: state.activeTab,
        isExpanded: state.isExpanded,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        if (version < 1) {
          if (state.activeTab !== 'chat' && state.activeTab !== 'history') {
            state.activeTab = 'chat'
          }
        }
        if (version < 2) {
          // v1 → v2: 'bookmarks' is now a valid tab; no data migration needed
        }
        if (version < 3) {
          // v2 → v3: 'graph' tab removed; migrate to chat
          if (state.activeTab === 'graph') state.activeTab = 'chat'
        }
        if (version < 4) {
          // v3 → v4: 'faq' tab added; no migration needed
        }
        if (version < 5) {
          // v4 → v5: 'workshop' tab added; no migration needed
        }
        if (version < 6) {
          // v5 → v6: panel width-toggle added; default existing users to partial width.
          if (typeof state.isExpanded !== 'boolean') state.isExpanded = false
        }
        const allowed = ['chat', 'history', 'bookmarks', 'faq', 'workshop']
        if (!allowed.includes(state.activeTab as string)) state.activeTab = 'chat'
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
