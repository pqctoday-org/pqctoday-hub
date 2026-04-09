// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useMemo } from 'react'
import { useEmbed } from './EmbedProvider'
import { useEmbedAuth } from './useEmbedAuth'
import { ApiPersistence, PostMessagePersistence, NoPersistence } from './EmbedPersistenceService'
import type { IEmbedPersistenceService } from './EmbedPersistenceService'
import { UnifiedStorageService } from '../services/storage/UnifiedStorageService'

// Import all stores we want to persist
import { useModuleStore } from '../store/useModuleStore'
import { useAssessmentStore } from '../store/useAssessmentStore'
import { usePersonaStore } from '../store/usePersonaStore'
import { useHistoryStore } from '../store/useHistoryStore'
import { useMigrateSelectionStore } from '../store/useMigrateSelectionStore'
import { useComplianceSelectionStore } from '../store/useComplianceSelectionStore'
import { useAchievementStore } from '../store/useAchievementStore'
import { useMigrationWorkflowStore } from '../store/useMigrationWorkflowStore'
import { useTLSStore } from '../store/tls-learning.store'
import { useThemeStore } from '../store/useThemeStore'
import { useVersionStore } from '../store/useVersionStore'
import { useEndorsementStore } from '../store/useEndorsementStore'
import { useRightPanelStore } from '../store/useRightPanelStore'
import { useDisclaimerStore } from '../store/useDisclaimerStore'
import { useHSMMode } from '../store/useHSMMode'
import { useBookmarkStore } from '../store/useBookmarkStore'
import { useChatStore } from '../store/useChatStore'

const DEBOUNCE_MS = 5000
const EVENT_BATCH_MS = 30000

export function useEmbedPersistence() {
  const embedConfig = useEmbed()
  const { persistMode, userId, apiBase, allowedOrigins } = embedConfig
  const { isAuthenticated, getToken, triggerAuthExpired } = useEmbedAuth()

  const service = useMemo<IEmbedPersistenceService>(() => {
    if (persistMode === 'api' && apiBase) {
      return new ApiPersistence(apiBase, getToken, triggerAuthExpired)
    } else if (persistMode === 'postMessage') {
      return new PostMessagePersistence(allowedOrigins)
    }
    return new NoPersistence()
  }, [persistMode, apiBase, allowedOrigins, getToken, triggerAuthExpired])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventBatchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingEventsRef = useRef<unknown[]>([])

  // 1. Initial Load (Hydration)
  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true

    service.loadSnapshot(userId).then((snapshot) => {
      if (!isMounted) return
      if (snapshot) {
        UnifiedStorageService.restoreSnapshot(snapshot)
      }
    })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, service, userId])

  // 2. Auto-save on store changes
  useEffect(() => {
    if (!isAuthenticated || persistMode === 'none') return

    const stores = [
      useModuleStore,
      useAssessmentStore,
      usePersonaStore,
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
      useHSMMode,
      useBookmarkStore,
      useChatStore,
    ] as const

    const doSave = () => {
      const snapshot = UnifiedStorageService.exportSnapshot('manual')
      service.saveSnapshot(userId, snapshot).catch((err) => {
        console.warn('Embed save failed:', err)
      })
    }

    const unsubs = stores.map((store) =>
      (store as unknown as { subscribe: (cb: () => void) => () => void }).subscribe(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(doSave, DEBOUNCE_MS)
      })
    )

    // Handle beforeunload to flush immediately
    const handleUnload = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        doSave()
      }
      if (eventBatchRef.current && pendingEventsRef.current.length > 0) {
        clearTimeout(eventBatchRef.current)
        service.sendEvents(userId, pendingEventsRef.current).catch(console.warn)
      }
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      unsubs.forEach((unsub) => unsub())
      if (debounceRef.current) clearTimeout(debounceRef.current)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [isAuthenticated, persistMode, service, userId])

  // 3. Event forwarding (History Store)
  useEffect(() => {
    if (!isAuthenticated || persistMode === 'none') return

    const unsub = useHistoryStore.subscribe((state, prevState) => {
      // Find new events by comparing length
      if (state.events.length > prevState.events.length) {
        const newEvents = state.events.slice(prevState.events.length)
        pendingEventsRef.current.push(...newEvents)

        if (eventBatchRef.current) clearTimeout(eventBatchRef.current)
        eventBatchRef.current = setTimeout(() => {
          if (pendingEventsRef.current.length > 0) {
            const eventsToSend = [...pendingEventsRef.current]
            pendingEventsRef.current = []
            service.sendEvents(userId, eventsToSend).catch(console.warn)
          }
        }, EVENT_BATCH_MS)
      }
    })

    return () => unsub()
  }, [isAuthenticated, persistMode, service, userId])
}
