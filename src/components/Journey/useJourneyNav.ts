// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useJourneyStore } from '@/store/useJourneyStore'
import { describeStep } from '@/services/journey/stepView'
import type { JourneyOrigin, Objective, Step } from '@/services/journey/types'

/** Router state a journey link carries so the page it opens can offer Back to where the learner started. */
export interface JourneyLinkState {
  journeyOrigin?: JourneyOrigin
}

/** The origin a page was opened from, read from the router state. Absent means a link or a reload. */
export function useJourneyOrigin(): JourneyOrigin {
  const state = useLocation().state as JourneyLinkState | null
  return state?.journeyOrigin ?? 'link'
}

/**
 * Opens a step of an objective: records the checkpoint (the step and where Back goes) and navigates.
 * A module opens its page; a self-assessed step opens its step page in Your journey.
 */
export function useOpenStep(origin: JourneyOrigin = 'journey') {
  const navigate = useNavigate()
  const setCheckpoint = useJourneyStore((s) => s.setCheckpoint)
  return useCallback(
    (objective: Objective, step: Step) => {
      setCheckpoint(objective.id, {
        stepId: step.id,
        returnTo: origin === 'journey' ? '/learn?mode=journey' : undefined,
      })
      navigate(describeStep(step, objective).to, {
        state: { journeyOrigin: origin } satisfies JourneyLinkState,
      })
    },
    [navigate, setCheckpoint, origin]
  )
}
