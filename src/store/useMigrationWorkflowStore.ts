// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type WorkflowPhase = 'assess' | 'comply' | 'migrate' | 'timeline'

export interface WorkflowPhaseConfig {
  id: WorkflowPhase
  label: string
  description: string
  route: string
}

export const WORKFLOW_PHASES: WorkflowPhaseConfig[] = [
  {
    id: 'assess',
    label: 'Risk Assessment',
    description: 'Complete your PQC risk assessment',
    route: '/assess',
  },
  {
    id: 'comply',
    label: 'Compliance Review',
    description: 'Review compliance frameworks for your industry',
    route: '/compliance',
  },
  {
    id: 'migrate',
    label: 'Product Selection',
    description: 'Select migration products for your stack',
    route: '/migrate',
  },
  {
    id: 'timeline',
    label: 'Timeline Review',
    description: 'Review government deadlines for your region',
    route: '/timeline',
  },
]

interface MigrationWorkflowState {
  workflowActive: boolean
  currentPhase: WorkflowPhase
  completedPhases: WorkflowPhase[]
  startedAt: string | null
  completedAt: string | null

  startWorkflow: () => void
  completePhase: (phase: WorkflowPhase) => void
  goToPhase: (phase: WorkflowPhase) => void
  dismissWorkflow: () => void
  resetWorkflow: () => void
}

export const useMigrationWorkflowStore = create<MigrationWorkflowState>()(
  persist(
    (set, get) => ({
      workflowActive: false,
      currentPhase: 'assess',
      completedPhases: [],
      startedAt: null,
      completedAt: null,

      startWorkflow: () =>
        set({
          workflowActive: true,
          currentPhase: 'assess',
          completedPhases: [],
          startedAt: new Date().toISOString(),
          completedAt: null,
        }),

      completePhase: (phase) => {
        const state = get()
        if (!state.workflowActive) return
        if (state.completedPhases.includes(phase)) return

        const completed = [...state.completedPhases, phase]
        const currentIndex = WORKFLOW_PHASES.findIndex((p) => p.id === phase)
        const nextPhase = WORKFLOW_PHASES[currentIndex + 1]

        set({
          completedPhases: completed,
          currentPhase: nextPhase ? nextPhase.id : state.currentPhase,
          completedAt:
            completed.length === WORKFLOW_PHASES.length ? new Date().toISOString() : null,
        })
      },

      goToPhase: (phase) => set({ currentPhase: phase }),

      dismissWorkflow: () => set({ workflowActive: false }),

      resetWorkflow: () =>
        set({
          workflowActive: false,
          currentPhase: 'assess',
          completedPhases: [],
          startedAt: null,
          completedAt: null,
        }),
    }),
    {
      name: 'pqc-migration-workflow',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as Record<string, unknown>
        if (version < 1) {
          state.workflowActive = state.workflowActive ?? false
          state.currentPhase = state.currentPhase ?? 'assess'
          state.completedPhases = Array.isArray(state.completedPhases) ? state.completedPhases : []
          state.startedAt = state.startedAt ?? null
          state.completedAt = state.completedAt ?? null
        }
        return state as unknown as MigrationWorkflowState
      },
      partialize: (state) => ({
        workflowActive: state.workflowActive,
        currentPhase: state.currentPhase,
        completedPhases: state.completedPhases,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Migration workflow store rehydration failed:', error)
        }
      },
    }
  )
)
