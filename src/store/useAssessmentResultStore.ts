// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CategoryScores, AssessmentResult } from '../hooks/assessmentTypes'
import { useHistoryStore } from './useHistoryStore'
import { pullLegacyAssessmentState, runLegacyAssessmentMigrations } from './assessmentMigration'

export interface AssessmentSnapshot {
  completedAt: string
  riskScore: number
  categoryScores: CategoryScores
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  industry: string
}

export interface AssessmentResultState {
  hiddenThreats: string[]
  lastResult: AssessmentResult | null
  completedAt: string | null
  lastModifiedAt: string | null
  previousRiskScore: number | null
  assessmentHistory: AssessmentSnapshot[]

  // Actions
  hideThreat: (threatId: string) => void
  restoreThreat: (threatId: string) => void
  restoreAllThreats: () => void
  markComplete: (result: AssessmentResult | null) => void
  setResult: (result: AssessmentResult) => void
  pushSnapshot: (snapshot: AssessmentSnapshot) => void
  reset: () => void
}

const INITIAL_STATE = {
  hiddenThreats: [] as string[],
  lastResult: null as AssessmentResult | null,
  completedAt: null as string | null,
  lastModifiedAt: null as string | null,
  previousRiskScore: null as number | null,
  assessmentHistory: [] as AssessmentSnapshot[],
}

export const useAssessmentResultStore = create<AssessmentResultState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      hideThreat: (threatId) =>
        set((state) => ({
          hiddenThreats: state.hiddenThreats.includes(threatId)
            ? state.hiddenThreats
            : [...state.hiddenThreats, threatId],
        })),

      restoreThreat: (threatId) =>
        set((state) => ({
          hiddenThreats: state.hiddenThreats.filter((id) => id !== threatId),
        })),

      restoreAllThreats: () => set({ hiddenThreats: [] }),

      markComplete: (result) => {
        const now = new Date().toISOString()
        set((state) => ({
          completedAt: state.completedAt ?? now,
          lastModifiedAt: now,
          previousRiskScore: result?.riskScore ?? state.previousRiskScore,
        }))
        try {
          useHistoryStore.getState().addEvent({
            type: 'assessment_completed',
            timestamp: Date.now(),
            title: 'Completed risk assessment',
            detail: result ? `Risk score: ${result.riskScore}` : undefined,
            route: '/assess',
          })
        } catch {
          /* history push may fail if store not ready */
        }
      },

      setResult: (result) => set({ lastResult: result }),

      pushSnapshot: (snapshot) =>
        set((state) => {
          const existing = Array.isArray(state.assessmentHistory) ? state.assessmentHistory : []
          if (existing.some((s) => s.completedAt === snapshot.completedAt)) return {}
          return { assessmentHistory: [...existing, snapshot].slice(-5) }
        }),

      reset: () =>
        set((state) => ({
          ...INITIAL_STATE,
          assessmentHistory: state.assessmentHistory,
          previousRiskScore: state.lastResult?.riskScore ?? state.previousRiskScore,
        })),
    }),
    {
      name: 'pqc-assessment-result',
      storage: createJSONStorage(() => localStorage),
      version: 0,
      migrate: (persistedState: unknown, version: number) => {
        let state = (persistedState ?? {}) as Record<string, unknown>

        if (version === 0 && Object.keys(state).length === 0) {
          const legacy = pullLegacyAssessmentState()
          if (legacy) {
            state = runLegacyAssessmentMigrations(legacy.state, legacy.version)
          }
        }
        return state
      },
      partialize: (state) => ({
        hiddenThreats: state.hiddenThreats,
        lastResult: state.lastResult,
        completedAt: state.completedAt,
        lastModifiedAt: state.lastModifiedAt,
        previousRiskScore: state.previousRiskScore,
        assessmentHistory: state.assessmentHistory,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('Assessment result store rehydration failed:', error)
      },
    }
  )
)
