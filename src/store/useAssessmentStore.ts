// SPDX-License-Identifier: GPL-3.0-only
import {
  useAssessmentFormStore,
  type AssessmentFormState,
  type AssessmentMode,
  type AssessmentStatus,
} from './useAssessmentFormStore'
import {
  useAssessmentResultStore,
  type AssessmentResultState,
  type AssessmentSnapshot,
} from './useAssessmentResultStore'

export type { AssessmentMode, AssessmentStatus, AssessmentSnapshot }

export interface AssessmentState
  extends Omit<AssessmentFormState, 'setAssessmentStatus'>, AssessmentResultState {
  markComplete: () => void
  reset: () => void
}

/**
 * Proxy store that dynamically reads from useAssessmentFormStore and useAssessmentResultStore.
 * Enables 100% backward compatibility for all legacy UI components and Cloud Sync without
 * requiring refactors elsewhere.
 */
export const useAssessmentStore = Object.assign(
  <T = AssessmentState>(selector?: (state: AssessmentState) => T): T => {
    const form = useAssessmentFormStore()
    const result = useAssessmentResultStore()

    const combinedState: AssessmentState = {
      ...form,
      ...result,

      // Override complex actions to orchestrate across stores
      markComplete: () => {
        form.setAssessmentStatus('complete')
        result.markComplete(result.lastResult)
      },
      reset: () => {
        form.reset()
        result.reset()
      },
    }

    return (selector ? selector(combinedState) : combinedState) as T
  },
  {
    // Enable state extraction for outside-react scopes (e.g. UnifiedStorageService)
    getState: (): AssessmentState => {
      const form = useAssessmentFormStore.getState()
      const result = useAssessmentResultStore.getState()
      return {
        ...form,
        ...result,
        markComplete: () => {
          form.setAssessmentStatus('complete')
          result.markComplete(result.lastResult)
        },
        reset: () => {
          form.reset()
          result.reset()
        },
      }
    },
    // Enable store injection (e.g. UnifiedStorageService restore mechanism)
    // Expose persist API so seedHistory / useSyncEffect can check hydration
    persist: {
      hasHydrated: () =>
        useAssessmentFormStore.persist.hasHydrated() &&
        useAssessmentResultStore.persist.hasHydrated(),
      onFinishHydration: (fn: () => void) => {
        // Fire callback once both sub-stores have hydrated
        let remaining = 2
        const check = () => {
          remaining--
          if (remaining === 0) fn()
        }
        if (useAssessmentFormStore.persist.hasHydrated()) check()
        else useAssessmentFormStore.persist.onFinishHydration(check)
        if (useAssessmentResultStore.persist.hasHydrated()) check()
        else useAssessmentResultStore.persist.onFinishHydration(check)
        return () => {} // cleanup stub
      },
    },
    setState: (partial: Partial<AssessmentState>) => {
      if (!partial) return

      const formKeys = Object.keys(useAssessmentFormStore.getState())
      const resultKeys = Object.keys(useAssessmentResultStore.getState())

      const formPayload: Record<string, unknown> = {}
      const resultPayload: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(partial)) {
        if (formKeys.includes(key) && key !== 'assessmentStatus') {
          formPayload[key] = value
        }
        if (resultKeys.includes(key)) {
          resultPayload[key] = value
        }
        // specific overlap exceptions
        if (key === 'assessmentStatus') {
          formPayload.assessmentStatus = value
        }
      }

      if (Object.keys(formPayload).length > 0) useAssessmentFormStore.setState(formPayload, false)
      if (Object.keys(resultPayload).length > 0)
        useAssessmentResultStore.setState(resultPayload, false)
    },
  }
)
