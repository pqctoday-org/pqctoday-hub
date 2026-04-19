// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { threatsData, type ThreatData } from '@/data/threatsData'
import { softwareData } from '@/data/migrateData'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { timelineData, type CountryData } from '@/data/timelineData'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { pqcReadinessTier } from '@/data/kpiCatalog'
import type {
  AssessmentResult,
  HNDLRiskWindow,
  HNFLRiskWindow,
  MigrationEffortItem,
  AlgorithmMigration,
  CategoryScores,
  CategoryDrivers,
  AssessmentProfile,
  ScoreBoost,
} from './assessmentTypes'

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
  /** Tiered readiness as a fraction in [0,1]: sum of per-product readiness ÷ totalProducts. */
  vendorReadinessWeighted: number
  /** Per-layer tiered readiness (0–1), keyed by infrastructure layer. Drives the
   *  architect-facing per-layer vendor readiness view (D9). */
  vendorReadinessByLayer: Map<string, { weighted: number; count: number }>
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

  // Rich assessment fields (flattened from lastResult for pitch builders)
  preBoostScore: number | null
  boosts: ScoreBoost[]
  hndlRiskWindow: HNDLRiskWindow | null
  hnflRiskWindow: HNFLRiskWindow | null
  categoryScores: CategoryScores | null
  categoryDrivers: CategoryDrivers | null
  migrationEffort: MigrationEffortItem[]
  algorithmMigrations: AlgorithmMigration[]
  keyFindings: string[]
  assessmentProfile: AssessmentProfile | null

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
    // Precedence:
    //   1. explicit `selectedProductKeys` always wins (caller controls scope)
    //   2. else, narrow to products that either list the active industry in
    //      `targetIndustries` or leave the field blank (universal products)
    //   3. else, full catalog
    const industryLc = effectiveIndustry.toLowerCase()
    const filteredSoftware =
      selectedProductKeys && selectedProductKeys.length > 0
        ? (() => {
            const keySet = new Set(selectedProductKeys)
            return softwareData.filter((s) => keySet.has(s.productId))
          })()
        : industryLc
          ? softwareData.filter((s) => {
              const ti = (s.targetIndustries || '').toLowerCase().trim()
              if (!ti || ti === 'all' || ti === 'any') return true
              return ti.includes(industryLc)
            })
          : softwareData

    const vendorsByLayer = new Map<string, SoftwareItem[]>()
    let fipsValidatedCount = 0
    let pqcReadyCount = 0
    let readinessWeightSum = 0

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
      readinessWeightSum += pqcReadinessTier(s.pqcSupport)
    }

    const vendorReadinessWeighted =
      filteredSoftware.length > 0 ? readinessWeightSum / filteredSoftware.length : 0

    // Per-layer tiered readiness for the architect view. A product that spans
    // multiple comma-separated layers contributes to each. Readiness weight
    // uses the same tier map as the global roll-up.
    const vendorReadinessByLayer = new Map<string, { weighted: number; count: number }>()
    for (const [layer, products] of vendorsByLayer.entries()) {
      let sum = 0
      for (const p of products) sum += pqcReadinessTier(p.pqcSupport)
      vendorReadinessByLayer.set(layer, {
        weighted: products.length > 0 ? sum / products.length : 0,
        count: products.length,
      })
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
      vendorReadinessWeighted,
      vendorReadinessByLayer,
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
      preBoostScore: lastResult?.preBoostScore ?? null,
      boosts: lastResult?.boosts ?? [],
      hndlRiskWindow: lastResult?.hndlRiskWindow ?? null,
      hnflRiskWindow: lastResult?.hnflRiskWindow ?? null,
      categoryScores: lastResult?.categoryScores ?? null,
      categoryDrivers: lastResult?.categoryDrivers ?? null,
      migrationEffort: lastResult?.migrationEffort ?? [],
      algorithmMigrations: lastResult?.algorithmMigrations ?? [],
      keyFindings: lastResult?.keyFindings ?? [],
      assessmentProfile: lastResult?.assessmentProfile ?? null,
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
