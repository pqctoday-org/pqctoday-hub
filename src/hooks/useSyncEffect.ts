// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useCallback } from 'react'
import { useCloudSyncStore } from '@/store/useCloudSyncStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { useMigrationWorkflowStore } from '@/store/useMigrationWorkflowStore'
import { useTLSStore } from '@/store/tls-learning.store'
import { useThemeStore } from '@/store/useThemeStore'
import { useVersionStore } from '@/store/useVersionStore'
import { useEndorsementStore } from '@/store/useEndorsementStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useDisclaimerStore } from '@/store/useDisclaimerStore'
import { useAirplaneModeStore } from '@/store/useAirplaneModeStore'
import { useHSMMode } from '@/store/useHSMMode'
import { useChatStore } from '@/store/useChatStore'
import {
  fetchFromDrive,
  writeToDrive,
  fetchFileMetadata,
  type SyncDocument,
} from '@/services/CloudSyncService'
import toast from 'react-hot-toast'

const APP_VERSION = '2.55.0'
const DEBOUNCE_MS = 2000

/**
 * Collect all store state into a SyncDocument, excluding sensitive fields.
 */
function collectStores(): Record<string, unknown> {
  const chatState = useChatStore.getState()
  // Strip API key — never sync secrets
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { apiKey: _apiKey, ...chatSafe } = chatState

  return {
    moduleStore: useModuleStore.getState(),
    assessmentStore: useAssessmentStore.getState(),
    personaStore: usePersonaStore.getState(),
    historyStore: useHistoryStore.getState(),
    migrateSelectionStore: useMigrateSelectionStore.getState(),
    complianceSelectionStore: useComplianceSelectionStore.getState(),
    achievementStore: useAchievementStore.getState(),
    migrationWorkflowStore: useMigrationWorkflowStore.getState(),
    tlsStore: useTLSStore.getState(),
    themeStore: useThemeStore.getState(),
    versionStore: useVersionStore.getState(),
    endorsementStore: useEndorsementStore.getState(),
    rightPanelStore: useRightPanelStore.getState(),
    disclaimerStore: useDisclaimerStore.getState(),
    airplaneModeStore: useAirplaneModeStore.getState(),
    hsmMode: useHSMMode.getState(),
    chatStore: chatSafe,
    cloudSyncStore: {
      enabled: useCloudSyncStore.getState().enabled,
      lastSyncedAt: useCloudSyncStore.getState().lastSyncedAt,
      lastSyncDirection: useCloudSyncStore.getState().lastSyncDirection,
      provider: useCloudSyncStore.getState().provider,
      deviceId: useCloudSyncStore.getState().deviceId,
    },
  }
}

type AnyStore = { setState: (s: unknown) => void }

function safeRestore(store: AnyStore, data: unknown) {
  if (data && typeof data === 'object') {
    store.setState(data)
  }
}

/**
 * Restore all stores from a SyncDocument (merge — does not replace actions).
 */
function restoreStores(stores: Record<string, unknown>) {
  safeRestore(useModuleStore as unknown as AnyStore, stores['moduleStore'])
  safeRestore(useAssessmentStore as unknown as AnyStore, stores['assessmentStore'])
  safeRestore(usePersonaStore as unknown as AnyStore, stores['personaStore'])
  safeRestore(useHistoryStore as unknown as AnyStore, stores['historyStore'])
  safeRestore(useMigrateSelectionStore as unknown as AnyStore, stores['migrateSelectionStore'])
  safeRestore(
    useComplianceSelectionStore as unknown as AnyStore,
    stores['complianceSelectionStore']
  )
  safeRestore(useAchievementStore as unknown as AnyStore, stores['achievementStore'])
  safeRestore(useMigrationWorkflowStore as unknown as AnyStore, stores['migrationWorkflowStore'])
  safeRestore(useTLSStore as unknown as AnyStore, stores['tlsStore'])
  safeRestore(useThemeStore as unknown as AnyStore, stores['themeStore'])
  safeRestore(useVersionStore as unknown as AnyStore, stores['versionStore'])
  safeRestore(useEndorsementStore as unknown as AnyStore, stores['endorsementStore'])
  safeRestore(useRightPanelStore as unknown as AnyStore, stores['rightPanelStore'])
  safeRestore(useDisclaimerStore as unknown as AnyStore, stores['disclaimerStore'])
  safeRestore(useAirplaneModeStore as unknown as AnyStore, stores['airplaneModeStore'])
  safeRestore(useHSMMode as unknown as AnyStore, stores['hsmMode'])

  // Restore chat store but preserve the existing apiKey — never overwrite with synced data
  const existingApiKey = useChatStore.getState().apiKey
  const chatData = stores['chatStore']
  if (chatData && typeof chatData === 'object') {
    ;(useChatStore as unknown as AnyStore).setState({
      ...(chatData as object),
      apiKey: existingApiKey,
    })
  }
}

