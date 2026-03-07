import {
  ALGORITHM_DB,
  DATA_RETENTION_YEARS,
  DATA_SENSITIVITY_SCORES,
  USE_CASE_WEIGHTS,
  ALGORITHM_WEIGHTS,
  DEFAULT_ALGORITHM_WEIGHT,
  AGILITY_COMPLEXITY,
  INFRA_COMPLEXITY,
  SYSTEM_SCALE,
  VENDOR_DEPENDENCY_WEIGHT,
  INDUSTRY_THREAT,
  COUNTRY_REGULATORY_URGENCY,
  TIMELINE_URGENCY,
  TEAM_CAPACITY,
  CREDENTIAL_LIFETIME_YEARS,
  INDUSTRY_COMPOSITE_WEIGHTS,
  DEFAULT_COMPOSITE_WEIGHTS,
  SIGNING_ALGORITHMS,
} from '../assessmentData'

import {
  industryRetentionConfigs,
  universalRetentionConfigs,
  getIndustryConfigs,
} from '../../data/industryAssessConfig'

const ALL_RETENTION_CONFIGS = [...industryRetentionConfigs, ...universalRetentionConfigs]

import type { AssessmentInput, ComplianceImpact, CategoryScores } from '../assessmentTypes'

export function computeQuantumExposure(input: AssessmentInput, vulnerableCount: number): number {
  if (input.currentCryptoUnknown) {
    const sensitivityScore = Math.min(
      15,
      (DATA_SENSITIVITY_SCORES[getMaxSensitivity(input.dataSensitivity)] ?? 0) * 0.6
    )
    const useCaseScore = input.cryptoUseCases?.length
      ? Math.min(
          25,
          input.cryptoUseCases.reduce(
            (s, uc) => s + (USE_CASE_WEIGHTS[uc]?.hndlRelevance ?? 5), // eslint-disable-line security/detect-object-injection
            0
          ) * 2.5
        )
      : 10
    return Math.min(100, Math.round(20 + useCaseScore + sensitivityScore))
  }

  let base = 0
  const vulnerableAlgos = input.currentCrypto.filter(
    (a) => ALGORITHM_DB[a]?.quantumVulnerable // eslint-disable-line security/detect-object-injection
  )
  vulnerableAlgos.forEach((algo, i) => {
    // eslint-disable-next-line security/detect-object-injection
    const weight = ALGORITHM_WEIGHTS[algo] ?? DEFAULT_ALGORITHM_WEIGHT
    base += i < 3 ? weight : Math.round(weight * 0.5)
  })
  const algoScore = Math.min(40, base)
  let useCaseScore = 0
  if (input.cryptoUseCases?.length) {
    const totalHndl = input.cryptoUseCases.reduce((sum, uc) => {
      // eslint-disable-next-line security/detect-object-injection
      return sum + (USE_CASE_WEIGHTS[uc]?.hndlRelevance ?? 5)
    }, 0)
    useCaseScore = Math.min(25, totalHndl * 2.5)
  } else if (vulnerableCount > 0) {
    useCaseScore = 10 // default if use cases not specified but has vulnerable algos
  }

  let retentionScore = 0
  if (input.retentionUnknown) {
    // Industry-aware conservative default (e.g., 75y gov, 40y aerospace, min 15y)
    const conservativeYears = getIndustryRetentionDefault(input.industry)
    retentionScore = Math.min(20, conservativeYears * 0.8)
  } else if (input.dataRetention?.length) {
    const years = getMaxRetentionYears(input.dataRetention)
    retentionScore = Math.min(20, years * 0.8)
  } else {
    // Estimate from sensitivity for legacy inputs
    const ms = getMaxSensitivity(input.dataSensitivity)
    retentionScore = ms === 'critical' ? 16 : ms === 'high' ? 10 : ms === 'medium' ? 4 : 0
  }

  const effectiveSensitivity = input.sensitivityUnknown
    ? 'high'
    : getMaxSensitivity(input.dataSensitivity)
  const sensitivityScore = Math.min(
    15,
    (DATA_SENSITIVITY_SCORES[effectiveSensitivity] ?? 0) * 0.6 // eslint-disable-line security/detect-object-injection
  )
  return Math.max(
    0,
    Math.min(100, Math.round(algoScore + useCaseScore + retentionScore + sensitivityScore))
  )
}

