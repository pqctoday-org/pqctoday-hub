// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CloudProvider = 'google-drive'

interface CloudSyncState {
  enabled: boolean
  lastSyncedAt: string | null
  lastSyncDirection: 'upload' | 'download' | null
  provider: CloudProvider | null

  // Actions
  setEnabled: (enabled: boolean) => void
  recordSync: (direction: 'upload' | 'download') => void
  disconnect: () => void
}

export const useCloudSyncStore = create<CloudSyncState>()(
  persist(
    (set) => ({
      enabled: false,
      lastSyncedAt: null,
      lastSyncDirection: null,
      provider: null,

      setEnabled: (enabled) =>
        set({
          enabled,
          provider: enabled ? 'google-drive' : null,
        }),

      recordSync: (direction) =>
        set({
          lastSyncedAt: new Date().toISOString(),
          lastSyncDirection: direction,
        }),

      disconnect: () =>
        set({
          enabled: false,
          provider: null,
          // Keep lastSyncedAt so user can see when they last synced
        }),
    }),
    {
      name: 'pqc-cloud-sync',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        if (version < 1) {
          return {
            enabled: typeof state.enabled === 'boolean' ? state.enabled : false,
            lastSyncedAt: typeof state.lastSyncedAt === 'string' ? state.lastSyncedAt : null,
            lastSyncDirection:
              state.lastSyncDirection === 'upload' || state.lastSyncDirection === 'download'
                ? (state.lastSyncDirection as 'upload' | 'download')
                : null,
            provider: state.provider === 'google-drive' ? (state.provider as CloudProvider) : null,
          }
        }
        return state as {
          enabled: boolean
          lastSyncedAt: string | null
          lastSyncDirection: 'upload' | 'download' | null
          provider: CloudProvider | null
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Cloud sync store rehydration failed:', error)
        }
      },
    }
  )
)
