// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WorkshopRegion } from '@/types/Workshop'

export type WorkshopMode = 'idle' | 'running' | 'paused' | 'video'
export type PlaybackSpeed = 'slow' | 'normal' | 'fast'

/**
 * Video Mode per-step duration. Each step's cues are scaled proportionally
 * within this fixed window — a step's content always plays end-to-end,
 * regardless of its authored estMinutes.
 *
 *   slow   → 20 s / step
 *   normal → 10 s / step (default)
 *   fast   →  5 s / step
 */
export const STEP_DURATION_MS: Record<PlaybackSpeed, number> = {
  slow: 20_000,
  normal: 10_000,
  fast: 5_000,
}

interface WorkshopState {
  mode: WorkshopMode
  currentFlowId: string | null
  currentStepId: string | null
  completedStepIds: string[]
  startedAt: string | null
  selectedRegion: WorkshopRegion | null
  /** Video Mode per-step duration preset. See STEP_DURATION_MS for the ms values. */
  playbackSpeed: PlaybackSpeed
  /** Manifest id of a flow chosen via "Browse all" — overrides auto-match. Null = use auto-match. */
  flowOverrideId: string | null

  start: (flowId: string, firstStepId: string, region: WorkshopRegion) => void
  pause: () => void
  resume: () => void
  exit: () => void
  startVideo: (flowId: string, firstStepId: string, region: WorkshopRegion) => void
  setStep: (stepId: string) => void
  markStepComplete: (stepId: string) => void
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
  setFlowOverrideId: (id: string | null) => void
  reset: () => void
}

const INITIAL: Pick<
  WorkshopState,
  | 'mode'
  | 'currentFlowId'
  | 'currentStepId'
  | 'completedStepIds'
  | 'startedAt'
  | 'selectedRegion'
  | 'playbackSpeed'
  | 'flowOverrideId'
> = {
  mode: 'idle',
  currentFlowId: null,
  currentStepId: null,
  completedStepIds: [],
  startedAt: null,
  selectedRegion: null,
  playbackSpeed: 'normal',
  flowOverrideId: null,
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

      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

      setFlowOverrideId: (id) => set({ flowOverrideId: id }),

      markStepComplete: (stepId) => {
        const { completedStepIds } = get()
        if (completedStepIds.includes(stepId)) return
        set({ completedStepIds: [...completedStepIds, stepId] })
      },

      reset: () => set({ ...INITIAL }),
    }),
    {
      name: 'pqc-workshop',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode === 'video' ? 'idle' : state.mode,
        currentFlowId: state.currentFlowId,
        currentStepId: state.currentStepId,
        completedStepIds: state.completedStepIds,
        startedAt: state.startedAt,
        selectedRegion: state.selectedRegion,
        playbackSpeed: state.playbackSpeed,
        flowOverrideId: state.flowOverrideId,
      }),
      migrate: (persistedState: unknown) => {
        const s = (persistedState ?? {}) as Record<string, unknown>
        const allowedModes: WorkshopMode[] = ['idle', 'running', 'paused', 'video']
        const mode = allowedModes.includes(s.mode as WorkshopMode)
          ? (s.mode as WorkshopMode)
          : 'idle'

        // playbackSpeed: previously stored as numeric multiplier (0.5/1/2);
        // now stored as 'slow' | 'normal' | 'fast'. Map the legacy values.
        let playbackSpeed: PlaybackSpeed = 'normal'
        if (s.playbackSpeed === 'slow' || s.playbackSpeed === 0.5) playbackSpeed = 'slow'
        else if (s.playbackSpeed === 'fast' || s.playbackSpeed === 2) playbackSpeed = 'fast'

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
          playbackSpeed,
          flowOverrideId: typeof s.flowOverrideId === 'string' ? s.flowOverrideId : null,
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

/**
 * Workshop modes that pin the right panel open. Video Mode is excluded
 * because the recorder needs the full viewport for the main pane plus
 * the spotlight + caption overlays.
 */
export const isWorkshopPinning = (mode: WorkshopMode): boolean =>
  mode === 'running' || mode === 'paused'
