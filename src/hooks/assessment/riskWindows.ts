import {
  ALGORITHM_DB,
  USE_CASE_WEIGHTS,
  AGILITY_COMPLEXITY,
  SYSTEM_SCALE,
  CREDENTIAL_LIFETIME_YEARS,
  ESTIMATED_QUANTUM_THREAT_YEAR,
  COUNTRY_PLANNING_HORIZON,
  SIGNING_ALGORITHMS,
} from '../assessmentData'

import type {
  AssessmentInput,
  HNDLRiskWindow,
  TNFLRiskWindow,
  MigrationEffortItem,
} from '../assessmentTypes'

import { getMaxRetentionYears, getIndustryRetentionDefault } from './scoring'

export function getEffectiveThreatYear(country?: string): number {
  return Math.min(
    ESTIMATED_QUANTUM_THREAT_YEAR,
    COUNTRY_PLANNING_HORIZON[country ?? ''] ?? ESTIMATED_QUANTUM_THREAT_YEAR
  )
}

/**
 * Splits the effective "act-by" year into its two distinct drivers so the report
 * never conflates a regulatory mandate with the arrival of a quantum computer:
 *  - crqc: the cryptographically-relevant quantum computer arrival estimate
 *  - regulatory: the jurisdiction's mandate horizon, ONLY when it binds earlier
 *    than the CRQC estimate (otherwise undefined — the CRQC estimate governs)
 *  - effective: the earlier of the two (the conservative deadline)
 */
export function getThreatHorizon(country?: string): {
  effective: number
  crqc: number
  regulatory?: number
} {
  const crqc = ESTIMATED_QUANTUM_THREAT_YEAR
  const horizon = COUNTRY_PLANNING_HORIZON[country ?? '']
  const regulatory = horizon !== undefined && horizon < crqc ? horizon : undefined
  return { effective: Math.min(crqc, horizon ?? crqc), crqc, regulatory }
}

export function computeHNDLRiskWindow(input: AssessmentInput): HNDLRiskWindow | undefined {
  const isEstimated = !!input.retentionUnknown
  if (!input.dataRetention?.length && !isEstimated) return undefined
  const currentYear = new Date().getFullYear()
  const retentionYears = isEstimated
    ? getIndustryRetentionDefault(input.industry)
    : getMaxRetentionYears(input.dataRetention ?? [])
  const horizon = getThreatHorizon(input.country)
  const dataExpirationYear = currentYear + retentionYears
  const riskWindowYears = dataExpirationYear - horizon.effective
  return {
    dataRetentionYears: retentionYears,
    estimatedQuantumThreatYear: horizon.effective,
    crqcEstimateYear: horizon.crqc,
    regulatoryHorizonYear: horizon.regulatory,
    currentYear,
    isAtRisk: riskWindowYears > 0,
    riskWindowYears: Math.max(0, riskWindowYears),
    isEstimated,
  }
}

export function computeTNFLRiskWindow(input: AssessmentInput): TNFLRiskWindow | undefined {
  const isEstimated = !!input.credentialLifetimeUnknown
  if (!input.credentialLifetime?.length && !isEstimated) return undefined
  const currentYear = new Date().getFullYear()
  const hasSigningAlgorithms =
    (input.currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a)) ||
    !!input.currentCryptoUnknown
  const lifetimeYears = isEstimated
    ? 10
    : Math.max(
        ...input.credentialLifetime!.map((v) => CREDENTIAL_LIFETIME_YEARS[v] ?? 0) // eslint-disable-line security/detect-object-injection
      )
  const horizon = getThreatHorizon(input.country)
  const credentialExpiryYear = currentYear + lifetimeYears
  const riskWindowYears = credentialExpiryYear - horizon.effective
  const tnflRelevantUseCases = (input.cryptoUseCases ?? []).filter(
    (uc) => (USE_CASE_WEIGHTS[uc]?.tnflRelevance ?? 0) >= 7 // eslint-disable-line security/detect-object-injection
  )
  return {
    credentialLifetimeYears: lifetimeYears,
    estimatedQuantumThreatYear: horizon.effective,
    crqcEstimateYear: horizon.crqc,
    regulatoryHorizonYear: horizon.regulatory,
    currentYear,
    isAtRisk: riskWindowYears > 0 && hasSigningAlgorithms,
    riskWindowYears: Math.max(0, riskWindowYears),
    hasSigningAlgorithms,
    tnflRelevantUseCases,
    isEstimated,
  }
}

export function computeMigrationEffort(input: AssessmentInput): MigrationEffortItem[] {
  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const hasHSM = input.infrastructure?.some((i) => i.includes('HSM')) ?? false
  const hasLegacy = input.infrastructure?.some((i) => i.includes('Legacy')) ?? false
  const sysScale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3
  return input.currentCrypto
    .filter((algo) => ALGORITHM_DB[algo]?.quantumVulnerable) // eslint-disable-line security/detect-object-injection
    .map((algo) => {
      const complexityScore =
        agilityFactor * 40 + (hasHSM ? 20 : 0) + (hasLegacy ? 15 : 0) + sysScale * 5

      // Complexity emits only 'low' | 'medium' | 'high' — matches the
      // effortConfig rendering in ReportContent. A very high complexityScore
      // collapses to 'high' here; the "multi-year" estimatedScope below
      // already surfaces the extreme case to the user.
      const complexity: MigrationEffortItem['complexity'] =
        complexityScore <= 25 ? 'low' : complexityScore <= 45 ? 'medium' : 'high'

      const estimatedScope: MigrationEffortItem['estimatedScope'] =
        complexityScore <= 25
          ? 'quick-win'
          : complexityScore <= 45
            ? 'moderate'
            : complexityScore <= 65
              ? 'major-project'
              : 'multi-year'

      const reasons: string[] = []
      if (agilityFactor >= 0.9) reasons.push('hardcoded crypto')
      else if (agilityFactor >= 0.5) reasons.push('partial abstraction')
      if (hasHSM) reasons.push('HSM dependency')
      if (hasLegacy) reasons.push('legacy systems')
      if (sysScale >= 1.6) reasons.push('large system footprint')

      return {
        algorithm: algo,
        complexity,
        estimatedScope,
        rationale:
          reasons.length > 0
            ? `Complexity driven by: ${reasons.join(', ')}.`
            : 'Standard migration with manageable complexity.',
      }
    })
}
