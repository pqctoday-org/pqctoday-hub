// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const s = (persistedState ?? {}) as Partial<HsmModeState>
        if (version < 1) {
          return { liveHsmEnabled: s?.liveHsmEnabled ?? false }
        }
        return s as { liveHsmEnabled: boolean }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('[useHSMMode] rehydrate error:', error)
      },
    }
  )
)
