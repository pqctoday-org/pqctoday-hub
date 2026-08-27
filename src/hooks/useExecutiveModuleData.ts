// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { threatsData, type ThreatData } from '@/data/threatsData'
import { softwareData } from '@/data/migrateData'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { timelineData, type CountryData } from '@/data/timelineData'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { pqcReadinessTier, isPqcReady, isFips1403Validated } from '@/data/kpiCatalog'
import { matchesIndustry } from '@/data/industryMatch'
import { classifyProductDomain, type DomainId } from '@/data/migrationAssets'
import type {
  AssessmentResult,
  HNDLRiskWindow,
  TNFLRiskWindow,
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
  /** Same products grouped by the audited `classifyProductDomain` taxonomy
   *  (the one the /migrate Replace tab uses) — every product in exactly one
   *  domain, unlike the free-text `infrastructureLayer` grouping above, whose
   *  stray CSV spellings scatter e.g. the HSM products across 5 buckets. */
  vendorsByDomain: Map<DomainId, SoftwareItem[]>
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
  tnflRiskWindow: TNFLRiskWindow | null
  categoryScores: CategoryScores | null
  categoryDrivers: CategoryDrivers | null
  migrationEffort: MigrationEffortItem[]
  algorithmMigrations: AlgorithmMigration[]
  keyFindings: string[]
  assessmentProfile: AssessmentProfile | null

  // Cross-page user selections (raw IDs from each page's bookmark store)
  myFrameworks: string[]
  myProductIds: string[]
  myProducts: SoftwareItem[]
  myThreatIds: string[]
  myThreats: ThreatData[]
  myTimelineCountries: string[]
  myTimelineCountryData: CountryData[]

  // Derived
  isAssessmentComplete: boolean
  migrationDeadlineYear: number | null
  /** Program start year for pace-to-deadline. Not derived by the hook — tools
   *  that capture it (e.g. the KPI tracker) merge it into the data they pass to
   *  `buildDimensions`. Optional; absent → pace-to-deadline stays manual. */
  migrationStartYear?: number | null
}

export function useExecutiveModuleData(selectedProductKeys?: string[]): ExecutiveModuleData {
  const industry = useAssessmentStore((s) => s.industry)
  const country = useAssessmentStore((s) => s.country)
  const complianceSelections = useAssessmentStore((s) => s.complianceRequirements)
  const lastResult = useAssessmentStore((s) => s.lastResult)
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const personaIndustry = usePersonaStore((s) => s.selectedIndustry)
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  // Effective selection = legacy myProducts ∪ workbench choice (the /migrate
  // redesign writes choice/plan, not myProducts).
  const myProductIds = useSelectedProductIds()
  const myThreatIds = useBookmarkStore((s) => s.myThreats)
  const myTimelineCountries = useBookmarkStore((s) => s.myTimelineCountries)

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

    // Sector-key join (see industryMatch.ts): 'Finance & Banking' matches
    // 'Financial Services / Banking' because both are aliases of sector 52,
    // and Cross-Industry threats match every industry. The old raw substring
    // test matched zero threats for most Assess industries, leaving the
    // supply-chain matrix's Impact axis silently empty.
    const industryThreats = effectiveIndustry
      ? threatsData.filter((t) => matchesIndustry(t.industry, effectiveIndustry))
      : []

    // ── Software / Vendors ────────────────────────────────────────────────
    // Explicit `selectedProductKeys` wins (caller controls scope); otherwise
    // the full catalog. The former middle tier — silently narrowing to
    // products whose free-text `targetIndustries` contained the industry
    // string — was removed 2026-08-27 (vendor-risk remediation, decision D5):
    // the substring join dropped ~85% of the catalog (e.g. 3 of 34 HSMs for
    // 'Finance & Banking') while the UI claimed to show everything. Industry
    // personalizes threat/compliance/timeline CONTEXT, never product scope.
    const filteredSoftware =
      selectedProductKeys && selectedProductKeys.length > 0
        ? (() => {
            const keySet = new Set(selectedProductKeys)
            return softwareData.filter((s) => keySet.has(s.productId))
          })()
        : softwareData

    const vendorsByLayer = new Map<string, SoftwareItem[]>()
    const vendorsByDomain = new Map<DomainId, SoftwareItem[]>()
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

      const domain = classifyProductDomain(s.categoryName, s.infrastructureLayer)
      if (domain) {
        const existing = vendorsByDomain.get(domain)
        if (existing) existing.push(s)
        else vendorsByDomain.set(domain, [s])
      }

      if (isFips1403Validated(s.fipsValidated)) fipsValidatedCount++
      if (isPqcReady(s.pqcSupport)) pqcReadyCount++
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
    // Same sector-key join as threats above ('Finance & Banking' must match a
    // framework tagged 'Financial Services'); unknown spellings fall back to
    // the old substring test inside matchesIndustry.
    const frameworksByIndustry = effectiveIndustry
      ? complianceFrameworks.filter(
          (f) =>
            f.industries.length === 0 ||
            f.industries.some((ind) => matchesIndustry(ind, effectiveIndustry))
        )
      : complianceFrameworks

    // ── Timeline ──────────────────────────────────────────────────────────
    const userCountryData = country
      ? (timelineData.find((c) => c.countryName.toLowerCase() === country.toLowerCase()) ?? null)
      : null

    // ── Cross-page user selections (resolve IDs to records) ───────────────
    const myProductsSet = new Set(myProductIds)
    const myProducts = softwareData.filter((s) => myProductsSet.has(s.productId))

    const myThreatsSet = new Set(myThreatIds)
    const myThreats = threatsData.filter((t) => myThreatsSet.has(t.threatId))

    const myTimelineCountrySet = new Set(myTimelineCountries.map((n) => n.toLowerCase()))
    const myTimelineCountryData = timelineData.filter((c) =>
      myTimelineCountrySet.has(c.countryName.toLowerCase())
    )

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
      vendorsByDomain,
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
      tnflRiskWindow: lastResult?.tnflRiskWindow ?? null,
      categoryScores: lastResult?.categoryScores ?? null,
      categoryDrivers: lastResult?.categoryDrivers ?? null,
      migrationEffort: lastResult?.migrationEffort ?? [],
      algorithmMigrations: lastResult?.algorithmMigrations ?? [],
      keyFindings: lastResult?.keyFindings ?? [],
      assessmentProfile: lastResult?.assessmentProfile ?? null,
      myFrameworks,
      myProductIds,
      myProducts,
      myThreatIds,
      myThreats,
      myTimelineCountries,
      myTimelineCountryData,
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
    myFrameworks,
    myProductIds,
    myThreatIds,
    myTimelineCountries,
  ])
}