export function computeMigrationComplexity(input: AssessmentInput): number {
  const isExec = input.persona === 'executive'
  let agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  // Executives aren't expected to know technical details — reduce unknown penalty
  if (isExec && (input.cryptoAgility === 'unknown' || !input.cryptoAgility)) {
    agilityFactor *= 0.85
  }
  const agilityScore = agilityFactor * 40
  let infraScore = 0
  if (input.infrastructureUnknown) {
    infraScore = isExec ? 12 : 15 // executive penalty softened — they delegate this
  } else if (input.infrastructure?.length) {
    const totalInfra = input.infrastructure.reduce((sum, item) => {
      // eslint-disable-next-line security/detect-object-injection
      return sum + (INFRA_COMPLEXITY[item] ?? 5)
    }, 0)
    infraScore = Math.min(30, totalInfra)
  } else {
    infraScore = 10 // moderate default
  }

  const scale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3
  const scaleScore = Math.min(15, scale * 7.5)
  const effectiveVendorWeight = input.vendorUnknown
    ? VENDOR_DEPENDENCY_WEIGHT['heavy-vendor'] * 0.8 // conservative but not worst-case
    : (VENDOR_DEPENDENCY_WEIGHT[input.vendorDependency ?? 'mixed'] ?? 10)
  const vendorScore = Math.min(15, effectiveVendorWeight * 0.75)
  return Math.max(
    0,
    Math.min(100, Math.round(agilityScore + infraScore + scaleScore + vendorScore))
  )
}

export function computeRegulatoryPressure(
  input: AssessmentInput,
  complianceImpacts: ComplianceImpact[]
): number {
  const currentYear = new Date().getFullYear()
  const pqcCompliance = complianceImpacts.filter((c) => c.requiresPQC)

  // Deadline-aware framework scoring: closer deadlines score higher
  let frameworkScore = 0
  for (const fw of pqcCompliance) {
    const deadlineYear = parseDeadlineYear(fw.deadline)
    if (!deadlineYear) {
      // Ongoing/unknown/malformed deadline → moderate score
      if (fw.deadline && !['Ongoing', 'TBD', 'N/A', 'Unknown'].includes(fw.deadline)) {
        console.warn(
          `[Assess] Could not parse deadline year from "${fw.deadline}" for framework "${fw.framework}"`
        )
      }
      frameworkScore += 10
    } else {
      const yearsUntil = deadlineYear - currentYear
      if (yearsUntil <= 0)
        frameworkScore += 15 // deadline passed — very urgent
      else if (yearsUntil <= 2)
        frameworkScore += 14 // imminent
      else if (yearsUntil <= 5)
        frameworkScore += 12 // near-term
      else frameworkScore += 8 // distant
    }
  }
  frameworkScore = Math.min(45, frameworkScore)

  const industryBase = INDUSTRY_THREAT[input.industry] ?? 10
  const industryRegScore = Math.min(30, industryBase * 0.85) // cap at 30 to preserve ranking between top industries
  const countryUrgency = COUNTRY_REGULATORY_URGENCY[input.country ?? ''] ?? 0
  const timelineMul = TIMELINE_URGENCY[input.timelinePressure ?? 'unknown'] ?? 1.1
  const raw = (frameworkScore + industryRegScore + countryUrgency) * timelineMul
  return Math.max(0, Math.min(100, Math.round(raw)))
}

