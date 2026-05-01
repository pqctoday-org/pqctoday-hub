// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UnlockedAchievement } from '@/types/AchievementTypes'
import { logAchievementUnlocked } from '@/utils/analytics'
import { ACHIEVEMENT_CATALOG } from '@/data/achievementCatalog'

const ACHIEVEMENT_STORE_VERSION = 2

interface AchievementState {
  /** All unlocked achievements */
  unlocked: UnlockedAchievement[]

  /** Persistent counters for data not tracked elsewhere */
  playgroundOpCount: number
  sectionsVisited: string[]
  playgroundToolsUsed: string[]
  businessToolsUsed: string[]

  /** Toast FIFO queue — IDs of achievements to show next */
  toastQueue: string[]

  // Actions
  unlock: (id: string) => void
  markSeen: (id: string) => void
  incrementPlaygroundOps: () => void
  recordSectionVisit: (section: string) => void
  recordPlaygroundToolUsage: (toolId: string) => void
  recordBusinessToolUsage: (toolId: string) => void
  dequeueToast: () => string | undefined
  resetAchievements: () => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      playgroundOpCount: 0,
      sectionsVisited: [],
      playgroundToolsUsed: [],
      businessToolsUsed: [],
      toastQueue: [],

      unlock: (id) => {
        const state = get()
        if (state.unlocked.some((u) => u.id === id)) return
        const newUnlock: UnlockedAchievement = {
          id,
          unlockedAt: Date.now(),
          seen: false,
        }
        set({
          unlocked: [...state.unlocked, newUnlock],
          toastQueue: [...state.toastQueue, id],
        })
        const def = ACHIEVEMENT_CATALOG.find((a) => a.id === id)
        logAchievementUnlocked(id, def?.rarity)
      },

      markSeen: (id) =>
        set((state) => ({
          unlocked: state.unlocked.map((u) => (u.id === id ? { ...u, seen: true } : u)),
        })),

      incrementPlaygroundOps: () =>
        set((state) => ({ playgroundOpCount: state.playgroundOpCount + 1 })),

      recordSectionVisit: (section) =>
        set((state) => ({
          sectionsVisited: state.sectionsVisited.includes(section)
            ? state.sectionsVisited
            : [...state.sectionsVisited, section],
        })),

      recordPlaygroundToolUsage: (toolId) =>
        set((state) => ({
          playgroundToolsUsed: state.playgroundToolsUsed.includes(toolId)
            ? state.playgroundToolsUsed
            : [...state.playgroundToolsUsed, toolId],
        })),

      recordBusinessToolUsage: (toolId) =>
        set((state) => ({
          businessToolsUsed: state.businessToolsUsed.includes(toolId)
            ? state.businessToolsUsed
            : [...state.businessToolsUsed, toolId],
        })),

      dequeueToast: () => {
        const state = get()
        if (state.toastQueue.length === 0) return undefined
        const [next, ...rest] = state.toastQueue
        set({ toastQueue: rest })
        return next
      },

      resetAchievements: () =>
        set({
          unlocked: [],
          playgroundOpCount: 0,
          sectionsVisited: [],
          playgroundToolsUsed: [],
          businessToolsUsed: [],
          toastQueue: [],
        }),
    }),
    {
      name: 'pqc-achievements',
      version: ACHIEVEMENT_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        unlocked: state.unlocked,
        playgroundOpCount: state.playgroundOpCount,
        sectionsVisited: state.sectionsVisited,
        playgroundToolsUsed: state.playgroundToolsUsed,
        businessToolsUsed: state.businessToolsUsed,
        toastQueue: state.toastQueue,
      }),
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        state.unlocked = Array.isArray(state.unlocked) ? state.unlocked : []
        state.playgroundOpCount =
          typeof state.playgroundOpCount === 'number' ? state.playgroundOpCount : 0
        state.sectionsVisited = Array.isArray(state.sectionsVisited) ? state.sectionsVisited : []
        state.playgroundToolsUsed = Array.isArray(state.playgroundToolsUsed)
          ? state.playgroundToolsUsed
          : []
        state.businessToolsUsed = Array.isArray(state.businessToolsUsed)
          ? state.businessToolsUsed
          : []
        state.toastQueue = Array.isArray(state.toastQueue) ? state.toastQueue : []
        return state as unknown as AchievementState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Achievement store rehydration failed:', error)
        }
      },
    }
  )
)
