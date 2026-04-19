// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { complianceFrameworks } from '@/data/complianceData'
import { EU_MEMBER_COUNTRIES } from '@/utils/euCountries'

/**
 * One-shot seeding: the first time a user lands on the Command Center with a
 * completed assessment and a country selected, pre-track the PQC-relevant
 * compliance frameworks for that country.
 *
 * Guard:  hasSeededFromCountry flag (persisted). After any user removal,
 *         we never re-add — respect the user's explicit preference.
 */
export function useSeedFrameworksFromCountry(): void {
  const country = useAssessmentStore((s) => s.country)
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const hasSeeded = useComplianceSelectionStore((s) => s.hasSeededFromCountry)
  const addFrameworks = useComplianceSelectionStore((s) => s.addFrameworks)
  const markSeeded = useComplianceSelectionStore((s) => s.markSeededFromCountry)

  useEffect(() => {
    if (hasSeeded) return
    if (!country) return
    if (assessmentStatus !== 'complete') return

    const isEuMember = EU_MEMBER_COUNTRIES.has(country)
    const seedIds = complianceFrameworks
      .filter((fw) => {
        if (!fw.requiresPQC) return false
        if (fw.countries.length === 0) return false
        if (fw.countries.includes('Global')) return false
        if (fw.countries.includes(country)) return true
        if (isEuMember && fw.countries.includes('European Union')) return true
        return false
      })
      .map((fw) => fw.id)

    if (seedIds.length > 0) addFrameworks(seedIds)
    markSeeded()
  }, [country, assessmentStatus, hasSeeded, addFrameworks, markSeeded])
}
