// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'

export function useSeedAssessFromPersona(): void {
  const seededRef = useRef(false)

  useEffect(() => {
    if (seededRef.current) return
    const store = useAssessmentStore.getState()
    if (store.assessmentStatus === 'complete') return
    if (store.industry) return
    seededRef.current = true

    const { selectedIndustry, selectedRegion } = usePersonaStore.getState()
    if (selectedIndustry) store.setIndustry(selectedIndustry)
    if (selectedRegion && selectedRegion !== 'global') {
      const country = REGION_COUNTRIES_MAP[selectedRegion]?.[0]
      if (country) store.setCountry(country)
    }
  }, [])
}
