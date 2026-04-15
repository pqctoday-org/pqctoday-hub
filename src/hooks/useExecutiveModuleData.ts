// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { threatsData, type ThreatData } from '@/data/threatsData'
import { softwareData } from '@/data/migrateData'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { timelineData, type CountryData } from '@/data/timelineData'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { AssessmentResult } from './assessmentTypes'

export interface ExecutiveModuleData {
  // Threats
  threatsByIndustry: Map<string, ThreatData[]>
  criticalThreatCount: number
  totalThreatCount: number
  industryThreats: ThreatData[]

  // Software / Vendors
  vendorsByLayer: Map<string, SoftwareItem[]>
  fipsValidatedCount: number
  pqcReadyCount: number
  totalProducts: number

  // Compliance
  frameworks: ComplianceFramework[]
  frameworksByIndustry: ComplianceFramework[]

  // Timeline
  countryDeadlines: CountryData[]
  userCountryData: CountryData | null

  // Assessment
  assessmentResult: AssessmentResult | null
  riskScore: number | null
  industry: string
  country: string
  complianceSelections: string[]

  // Derived
  isAssessmentComplete: boolean
  migrationDeadlineYear: number | null
}

export function useExecutiveModuleData(selectedProductKeys?: string[]): ExecutiveModuleData {
  const industry = useAssessmentStore((s) => s.industry)
  const country = useAssessmentStore((s) => s.country)
  const complianceSelections = useAssessmentStore((s) => s.complianceRequirements)
  const lastResult = useAssessmentStore((s) => s.lastResult)
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const personaIndustry = usePersonaStore((s) => s.selectedIndustry)

  const effectiveIndustry = industry || personaIndustry || ''

  return useMemo(() => {
    // ── Threats ────────────────────────────────────────────────────────────
    const threatsByIndustry = new Map<string, ThreatData[]>()
    for (const t of threatsData) {
      const existing = threatsByIndustry.get(t.industry)
      if (existing) {
        existing.push(t)
      } else {
        threatsByIndustry.set(t.industry, [t])
      }
    }

    const criticalThreatCount = threatsData.filter(
      (t) => t.criticality === 'Critical' || t.criticality === 'High'
    ).length

    const industryThreats = effectiveIndustry
      ? threatsData.filter((t) =>
          t.industry.toLowerCase().includes(effectiveIndustry.toLowerCase())
        )
      : []

    // ── Software / Vendors ────────────────────────────────────────────────
    const filteredSoftware =
      selectedProductKeys && selectedProductKeys.length > 0
        ? (() => {
            const keySet = new Set(selectedProductKeys)
            return softwareData.filter((s) => keySet.has(s.productId))
          })()
        : softwareData

    const vendorsByLayer = new Map<string, SoftwareItem[]>()
    let fipsValidatedCount = 0
    let pqcReadyCount = 0

    for (const s of filteredSoftware) {
      // Split comma-separated layers so products appear in each layer
      const layers = (s.infrastructureLayer || 'Other').split(',').map((l) => l.trim())
      for (const layer of layers) {
        const existing = vendorsByLayer.get(layer)
        if (existing) {
          existing.push(s)
        } else {
          vendorsByLayer.set(layer, [s])
        }
      }

      const fipsLower = (s.fipsValidated || '').toLowerCase()
      if (
        fipsLower.startsWith('yes') ||
        fipsLower === 'validated' ||
        (fipsLower.includes('fips 140') && !fipsLower.startsWith('no'))
      ) {
        fipsValidatedCount++
      }
      if (s.pqcSupport && s.pqcSupport !== 'None' && s.pqcSupport !== 'No') {
        pqcReadyCount++
      }
    }

    // ── Compliance ────────────────────────────────────────────────────────
    const frameworksByIndustry = effectiveIndustry
      ? complianceFrameworks.filter(
          (f) =>
            f.industries.length === 0 ||
            f.industries.some((ind) => ind.toLowerCase().includes(effectiveIndustry.toLowerCase()))
        )
      : complianceFrameworks

    // ── Timeline ──────────────────────────────────────────────────────────
    const userCountryData = country
      ? (timelineData.find((c) => c.countryName.toLowerCase() === country.toLowerCase()) ?? null)
      : null

    // Derive earliest mandatory deadline year from user's country events
    let migrationDeadlineYear: number | null = null
    if (userCountryData) {
      for (const body of userCountryData.bodies) {
        for (const event of body.events) {
          if (event.phase === 'Regulation' || event.phase === 'Deadline') {
            if (!migrationDeadlineYear || event.endYear < migrationDeadlineYear) {
              migrationDeadlineYear = event.endYear
            }
          }
        }
      }
    }

    return {
      threatsByIndustry,
      criticalThreatCount,
      totalThreatCount: threatsData.length,
      industryThreats,
      vendorsByLayer,
      fipsValidatedCount,
      pqcReadyCount,
      totalProducts: filteredSoftware.length,
      frameworks: complianceFrameworks,
      frameworksByIndustry,
      countryDeadlines: timelineData,
      userCountryData,
      assessmentResult: lastResult ?? null,
      riskScore: lastResult?.riskScore ?? null,
      industry: effectiveIndustry,
      country,
      complianceSelections,
      isAssessmentComplete: assessmentStatus === 'complete',
      migrationDeadlineYear,
    }
  }, [
    effectiveIndustry,
    country,
    complianceSelections,
    lastResult,
    assessmentStatus,
    personaIndustry,
    selectedProductKeys,
  ])
}
