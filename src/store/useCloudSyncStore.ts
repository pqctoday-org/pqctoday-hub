// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CloudProvider = 'google-drive'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success'

interface CloudSyncState {
  // Persisted fields
  enabled: boolean
  lastSyncedAt: string | null
  lastSyncDirection: 'upload' | 'download' | null
  provider: CloudProvider | null
  deviceId: string

  // Session-only fields (not persisted — excluded via partialize)
  accessToken: string | null
  isSignedIn: boolean
  driveFileId: string | null
  syncStatus: SyncStatus
  remoteModifiedTime: string | null

  // Actions
  setEnabled: (enabled: boolean) => void
  recordSync: (direction: 'upload' | 'download') => void
  disconnect: () => void
  setSignedIn: (accessToken: string) => void
  setDriveFileId: (id: string) => void
  setSyncStatus: (status: SyncStatus) => void
  setRemoteModifiedTime: (time: string) => void
  signOut: () => void
}

export const useCloudSyncStore = create<CloudSyncState>()(
  persist(
    (set) => ({
      // Persisted
      enabled: false,
      lastSyncedAt: null,
      lastSyncDirection: null,
      provider: null,
      deviceId:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString(36) + Math.random().toString(36).slice(2),

      // Session-only (reset on every page load)
      accessToken: null,
      isSignedIn: false,
      driveFileId: null,
      syncStatus: 'idle',
      remoteModifiedTime: null,

      setEnabled: (enabled) =>
        set({
          enabled,
          provider: enabled ? 'google-drive' : null,
        }),

      recordSync: (direction) =>
        set({
          lastSyncedAt: new Date().toISOString(),
          lastSyncDirection: direction,
          syncStatus: 'success',
        }),

      disconnect: () =>
        set({
          enabled: false,
          provider: null,
          // Keep lastSyncedAt so user can see when they last synced
        }),

      setSignedIn: (accessToken) =>
        set({
          isSignedIn: true,
          accessToken,
          enabled: true,
          provider: 'google-drive',
        }),

      setDriveFileId: (id) => set({ driveFileId: id }),

      setSyncStatus: (status) => set({ syncStatus: status }),

      setRemoteModifiedTime: (time) => set({ remoteModifiedTime: time }),

      signOut: () =>
        set({
          isSignedIn: false,
          accessToken: null,
          driveFileId: null,
          syncStatus: 'idle',
          remoteModifiedTime: null,
          enabled: false,
          provider: null,
        }),
    }),
    {
      name: 'pqc-cloud-sync',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Only persist non-sensitive, non-session fields
      partialize: (state) => ({
        enabled: state.enabled,
        lastSyncedAt: state.lastSyncedAt,
        lastSyncDirection: state.lastSyncDirection,
        provider: state.provider,
        deviceId: state.deviceId,
      }),
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
            deviceId:
              typeof state.deviceId === 'string'
                ? state.deviceId
                : typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : Date.now().toString(36) + Math.random().toString(36).slice(2),
          }
        }
        if (version < 2) {
          // v2: added partialize — session fields no longer persist, no data shape change needed
          return {
            enabled: typeof state.enabled === 'boolean' ? state.enabled : false,
            lastSyncedAt: typeof state.lastSyncedAt === 'string' ? state.lastSyncedAt : null,
            lastSyncDirection:
              state.lastSyncDirection === 'upload' || state.lastSyncDirection === 'download'
                ? (state.lastSyncDirection as 'upload' | 'download')
                : null,
            provider: state.provider === 'google-drive' ? (state.provider as CloudProvider) : null,
            deviceId:
              typeof state.deviceId === 'string'
                ? state.deviceId
                : typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : Date.now().toString(36) + Math.random().toString(36).slice(2),
          }
        }
        return state as {
          enabled: boolean
          lastSyncedAt: string | null
          lastSyncDirection: 'upload' | 'download' | null
          provider: CloudProvider | null
          deviceId: string
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