/**
 * useSyncEffect — mounts once when user signs in, auto-syncs on changes.
 *
 * Call this in a component that is always mounted (e.g. AppRoot or a top-level provider).
 */
export function useSyncEffect() {
  const { accessToken, driveFileId, setDriveFileId, setSyncStatus, recordSync, lastSyncedAt } =
    useCloudSyncStore()

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSyncingRef = useRef(false)

  const doSync = useCallback(
    async (token: string, fileId: string | null) => {
      if (isSyncingRef.current) return
      isSyncingRef.current = true
      setSyncStatus('syncing')

      try {
        if (fileId) {
          // Conflict check
          const meta = await fetchFileMetadata(token, fileId)
          if (meta) {
            const lastKnownRemoteTime = useCloudSyncStore.getState().remoteModifiedTime
            if (
              lastKnownRemoteTime &&
              new Date(meta.modifiedTime).getTime() > new Date(lastKnownRemoteTime).getTime()
            ) {
              console.warn('Sync blocked: Backup modified by another device.')
              setSyncStatus('error')
              toast.error(
                'Sync blocked: Another device updated your data. Please refresh the page to pull the latest changes.',
                { duration: 8000 }
              )
              return
            }
          }
        }

        const doc: SyncDocument = {
          syncedAt: new Date().toISOString(),
          appVersion: APP_VERSION,
          deviceId: useCloudSyncStore.getState().deviceId,
          stores: collectStores(),
        }
        const newFileId = await writeToDrive(token, doc, fileId)
        if (!fileId) setDriveFileId(newFileId)

        // Record the new server modification time to prevent blocking our own future uploads
        const postMeta = await fetchFileMetadata(token, newFileId)
        if (postMeta) {
          useCloudSyncStore.getState().setRemoteModifiedTime(postMeta.modifiedTime)
        }

        recordSync('upload')
      } catch (err) {
        console.warn('Cloud sync upload failed:', err)
        setSyncStatus('error')
      } finally {
        isSyncingRef.current = false
      }
    },
    [setSyncStatus, setDriveFileId, recordSync]
  )

  // On sign-in: fetch from Drive and decide whether to restore or push
  useEffect(() => {
    if (!accessToken) return

    let cancelled = false

    const handleSignIn = async () => {
      setSyncStatus('syncing')
      try {
        const remoteInfo = await fetchFromDrive(accessToken)

        if (remoteInfo) {
          const { data: remote, fileId, modifiedTime } = remoteInfo
          setDriveFileId(fileId)
          useCloudSyncStore.getState().setRemoteModifiedTime(modifiedTime)

          // Warning for recent separate device activity
          const currentDeviceId = useCloudSyncStore.getState().deviceId
          if (remote.deviceId && remote.deviceId !== currentDeviceId) {
            const msSinceSync = new Date().getTime() - new Date(remote.syncedAt).getTime()
            if (msSinceSync < 60 * 60 * 1000) {
              // 1 hour
              toast('You were recently active on another device.', {
                icon: '⚠️',
                duration: 6000,
              })
            }
          }

          const remoteTime = new Date(remote.syncedAt).getTime()
          const localTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0

          if (remoteTime > localTime) {
            // Drive is newer — restore
            if (!cancelled) {
              restoreStores(remote.stores)
              recordSync('download')
            }
          } else {
            // Local is newer — push to Drive
            if (!cancelled) await doSync(accessToken, fileId)
          }
        } else {
          // No Drive data yet — push local state
          if (!cancelled) await doSync(accessToken, null)
        }
      } catch (err) {
        console.warn('Cloud sync initial fetch failed:', err)
        if (!cancelled) setSyncStatus('error')
      }
    }

    handleSignIn()
    return () => {
      cancelled = true
    }
    // Only run when accessToken changes (i.e., on sign-in)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  // Auto-sync on any store change (debounced)
  useEffect(() => {
    if (!accessToken) return

    const stores = [
      useModuleStore,
      useAssessmentStore,
      usePersonaStore,
      useHistoryStore,
      useMigrateSelectionStore,
      useComplianceSelectionStore,
      useAchievementStore,
      useMigrationWorkflowStore,
      useTLSStore,
      useThemeStore,
      useVersionStore,
      useEndorsementStore,
      useRightPanelStore,
      useDisclaimerStore,
      useAirplaneModeStore,
      useHSMMode,
      useChatStore,
    ] as const

    const unsubs = stores.map((store) =>
      store.subscribe(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          doSync(accessToken, driveFileId)
        }, DEBOUNCE_MS)
      })
    )

    return () => {
      unsubs.forEach((unsub) => unsub())
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [accessToken, driveFileId, doSync])
}
