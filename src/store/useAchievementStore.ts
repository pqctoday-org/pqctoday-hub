// SPDX-License-Identifier: AGPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UnlockedAchievement } from '@/types/AchievementTypes'
import { logAchievementUnlocked } from '@/utils/analytics'
import { ACHIEVEMENT_CATALOG } from '@/data/achievementCatalog'

// v3 (2026-11): adds `assistantQuestionCount` (a single number; no question text).
const ACHIEVEMENT_STORE_VERSION = 3

/**
 * A stored count is only ever a whole number of zero or more. Anything else (a missing field, a
 * string, NaN, a negative, a fraction, Infinity) is repaired here, so a bad value on the device or
 * in a restored copy can never reach a badge condition as NaN or undefined.
 */
export function sanitizeQuestionCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
  return Math.min(Math.floor(value), Number.MAX_SAFE_INTEGER)
}

interface AchievementState {
  /** All unlocked achievements */
  unlocked: UnlockedAchievement[]

  /** Persistent counters for data not tracked elsewhere */
  playgroundOpCount: number
  /**
   * How many questions the visitor has asked the Assistant. Only this number is kept: never the
   * question text, never when each was asked.
   */
  assistantQuestionCount: number
  sectionsVisited: string[]
  playgroundToolsUsed: string[]
  businessToolsUsed: string[]

  /** Toast FIFO queue — IDs of achievements to show next */
  toastQueue: string[]

  // Actions
  unlock: (id: string) => void
  markSeen: (id: string) => void
  incrementPlaygroundOps: () => void
  recordAssistantQuestion: () => void
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
      assistantQuestionCount: 0,
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

      recordAssistantQuestion: () =>
        set((state) => ({
          assistantQuestionCount: Math.min(
            sanitizeQuestionCount(state.assistantQuestionCount) + 1,
            Number.MAX_SAFE_INTEGER
          ),
        })),

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
          assistantQuestionCount: 0,
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
        assistantQuestionCount: state.assistantQuestionCount,
        sectionsVisited: state.sectionsVisited,
        playgroundToolsUsed: state.playgroundToolsUsed,
        businessToolsUsed: state.businessToolsUsed,
        // `toastQueue` is deliberately NOT persisted (2026-08-02). It was, and
        // that made celebrations fire at the wrong moment: AchievementToast
        // refuses to dequeue until `pqc-tour-completed` is set and waits 1.5 s
        // first, so an achievement earned on module completion was frequently
        // written to localStorage un-shown — then popped up on the next
        // snapshot change, typically when the learner OPENED a later module.
        // A celebration is a moment-in-time thing: if it is missed it should be
        // dropped, not replayed out of context. Nothing is lost — the award
        // itself lives in `unlocked`, which IS persisted and drives the badge
        // grid.
      }),
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        state.unlocked = Array.isArray(state.unlocked) ? state.unlocked : []
        state.playgroundOpCount =
          typeof state.playgroundOpCount === 'number' ? state.playgroundOpCount : 0
        // v2 -> v3: the Assistant question count starts at 0; earned badges are left as they are.
        state.assistantQuestionCount = sanitizeQuestionCount(state.assistantQuestionCount)
        state.sectionsVisited = Array.isArray(state.sectionsVisited) ? state.sectionsVisited : []
        state.playgroundToolsUsed = Array.isArray(state.playgroundToolsUsed)
          ? state.playgroundToolsUsed
          : []
        state.businessToolsUsed = Array.isArray(state.businessToolsUsed)
          ? state.businessToolsUsed
          : []
        // Always start with an EMPTY queue, discarding any celebrations left
        // over from a previous session by the old persisted-queue behaviour.
        state.toastQueue = []
        return state as unknown as AchievementState
      },
      // Runs on every load, also when the stored version is current (migrate does not): repair a
      // count that was edited or damaged on the device.
      merge: (persistedState, currentState) => {
        const stored = (persistedState ?? {}) as Partial<AchievementState>
        return {
          ...currentState,
          ...stored,
          assistantQuestionCount: sanitizeQuestionCount(stored.assistantQuestionCount),
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Achievement store rehydration failed:', error)
        }
      },
    }
  )
)
