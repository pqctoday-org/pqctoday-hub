// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import breachData from '@/data/actuarial/breachCostByIndustry.json'
import hndlData from '@/data/actuarial/hndlExposureCurve.json'
import coverageData from '@/data/actuarial/coverageGapMatrix.json'

export type InsuranceScenario = 'optimistic' | 'pessimistic'

export interface InsuranceLensInputs {
  /** Industry key matching breachCostByIndustry.json id field */
  industryId: string
  scenario: InsuranceScenario
  /** 0–1: fraction of infrastructure migrated by each year (index 0 = 2026) */
  migratedFractionByYear: number[]
  /** Multiplier on breach cost — default 1.0; slider range 0.5–2.0 */
  breachCostMult: number
  /** Override on regulatory fine multiplier — default 1.0 */
  fineMult: number
}

export interface CoverageGapEntry {
  scenario: string
  scenarioLabel: string
  status: 'covered' | 'excluded' | 'ambiguous'
}

export interface ActuarialModelOutput {
  years: number[]
  /** Annual Loss Expectancy by year — optimistic and pessimistic HNDL curves */
  aleOptimistic: number[]
  alePessimistic: number[]
  /** Projected premium impact as a multiplier vs today's base premium (e.g. 1.25 = +25%) */
  premiumImpactMultiplier: number
  coverageGaps: CoverageGapEntry[]
  inputsUsed: InsuranceLensInputs & {
    costPerRecord: number
    meanBreachRecords: number
    industryLabel: string
  }
}

const YEARS = hndlData.years
const HNDL_OPTIMISTIC = hndlData.optimistic
const HNDL_PESSIMISTIC = hndlData.pessimistic

function getSensitivityMult(industryId: string): number {
  // Industries handling highly sensitive regulated data carry a higher exposure multiplier
  const highSensitivity = new Set(['healthcare', 'financial', 'government'])
  const medSensitivity = new Set(['energy', 'telecom', 'technology'])
  if (highSensitivity.has(industryId)) return 1.3
  if (medSensitivity.has(industryId)) return 1.1
  return 1.0
}

function getPremiumImpactMultiplier(industryId: string, avgMigrationFraction: number): number {
  // Anchored to NetDiligence quantum-rider data: +15% (fully migrated) to +50% (not migrated)
  // Insurers also weight industry risk tier
  const industryRisk = getSensitivityMult(industryId)
  // Linear interpolation: 0% migrated → max uplift; 100% migrated → min uplift
  const baseUplift = 0.15 + (1 - avgMigrationFraction) * 0.35
  return 1 + baseUplift * industryRisk
}

export function useActuarialModel(inputs: InsuranceLensInputs): ActuarialModelOutput {
  return useMemo(() => {
    const industryRecord =
      breachData.industries.find((i) => i.id === inputs.industryId) ?? breachData.industries[0]

    const costPerRecord = industryRecord.meanCostPerRecord * inputs.breachCostMult
    const meanBreachRecords = industryRecord.meanBreachRecords
    const maxFineMultiplier =
      Math.max(...Object.values(industryRecord.regulatoryMultipliers)) * inputs.fineMult
    const sensitivityMult = getSensitivityMult(inputs.industryId)

    const baseExposure = costPerRecord * meanBreachRecords * maxFineMultiplier * sensitivityMult

    const aleOptimistic = YEARS.map((_, i) => {
      const migrated = inputs.migratedFractionByYear[i] ?? 0
      return Math.round(baseExposure * HNDL_OPTIMISTIC[i] * (1 - migrated))
    })

    const alePessimistic = YEARS.map((_, i) => {
      const migrated = inputs.migratedFractionByYear[i] ?? 0
      return Math.round(baseExposure * HNDL_PESSIMISTIC[i] * (1 - migrated))
    })

    // Average migration fraction across the planning horizon (2026-2035)
    const avgMigration =
      inputs.migratedFractionByYear.reduce((s, v) => s + v, 0) /
      Math.max(1, inputs.migratedFractionByYear.length)

    const premiumImpactMultiplier = getPremiumImpactMultiplier(inputs.industryId, avgMigration)

    // Coverage gaps — show for the selected industry if available, else first available
    const matrixKey = coverageData.industries.includes(inputs.industryId)
      ? inputs.industryId
      : coverageData.industries[0]

    const industryMatrix =
      (coverageData.matrix as Record<string, Record<string, string>>)[matrixKey] ?? {}
    const coverageGaps: CoverageGapEntry[] = coverageData.scenarios.map((s) => ({
      scenario: s.id,
      scenarioLabel: s.label,

      status: (industryMatrix[s.id] ?? 'ambiguous') as CoverageGapEntry['status'],
    }))

    return {
      years: YEARS,
      aleOptimistic,
      alePessimistic,
      premiumImpactMultiplier,
      coverageGaps,
      inputsUsed: {
        ...inputs,
        costPerRecord,
        meanBreachRecords,
        industryLabel: industryRecord.label,
      },
    }
  }, [inputs])
}
