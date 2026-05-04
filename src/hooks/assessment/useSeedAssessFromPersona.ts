// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'

export function useSeedAssessFromPersona(): void {
  const industry = useAssessmentFormStore((s) => s.industry)
  const assessmentStatus = useAssessmentFormStore((s) => s.assessmentStatus)

  useEffect(() => {
    // Don't overwrite a completed assessment or a user-chosen industry.
    if (assessmentStatus === 'complete') return
    if (industry) return

    // Re-seed whenever industry is empty — handles both initial mount and
    // post-reset() scenarios (e.g. workshop navigates to /assess?reset=1
    // while AssessView is already mounted, so the component never remounts).
    const { selectedIndustry } = usePersonaStore.getState()
    const store = useAssessmentStore.getState()
    if (selectedIndustry) store.setIndustry(selectedIndustry)
    // Country is NOT auto-seeded from region — the region already filters the
    // Step 2 country list to the right subset; picking region[0] would
    // pre-select the wrong country (e.g. Japan for Australian users).
  }, [industry, assessmentStatus])
}
