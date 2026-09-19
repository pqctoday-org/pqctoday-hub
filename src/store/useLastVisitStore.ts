// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8 UX fix (2026-09-19): "updated since your last visit" on the
 * landing. Keeps the timestamp of the previous landing visit so the landing
 * can count the reviewed data revisions that merged after it. Two stamps are
 * kept so the count is stable for the whole visit: `previousVisitAt` is what
 * the strip compares against, `currentVisitAt` is promoted to previous on the
 * next visit (a visit = a landing mount more than 30 minutes after the last).
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const VISIT_GAP_MS = 30 * 60 * 1000

interface LastVisitState {
  /** ISO timestamp of the visit before the current one; null on the first ever visit. */
  previousVisitAt: string | null
  /** ISO timestamp of the current visit. */
  currentVisitAt: string | null
  /** Called on landing mount. Rolls the stamps only when a new visit has started. */
  recordVisit: (now?: Date) => void
}

export const useLastVisitStore = create<LastVisitState>()(
  persist(
    (set, get) => ({
      previousVisitAt: null,
      currentVisitAt: null,
      recordVisit: (now = new Date()) => {
        const { currentVisitAt } = get()
        const last = currentVisitAt ? new Date(currentVisitAt).getTime() : null
        if (last !== null && now.getTime() - last < VISIT_GAP_MS) return
        set({ previousVisitAt: currentVisitAt, currentVisitAt: now.toISOString() })
      },
    }),
    {
      name: 'pqc-last-visit',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ previousVisitAt: s.previousVisitAt, currentVisitAt: s.currentVisitAt }),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}
        if (version < 1) {
          state.previousVisitAt =
            typeof state.previousVisitAt === 'string' ? state.previousVisitAt : null
          state.currentVisitAt =
            typeof state.currentVisitAt === 'string' ? state.currentVisitAt : null
        }
        return state as unknown as LastVisitState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Last-visit store rehydration failed:', error)
        }
      },
    }
  )
)
