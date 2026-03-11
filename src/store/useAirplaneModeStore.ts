// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AirplaneModeState {
  /** Whether Airplane Mode is currently active */
  isEnabled: boolean
  /** Whether the user manually toggled it (prevents auto-off on reconnect) */
  isManual: boolean
  /** Enable or disable Airplane Mode */
  setEnabled: (value: boolean, manual?: boolean) => void
}

export const useAirplaneModeStore = create<AirplaneModeState>()(
  persist(
    (set) => ({
      isEnabled: false,
      isManual: false,
      setEnabled: (value, manual = true) =>
        set({ isEnabled: value, isManual: manual ? value : false }),
    }),
    {
      name: 'pqc-airplane-mode',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          state.isEnabled = state.isEnabled ?? false
          state.isManual = state.isManual ?? false
        }

        return state as unknown as AirplaneModeState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Airplane mode store rehydration failed:', error)
        }
      },
    }
  )
)
