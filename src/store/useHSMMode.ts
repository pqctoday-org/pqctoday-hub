// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HsmModeState {
  liveHsmEnabled: boolean
  toggleLiveHsm: () => void
  setLiveHsm: (v: boolean) => void
}

export const useHSMMode = create<HsmModeState>()(
  persist(
    (set) => ({
      liveHsmEnabled: false,
      toggleLiveHsm: () => set((s) => ({ liveHsmEnabled: !s.liveHsmEnabled })),
      setLiveHsm: (v) => set({ liveHsmEnabled: v }),
    }),
    {
      name: 'pqc-hsm-mode-storage',
      version: 1,
      migrate: (persistedState) => {
        const s = persistedState as Partial<HsmModeState>
        return {
          liveHsmEnabled: s?.liveHsmEnabled ?? false,
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('[useHSMMode] rehydrate error:', error)
      },
    }
  )
)
