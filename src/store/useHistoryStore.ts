// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { HistoryEvent, HistoryEventType } from '@/types/HistoryTypes'

const MAX_HISTORY_EVENTS = 500

interface HistoryState {
  events: HistoryEvent[]
  seeded: boolean
  visitedRoutes: string[]

  addEvent: (event: Omit<HistoryEvent, 'id'>) => void
  bulkSeed: (events: Omit<HistoryEvent, 'id'>[]) => void
  clearHistory: () => void
  recordVisit: (path: string) => void
}

function generateEventId(): string {
  const hex = Math.random().toString(16).slice(2, 6)
  return `evt-${Date.now()}-${hex}`
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      events: [],
      seeded: false,
      visitedRoutes: [],

      addEvent: (event) =>
        set((state) => {
          const newEvent: HistoryEvent = { ...event, id: generateEventId() }
          const updated = [...state.events, newEvent]
          return { events: updated.slice(-MAX_HISTORY_EVENTS) }
        }),

      bulkSeed: (newEvents) => {
        if (get().seeded) return
        const deduped = dedup(newEvents)
        set({
          events: deduped
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-MAX_HISTORY_EVENTS)
            .map((e) => ({ ...e, id: generateEventId() })),
          seeded: true,
        })
      },

      clearHistory: () => set({ events: [], seeded: false, visitedRoutes: [] }),

      recordVisit: (path) =>
        set((state) =>
          state.visitedRoutes.includes(path)
            ? state
            : { visitedRoutes: [...state.visitedRoutes, path] }
        ),
    }),
    {
      name: 'pqc-history',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        events: state.events,
        seeded: state.seeded,
        visitedRoutes: state.visitedRoutes,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        state.events = Array.isArray(state.events) ? state.events : []
        state.seeded = typeof state.seeded === 'boolean' ? state.seeded : false

        // v1 → v2: reset seeded flag when events is empty (fixes buggy v1
        // that marked seeded=true before stores finished hydrating)
        if (version < 2 && state.seeded && state.events.length === 0) {
          state.seeded = false
        }

        // v2 → v3: introduce visitedRoutes array for passive-page tracking
        state.visitedRoutes = Array.isArray(state.visitedRoutes) ? state.visitedRoutes : []

        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('History store rehydration failed:', error)
        }
      },
    }
  )
)

/** Dedup events by (type, moduleId, day) */
function dedup(events: Omit<HistoryEvent, 'id'>[]): Omit<HistoryEvent, 'id'>[] {
  const seen = new Set<string>()
  const result: Omit<HistoryEvent, 'id'>[] = []
  const skipDedupTypes: HistoryEventType[] = [
    'step_completed',
    'artifact_key',
    'artifact_cert',
    'artifact_csr',
    'artifact_executive',
    'tls_simulation',
  ]

  for (const event of events) {
    if (skipDedupTypes.includes(event.type)) {
      result.push(event)
      continue
    }
    const day = new Date(event.timestamp).toDateString()
    const key = `${event.type}:${event.moduleId ?? ''}:${day}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(event)
    }
  }
  return result
}