export function computeOrganizationalReadiness(input: AssessmentInput): number {
  const isExec = input.persona === 'executive'
  const statusScores: Record<string, number> = {
    started: 5,
    planning: 20,
    'not-started': 35,
    unknown: isExec ? 35 : 40, // executive "unknown" slightly less punitive
  }
  const statusScore = statusScores[input.migrationStatus] ?? 30
  const sysScale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3
  const teamCap = TEAM_CAPACITY[input.teamSize ?? '11-50'] ?? 0.6
  const capacityGap = sysScale / teamCap
  const capacityScore = Math.min(25, Math.round(capacityGap * 8))
  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const readinessAgilityScore = Math.round(agilityFactor * 20)
  const vendorWeight = input.vendorUnknown
    ? VENDOR_DEPENDENCY_WEIGHT['heavy-vendor'] * 0.8 // conservative but not worst-case
    : (VENDOR_DEPENDENCY_WEIGHT[input.vendorDependency ?? 'mixed'] ?? 10)
  const vendorReadiness = Math.min(15, Math.round(vendorWeight * 0.75))
  return Math.max(
    0,
    Math.min(100, statusScore + capacityScore + readinessAgilityScore + vendorReadiness)
  )
}

export function computeCompositeScore(
  categoryScores: CategoryScores,
  input: AssessmentInput
): number {
  const w = INDUSTRY_COMPOSITE_WEIGHTS[input.industry] ?? DEFAULT_COMPOSITE_WEIGHTS
  let composite =
    categoryScores.quantumExposure * w.qe +
    categoryScores.migrationComplexity * w.mc +
    categoryScores.regulatoryPressure * w.rp +
    categoryScores.organizationalReadiness * w.or

  // Situational risk multipliers — each adds an increment, capped at 1.20x total to
  // prevent compound stacking from producing surprising score jumps.
  // Rationale: these conditions represent compounding risk factors that warrant a
  // moderate uplift, but the base category scores already capture most of the signal.
  let boostFactor = 1.0

  // Critical sensitivity + long retention + not yet migrating → HNDL urgency
  if (
    input.dataSensitivity.includes('critical') &&
    input.dataRetention?.length &&
    getMaxRetentionYears(input.dataRetention) > 10 &&
    input.migrationStatus !== 'started'
  ) {
    boostFactor += 0.08
  }

  // Signing algos + long credential lifetime + not yet migrating → HNFL urgency
  const hasSigningAlgos = (input.currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a))
  if (
    hasSigningAlgos &&
    input.credentialLifetime?.length &&
    Math.max(...input.credentialLifetime.map((v) => CREDENTIAL_LIFETIME_YEARS[v] ?? 0)) > 10 && // eslint-disable-line security/detect-object-injection
    input.migrationStatus !== 'started'
  ) {
    boostFactor += 0.06
  }

  // Gov & Defense + CNSA 2.0 compliance + not yet migrating → regulatory urgency
  if (
    input.industry === 'Government & Defense' &&
    input.complianceRequirements.includes('CNSA 2.0') &&
    input.migrationStatus !== 'started'
  ) {
    boostFactor += 0.04
  }

  // Hardcoded crypto + HSM/Legacy infra → migration inertia
  if (
    input.cryptoAgility === 'hardcoded' &&
    input.infrastructure?.some((i) => i.includes('HSM') || i.includes('Legacy'))
  ) {
    boostFactor += 0.04
  }

  composite *= Math.min(1.2, boostFactor)

  return Math.max(0, Math.min(100, Math.round(composite)))
}

export function getMaxSensitivity(arr: string[]): string {
  for (const level of ['critical', 'high', 'medium', 'low']) {
    if (arr.includes(level)) return level
  }

  return 'low'
}

export function getMaxRetentionYears(arr: string[]): number {
  if (!arr.length) return 0
  return Math.max(
    ...arr.map((r) => {
      const cfg = ALL_RETENTION_CONFIGS.find((c) => c.id === r)
      if (cfg) return cfg.retentionYears
      // eslint-disable-next-line security/detect-object-injection
      return DATA_RETENTION_YEARS[r] ?? 0
    })
  )
}

export function parseDeadlineYear(deadline: string): number | null {
  const match = deadline.match(/\b(20\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

export function getIndustryRetentionDefault(industry: string): number {
  const configs = getIndustryConfigs(industryRetentionConfigs, industry)
  const industryMax = configs.length > 0 ? Math.max(...configs.map((r) => r.retentionYears)) : 15
  return Math.max(15, industryMax) // never weaken below 15-year baseline
}
