// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { type PhaseId, PHASE_ORDER } from '../data/frameworkPhases'

export type WorkflowPhase = 'assess' | 'comply' | 'migrate' | 'timeline'

/** Status of a single phase in the 0–7 + Foundations journey. */
export type PhaseStatus = 'todo' | 'active' | 'done'

/** Build the initial phaseStatus map: all 'todo' except the first phase ('p0') 'active'. */
const buildInitialPhaseStatus = (): Record<PhaseId, PhaseStatus> =>
  PHASE_ORDER.reduce(
    (acc, id) => {
      acc[id] = id === 'p0' ? 'active' : 'todo'
      return acc
    },
    {} as Record<PhaseId, PhaseStatus>
  )

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

  // --- Phase 0–7 journey (additive, self-contained, user-driven) ---
  phaseStatus: Record<PhaseId, PhaseStatus>
  currentPhaseId: PhaseId
  /** PhaseRail (left sidebar) minimized state — persisted. */
  railCollapsed: boolean

  startWorkflow: () => void
  completePhase: (phase: WorkflowPhase) => void
  goToPhase: (phase: WorkflowPhase) => void
  dismissWorkflow: () => void
  resetWorkflow: () => void

  setCurrentPhaseId: (p: PhaseId) => void
  markPhaseDone: (p: PhaseId) => void
  toggleRailCollapsed: () => void
  setRailCollapsed: (collapsed: boolean) => void
}

export const useMigrationWorkflowStore = create<MigrationWorkflowState>()(
  persist(
    (set, get) => ({
      workflowActive: false,
      currentPhase: 'assess',
      completedPhases: [],
      startedAt: null,
      completedAt: null,

      phaseStatus: buildInitialPhaseStatus(),
      currentPhaseId: 'p0',
      railCollapsed: false,

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

      setCurrentPhaseId: (p) => {
        const state = get()
        set({
          currentPhaseId: p,
          phaseStatus:
            state.phaseStatus[p] === 'done'
              ? state.phaseStatus
              : { ...state.phaseStatus, [p]: 'active' },
        })
      },

      markPhaseDone: (p) => {
        const state = get()
        const nextStatus: Record<PhaseId, PhaseStatus> = {
          ...state.phaseStatus,
          [p]: 'done',
        }

        // Advance currentPhaseId to the next phase still 'todo' in PHASE_ORDER.
        const nextTodo = PHASE_ORDER.find((id) => nextStatus[id] === 'todo')
        const nextCurrent = nextTodo ?? state.currentPhaseId

        if (nextTodo && nextStatus[nextTodo] === 'todo') {
          nextStatus[nextTodo] = 'active'
        }

        set({
          phaseStatus: nextStatus,
          currentPhaseId: nextCurrent,
        })
      },

      toggleRailCollapsed: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
      setRailCollapsed: (collapsed) => set({ railCollapsed: collapsed }),
    }),
    {
      name: 'pqc-migration-workflow',
      version: 2,
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
        if (version < 2) {
          // Additive Phase 0–7 journey fields.
          const persistedStatus = state.phaseStatus as
            | Partial<Record<PhaseId, PhaseStatus>>
            | undefined
          const base = buildInitialPhaseStatus()
          state.phaseStatus =
            persistedStatus && typeof persistedStatus === 'object'
              ? { ...base, ...persistedStatus }
              : base
          state.currentPhaseId =
            typeof state.currentPhaseId === 'string' &&
            PHASE_ORDER.includes(state.currentPhaseId as PhaseId)
              ? state.currentPhaseId
              : 'p0'
        }
        return state as unknown as MigrationWorkflowState
      },
      partialize: (state) => ({
        workflowActive: state.workflowActive,
        currentPhase: state.currentPhase,
        completedPhases: state.completedPhases,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        phaseStatus: state.phaseStatus,
        currentPhaseId: state.currentPhaseId,
        railCollapsed: state.railCollapsed,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Migration workflow store rehydration failed:', error)
        }
      },
    }
  )
)
