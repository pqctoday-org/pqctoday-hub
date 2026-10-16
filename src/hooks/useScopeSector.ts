// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback } from 'react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { logIndustrySelected } from '@/utils/analytics'

/**
 * The one way to set the reader's sector. The top bar's scope selector
 * (PersonaSwitchModal) and the inline scope step on an empty Compliance register
 * both call this, so a sector picked in either place is the same write: the
 * persona store's 0-or-1-entry `selectedIndustries`, the assessment answer the
 * applicability engine reads, and — if the assessment was already complete —
 * reopening it from the first step so the report is not left on the old sector.
 *
 * `'All'` clears the sector.
 */
export function useScopeSector(): (id: string) => void {
  const setIndustries = usePersonaStore((s) => s.setIndustries)
  const setAssessIndustry = useAssessmentStore((s) => s.setIndustry)
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const editFromStep = useAssessmentStore((s) => s.editFromStep)

  return useCallback(
    (id: string) => {
      const industries = id === 'All' ? [] : [id]
      setIndustries(industries)
      setAssessIndustry(industries[0] ?? '')
      if (industries[0]) logIndustrySelected(industries[0])
      if (assessmentStatus === 'complete') editFromStep(0)
    },
    [setIndustries, setAssessIndustry, assessmentStatus, editFromStep]
  )
}
