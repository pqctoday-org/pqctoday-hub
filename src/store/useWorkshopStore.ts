// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WorkshopRegion } from '@/types/Workshop'

export type WorkshopMode = 'idle' | 'running' | 'paused' | 'video'

interface WorkshopState {
  mode: WorkshopMode
  currentFlowId: string | null
  currentStepId: string | null
  completedStepIds: string[]
  startedAt: string | null
  selectedRegion: WorkshopRegion | null

  start: (flowId: string, firstStepId: string, region: WorkshopRegion) => void
  pause: () => void
  resume: () => void
  exit: () => void
  startVideo: (flowId: string, firstStepId: string, region: WorkshopRegion) => void
  setStep: (stepId: string) => void
  markStepComplete: (stepId: string) => void
  reset: () => void
}

const INITIAL: Pick<
  WorkshopState,
  'mode' | 'currentFlowId' | 'currentStepId' | 'completedStepIds' | 'startedAt' | 'selectedRegion'
> = {
  mode: 'idle',
  currentFlowId: null,
  currentStepId: null,
  completedStepIds: [],
  startedAt: null,
  selectedRegion: null,
}

export const useWorkshopStore = create<WorkshopState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      start: (flowId, firstStepId, region) =>
        set({
          mode: 'running',
          currentFlowId: flowId,
          currentStepId: firstStepId,
          completedStepIds: [],
          startedAt: new Date().toISOString(),
          selectedRegion: region,
        }),

      pause: () => {
        if (get().mode === 'running') set({ mode: 'paused' })
      },

      resume: () => {
        if (get().mode === 'paused') set({ mode: 'running' })
      },

      exit: () => set({ ...INITIAL }),

      startVideo: (flowId, firstStepId, region) =>
        set({
          mode: 'video',
          currentFlowId: flowId,
          currentStepId: firstStepId,
          completedStepIds: [],
          startedAt: new Date().toISOString(),
          selectedRegion: region,
        }),

      setStep: (stepId) => set({ currentStepId: stepId }),

      markStepComplete: (stepId) => {
        const { completedStepIds } = get()
        if (completedStepIds.includes(stepId)) return
        set({ completedStepIds: [...completedStepIds, stepId] })
      },

      reset: () => set({ ...INITIAL }),
    }),
    {
      name: 'pqc-workshop',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode === 'video' ? 'idle' : state.mode,
        currentFlowId: state.currentFlowId,
        currentStepId: state.currentStepId,
        completedStepIds: state.completedStepIds,
        startedAt: state.startedAt,
        selectedRegion: state.selectedRegion,
      }),
      migrate: (persistedState: unknown) => {
        const s = (persistedState ?? {}) as Record<string, unknown>
        const allowedModes: WorkshopMode[] = ['idle', 'running', 'paused', 'video']
        const mode = allowedModes.includes(s.mode as WorkshopMode)
          ? (s.mode as WorkshopMode)
          : 'idle'
        return {
          mode: mode === 'running' ? 'paused' : mode,
          currentFlowId: typeof s.currentFlowId === 'string' ? s.currentFlowId : null,
          currentStepId: typeof s.currentStepId === 'string' ? s.currentStepId : null,
          completedStepIds: Array.isArray(s.completedStepIds)
            ? (s.completedStepIds as string[]).filter((x) => typeof x === 'string')
            : [],
          startedAt: typeof s.startedAt === 'string' ? s.startedAt : null,
          selectedRegion:
            typeof s.selectedRegion === 'string' ? (s.selectedRegion as WorkshopRegion) : null,
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('useWorkshopStore rehydrate error', error)
      },
    }
  )
)

export const isWorkshopActive = (mode: WorkshopMode): boolean =>
  mode === 'running' || mode === 'video'
