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
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        return {
          enabled: (state.enabled as boolean) ?? false,
          lastSyncedAt: (state.lastSyncedAt as string) ?? null,
          lastSyncDirection: (state.lastSyncDirection as 'upload' | 'download') ?? null,
          provider: (state.provider as CloudProvider) ?? null,
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
