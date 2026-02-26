import {
  ALGORITHM_DB,
  COMPLIANCE_DB,
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
  ESTIMATED_QUANTUM_THREAT_YEAR,
  MIGRATION_STATUS_SCORES,
  COUNTRY_PLANNING_HORIZON,
  INDUSTRY_COMPOSITE_WEIGHTS,
  DEFAULT_COMPOSITE_WEIGHTS,
} from './assessmentData'

import {
  industryRetentionConfigs,
  universalRetentionConfigs,
  industryComplianceConfigs,
  getIndustryConfigs,
} from '../data/industryAssessConfig'

const ALL_RETENTION_CONFIGS = [...industryRetentionConfigs, ...universalRetentionConfigs]

import { useMemo } from 'react'
import { SIGNING_ALGORITHMS } from './assessmentData'
import type {
  AssessmentInput,
  AssessmentProfile,
  ComplianceImpact,
  CategoryScores,
  CategoryDrivers,
  HNDLRiskWindow,
  HNFLRiskWindow,
  MigrationEffortItem,
  RecommendedAction,
  AssessmentResult,
  AlgorithmMigration,
} from './assessmentTypes'

/** Returns the highest sensitivity level present in the array. */
function getMaxSensitivity(arr: string[]): string {
  for (const level of ['critical', 'high', 'medium', 'low']) {
    if (arr.includes(level)) return level
  }

  return 'low'
}

/** Returns the maximum retention years across all selected retention periods. */
function getMaxRetentionYears(arr: string[]): number {
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

function computeQuantumExposure(input: AssessmentInput, vulnerableCount: number): number {
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

function computeMigrationComplexity(input: AssessmentInput): number {
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

/** Extract the earliest 4-digit year from a freeform deadline string. */
function parseDeadlineYear(deadline: string): number | null {
  const match = deadline.match(/\b(20\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

function computeRegulatoryPressure(
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

function computeOrganizationalReadiness(input: AssessmentInput): number {
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

function computeCompositeScore(categoryScores: CategoryScores, input: AssessmentInput): number {
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

/** Effective planning horizon: country-specific if available, else global default. */
function getEffectiveThreatYear(country?: string): number {
  return Math.min(
    ESTIMATED_QUANTUM_THREAT_YEAR,
    COUNTRY_PLANNING_HORIZON[country ?? ''] ?? ESTIMATED_QUANTUM_THREAT_YEAR
  )
}

/** Industry-aware conservative retention default when user selects "I don't know". */
function getIndustryRetentionDefault(industry: string): number {
  const configs = getIndustryConfigs(industryRetentionConfigs, industry)
  const industryMax = configs.length > 0 ? Math.max(...configs.map((r) => r.retentionYears)) : 15
  return Math.max(15, industryMax) // never weaken below 15-year baseline
}

function computeHNDLRiskWindow(input: AssessmentInput): HNDLRiskWindow | undefined {
  const isEstimated = !!input.retentionUnknown
  if (!input.dataRetention?.length && !isEstimated) return undefined
  const currentYear = new Date().getFullYear()
  const retentionYears = isEstimated
    ? getIndustryRetentionDefault(input.industry)
    : getMaxRetentionYears(input.dataRetention ?? [])
  const effectiveThreatYear = getEffectiveThreatYear(input.country)
  const dataExpirationYear = currentYear + retentionYears
  const riskWindowYears = dataExpirationYear - effectiveThreatYear
  return {
    dataRetentionYears: retentionYears,
    estimatedQuantumThreatYear: effectiveThreatYear,
    currentYear,
    isAtRisk: riskWindowYears > 0,
    riskWindowYears: Math.max(0, riskWindowYears),
    isEstimated,
  }
}

function computeHNFLRiskWindow(input: AssessmentInput): HNFLRiskWindow | undefined {
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
  const effectiveThreatYear = getEffectiveThreatYear(input.country)
  const credentialExpiryYear = currentYear + lifetimeYears
  const riskWindowYears = credentialExpiryYear - effectiveThreatYear
  const hnflRelevantUseCases = (input.cryptoUseCases ?? []).filter(
    (uc) => (USE_CASE_WEIGHTS[uc]?.hnflRelevance ?? 0) >= 7 // eslint-disable-line security/detect-object-injection
  )
  return {
    credentialLifetimeYears: lifetimeYears,
    estimatedQuantumThreatYear: effectiveThreatYear,
    currentYear,
    isAtRisk: riskWindowYears > 0 && hasSigningAlgorithms,
    riskWindowYears: Math.max(0, riskWindowYears),
    hasSigningAlgorithms,
    hnflRelevantUseCases,
    isEstimated,
  }
}

function computeMigrationEffort(input: AssessmentInput): MigrationEffortItem[] {
  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const hasHSM = input.infrastructure?.some((i) => i.includes('HSM')) ?? false
  const hasLegacy = input.infrastructure?.some((i) => i.includes('Legacy')) ?? false
  const sysScale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3
  return input.currentCrypto
    .filter((algo) => ALGORITHM_DB[algo]?.quantumVulnerable) // eslint-disable-line security/detect-object-injection
    .map((algo) => {
      const complexityScore =
        agilityFactor * 40 + (hasHSM ? 20 : 0) + (hasLegacy ? 15 : 0) + sysScale * 5

      const complexity: MigrationEffortItem['complexity'] =
        complexityScore <= 25
          ? 'low'
          : complexityScore <= 45
            ? 'medium'
            : complexityScore <= 65
              ? 'high'
              : 'critical'

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

function buildAlgorithmHighlightUrl(algorithms: string[]): string {
  if (algorithms.length === 0) return '/algorithms'
  return `/algorithms?highlight=${encodeURIComponent(algorithms.join(','))}`
}

function buildThreatsUrl(industry?: string): string {
  if (!industry) return '/threats'
  return `/threats?industry=${encodeURIComponent(industry)}`
}

function generateCategoryDrivers(
  input: AssessmentInput,
  vulnerableCount: number,
  pqcCount: number
): CategoryDrivers {
  // Quantum Exposure drivers
  const qeParts: string[] = []
  if (input.currentCryptoUnknown) {
    qeParts.push('algorithms unknown (conservative)')
  } else if (vulnerableCount > 0) {
    qeParts.push(`${vulnerableCount} vulnerable algorithm${vulnerableCount !== 1 ? 's' : ''}`)
  } else {
    qeParts.push('no vulnerable algorithms')
  }
  const maxSens = input.sensitivityUnknown
    ? 'high (assumed)'
    : getMaxSensitivity(input.dataSensitivity)
  qeParts.push(`${maxSens} sensitivity`)
  if (input.retentionUnknown) {
    qeParts.push(`${getIndustryRetentionDefault(input.industry)}y retention (assumed)`)
  } else if (input.dataRetention?.length) {
    qeParts.push(`${getMaxRetentionYears(input.dataRetention)}y retention`)
  }

  // Migration Complexity drivers
  const mcParts: string[] = []
  const agilityLabels: Record<string, string> = {
    'fully-abstracted': 'abstracted',
    'partially-abstracted': 'partial',
    hardcoded: 'hardcoded',
    unknown: 'unknown',
  }
  mcParts.push(`${agilityLabels[input.cryptoAgility ?? 'unknown'] ?? 'unknown'} crypto agility`)
  if (input.infrastructureUnknown) {
    mcParts.push('infrastructure unknown')
  } else if (input.infrastructure?.length) {
    mcParts.push(
      `${input.infrastructure.length} infra type${input.infrastructure.length !== 1 ? 's' : ''}`
    )
  }
  if (input.systemCount) mcParts.push(`${input.systemCount} systems`)

  // Regulatory Pressure drivers
  const rpParts: string[] = []
  if (pqcCount > 0) {
    rpParts.push(`${pqcCount} PQC mandate${pqcCount !== 1 ? 's' : ''}`)
  } else {
    rpParts.push('no PQC mandates')
  }
  rpParts.push(input.industry)
  if (input.country) rpParts.push(input.country)

  // Organizational Readiness drivers
  const orParts: string[] = []
  const statusLabels: Record<string, string> = {
    started: 'migration started',
    planning: 'planning phase',
    'not-started': 'not started',
    unknown: 'status unknown',
  }
  orParts.push(statusLabels[input.migrationStatus] ?? input.migrationStatus)
  if (input.systemCount && input.teamSize) {
    orParts.push(`${input.systemCount} systems / ${input.teamSize} team`)
  }
  const vendorLabel = input.vendorUnknown
    ? 'vendor unknown'
    : input.vendorDependency === 'heavy-vendor'
      ? 'heavy vendor dependency'
      : input.vendorDependency === 'in-house'
        ? 'in-house crypto'
        : (input.vendorDependency ?? '')
  if (vendorLabel) orParts.push(vendorLabel)

  return {
    quantumExposure: qeParts.join(', '),
    migrationComplexity: mcParts.join(', '),
    regulatoryPressure: rpParts.join(', '),
    organizationalReadiness: orParts.join(', '),
  }
}

function generateExtendedActions(
  input: AssessmentInput,
  vulnerableCount: number,
  pqcCompliance: ComplianceImpact[],
  migrationEffort: MigrationEffortItem[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = []
  let priority = 1
  if (input.currentCryptoUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Conduct a cryptographic asset inventory to identify all algorithms in use across systems, services, and dependencies.',
      category: 'immediate',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  if (input.sensitivityUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Conduct a data classification exercise to identify the sensitivity levels of data protected by cryptography — this determines Harvest-Now-Decrypt-Later exposure and appropriate encryption requirements.',
      category: 'immediate',
      relatedModule: '/threats',
      effort: 'medium',
    })
  }

  if (input.retentionUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Establish a data classification and retention policy to quantify HNDL exposure for long-lived sensitive data.',
      category: 'immediate',
      relatedModule: '/threats',
      effort: 'medium',
    })
  }

  if (input.vendorUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Engage technology vendors and suppliers to document their cryptographic implementations and PQC migration roadmaps.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.credentialLifetimeUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Audit the validity periods of all certificates, signed firmware, and digital credentials to quantify Harvest-Now-Forge-Later exposure.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.complianceUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Identify applicable regulatory and compliance frameworks for your industry and region to understand PQC obligations.',
      category: 'short-term',
      relatedModule: '/compliance',
      effort: 'low',
    })
  }

  if (input.useCasesUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Map all business processes and applications that rely on cryptography to prioritize migration efforts.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.infrastructureUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Audit infrastructure for cryptographic dependencies — HSMs, legacy systems, cloud KMS, and embedded devices affect migration complexity.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  // eslint-disable-next-line security/detect-object-injection
  const vulnerableAlgoNames = input.currentCrypto.filter((a) => ALGORITHM_DB[a]?.quantumVulnerable)
  const quickWins = migrationEffort.filter((m) => m.estimatedScope === 'quick-win')
  if (quickWins.length > 0) {
    actions.push({
      priority: priority++,
      action: `Migrate ${quickWins.length} quick-win algorithm${quickWins.length > 1 ? 's' : ''} (${quickWins.map((q) => q.algorithm).join(', ')}) to PQC equivalents.`,
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(quickWins.map((q) => q.algorithm)),
      effort: 'low',
    })
  }

  const majorMigrations = migrationEffort.filter(
    (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
  )
  if (majorMigrations.length > 0) {
    actions.push({
      priority: priority++,
      action: `Plan migration for ${majorMigrations.length} high-complexity algorithm${majorMigrations.length > 1 ? 's' : ''} (${majorMigrations.map((m) => m.algorithm).join(', ')}).`,
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(majorMigrations.map((m) => m.algorithm)),
      effort: 'high',
    })
  }

  const moderateMigrations = migrationEffort.filter((m) => m.estimatedScope === 'moderate')
  if (moderateMigrations.length > 0 && quickWins.length === 0 && majorMigrations.length === 0) {
    actions.push({
      priority: priority++,
      action: `Migrate ${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount > 1 ? 's' : ''} to PQC equivalents.`,
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(vulnerableAlgoNames),
      effort: 'medium',
    })
  }

  if (input.cryptoUseCases?.includes('TLS/HTTPS') && vulnerableCount > 0) {
    const tlsAlgos = vulnerableAlgoNames.filter((a) =>
      [
        'ECDH P-256',
        'ECDH P-384',
        'ECDH P-521',
        'X25519',
        'DH (Diffie-Hellman)',
        'RSA-2048',
        'RSA-4096',
      ].includes(a)
    )
    actions.push({
      priority: priority++,
      action: 'Migrate TLS endpoints to hybrid PQC key exchange (ML-KEM + X25519).',
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(
        tlsAlgos.length > 0 ? tlsAlgos : vulnerableAlgoNames
      ),
      effort: 'medium',
    })
  }

  const hasHighSensitivity =
    input.dataSensitivity.includes('critical') || input.dataSensitivity.includes('high')
  if (
    hasHighSensitivity &&
    input.dataRetention?.length &&
    getMaxRetentionYears(input.dataRetention) > 5
  ) {
    actions.push({
      priority: priority++,
      action: 'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.',
      category: 'immediate',
      relatedModule: buildThreatsUrl(input.industry),
      effort: 'high',
    })
  } else if (hasHighSensitivity) {
    actions.push({
      priority: priority++,
      action: 'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.',
      category: 'immediate',
      relatedModule: buildThreatsUrl(input.industry),
      effort: 'medium',
    })
  }

  const hnfl = computeHNFLRiskWindow(input)
  if ((input.currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a)) && hnfl?.isAtRisk) {
    if (hnfl.hnflRelevantUseCases.some((uc) => uc.includes('PKI') || uc.includes('code signing'))) {
      actions.push({
        priority: priority++,
        action:
          'Audit Root CA and sub-CA certificate lifetimes — certificates issued today may be cryptographically broken before they expire. Plan CA key ceremonies using ML-DSA or SLH-DSA.',
        category: 'immediate',
        relatedModule: '/migrate',
        effort: 'high',
      })
    }
    actions.push({
      priority: priority++,
      action:
        'Migrate signature algorithms (RSA, ECDSA, Ed25519) to ML-DSA or SLH-DSA. Long-lived signed artifacts and credentials are vulnerable to Harvest-Now-Forge-Later attacks.',
      category: 'immediate',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  if (input.infrastructure?.some((i) => i.includes('HSM'))) {
    actions.push({
      priority: priority++,
      action: 'Evaluate HSM vendor PQC firmware roadmap and plan hardware upgrades.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  if (input.vendorDependency === 'heavy-vendor') {
    actions.push({
      priority: priority++,
      action: 'Engage SaaS and SDK vendors for PQC migration timelines and compatibility.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (pqcCompliance.length > 0) {
    actions.push({
      priority: priority++,
      action: `Review PQC requirements for ${pqcCompliance.map((c) => c.framework).join(', ')}.`,
      category: 'short-term',
      relatedModule: '/compliance',
      effort: 'low',
    })
  }

  // Industry-specific actions
  const INDUSTRY_ACTIONS: Record<
    string,
    {
      action: string
      category: RecommendedAction['category']
      effort: RecommendedAction['effort']
      relatedModule: string
    }[]
  > = {
    'Government & Defense': [
      {
        action:
          'Align all national security systems with CNSA 2.0 requirements and begin FIPS 203/204/205 module validation.',
        category: 'immediate',
        effort: 'high',
        relatedModule: '/compliance',
      },
    ],
    'Finance & Banking': [
      {
        action:
          'Coordinate with SWIFT, payment processors, and banking partners on PQC migration timelines for transaction integrity.',
        category: 'short-term',
        effort: 'medium',
        relatedModule: '/compliance',
      },
    ],
    Healthcare: [
      {
        action:
          'Assess HIPAA-covered systems and EHR/FHIR data exchange channels for PQC readiness — patient data has long retention and high HNDL exposure.',
        category: 'immediate',
        effort: 'medium',
        relatedModule: buildThreatsUrl('Healthcare'),
      },
    ],
    Telecommunications: [
      {
        action:
          'Plan PQC migration for SIM/eSIM provisioning and 5G network slicing security — these are high-value targets with complex upgrade paths.',
        category: 'short-term',
        effort: 'high',
        relatedModule: '/migrate',
      },
    ],
    'Energy & Utilities': [
      {
        action:
          'Assess SCADA/OT systems for PQC readiness — embedded controllers and legacy protocols require extended migration timelines.',
        category: 'immediate',
        effort: 'high',
        relatedModule: buildThreatsUrl('Energy & Utilities'),
      },
    ],
    Automotive: [
      {
        action:
          'Plan PQC migration for V2X communication and ECU secure boot — vehicle lifetime (15+ years) creates long HNFL exposure.',
        category: 'short-term',
        effort: 'high',
        relatedModule: '/migrate',
      },
    ],
    Aerospace: [
      {
        action:
          'Assess avionics communication and satellite link encryption for PQC readiness — aircraft lifetime (40+ years) creates extreme HNDL/HNFL exposure.',
        category: 'immediate',
        effort: 'high',
        relatedModule: buildThreatsUrl('Aerospace'),
      },
    ],
    Technology: [
      {
        action:
          'Evaluate PQC support in cloud KMS providers (AWS, Azure, GCP) and plan API gateway migration to hybrid key exchange.',
        category: 'short-term',
        effort: 'medium',
        relatedModule: '/migrate',
      },
    ],
    'Retail & E-Commerce': [
      {
        action:
          'Coordinate with payment gateway providers on PQC timeline for card transaction encryption and PCI DSS alignment.',
        category: 'short-term',
        effort: 'medium',
        relatedModule: '/compliance',
      },
    ],
    Education: [
      {
        action:
          'Assess research data repositories and student records systems for long-term encryption — FERPA-protected data has multi-decade retention requirements.',
        category: 'short-term',
        effort: 'low',
        relatedModule: buildThreatsUrl('Education'),
      },
    ],
  }
  const industryActions = INDUSTRY_ACTIONS[input.industry]
  if (industryActions) {
    for (const ia of industryActions) {
      actions.push({ priority: priority++, ...ia })
    }
  }

  if (input.migrationStatus === 'not-started' || input.migrationStatus === 'unknown') {
    actions.push({
      priority: priority++,
      action:
        'Conduct cryptographic asset inventory to identify all systems using vulnerable algorithms.',
      category: 'immediate',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.cryptoAgility === 'hardcoded') {
    actions.push({
      priority: priority++,
      action:
        'Refactor cryptographic implementations to use abstraction layers for algorithm agility.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  actions.push({
    priority: priority++,
    action: 'Evaluate PQC-ready libraries and tools for your technology stack.',
    category: 'short-term',
    relatedModule: '/migrate',
    effort: 'low',
  })
  actions.push({
    priority: priority++,
    action: 'Build PQC awareness across engineering and leadership teams.',
    category: 'long-term',
    relatedModule: '/learn',
    effort: 'low',
  })
  return actions
}

function generateExecutiveSummary(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[],
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined,
  pqcFrameworkCount: number
): string {
  const parts: string[] = []
  parts.push(
    `Your ${input.industry} organization faces a ${riskLevel} quantum risk (${riskScore}/100).`
  )
  if (vulnerableCount > 0) {
    const quickWins = migrationEffort.filter((m) => m.estimatedScope === 'quick-win').length
    const majorProjects = migrationEffort.filter(
      (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
    ).length

    const scopeParts: string[] = []
    if (quickWins > 0) scopeParts.push(`${quickWins} quick win${quickWins > 1 ? 's' : ''}`)
    if (majorProjects > 0)
      scopeParts.push(`${majorProjects} major project${majorProjects > 1 ? 's' : ''}`)
    const moderate = vulnerableCount - quickWins - majorProjects
    if (moderate > 0) scopeParts.push(`${moderate} moderate migration${moderate > 1 ? 's' : ''}`)

    parts.push(
      `${vulnerableCount} algorithm${vulnerableCount > 1 ? 's' : ''} require${vulnerableCount === 1 ? 's' : ''} migration: ${scopeParts.join(', ')}.`
    )
  }

  if (hndl?.isAtRisk) {
    parts.push(
      `Data persists ${hndl.riskWindowYears} year${hndl.riskWindowYears !== 1 ? 's' : ''} beyond the estimated quantum threat horizon, making HNDL attacks an active concern.`
    )
  }

  if (hnfl?.isAtRisk) {
    parts.push(
      `Credential lifetimes extend ${hnfl.riskWindowYears} year${hnfl.riskWindowYears !== 1 ? 's' : ''} beyond the quantum threat horizon — Harvest-Now-Forge-Later attacks on signature keys are an active concern.`
    )
  }

  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} compliance framework${pqcFrameworkCount > 1 ? 's' : ''} mandate${pqcFrameworkCount === 1 ? 's' : ''} PQC adoption.`
    )
  }

  // Country deadline context
  if (input.country) {
    const effectiveThreatYear = getEffectiveThreatYear(input.country)
    if (effectiveThreatYear < ESTIMATED_QUANTUM_THREAT_YEAR) {
      parts.push(
        `${input.country}'s regulatory framework targets PQC transition by ${effectiveThreatYear}, ahead of the global ${ESTIMATED_QUANTUM_THREAT_YEAR} planning horizon.`
      )
    }
  }

  const statusSummary: Record<string, string> = {
    started: 'Migration is underway, reducing overall risk.',
    planning: 'Migration planning is in progress — prioritize execution.',
    'not-started': 'Migration has not begun — immediate action is recommended.',
    unknown: 'Migration status is unclear — establishing a baseline is the first priority.',
  }
  parts.push(statusSummary[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateQuickSummary(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  pqcFrameworkCount: number
): string {
  const parts: string[] = []
  parts.push(
    `Your ${input.industry} organization faces a ${riskLevel} quantum risk (${riskScore}/100) based on a quick assessment.`
  )
  if (input.currentCryptoUnknown) {
    parts.push(
      'Cryptographic algorithms were not specified — conservative defaults applied. Complete a cryptographic inventory for a precise assessment.'
    )
  } else if (vulnerableCount > 0) {
    parts.push(
      `${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount > 1 ? 's' : ''} identified.`
    )
  }

  if (input.dataSensitivity.includes('critical') || input.dataSensitivity.includes('high')) {
    parts.push(
      'High data sensitivity means Harvest-Now-Decrypt-Later attacks are a concern. Run a comprehensive assessment to quantify retention risk.'
    )
  }

  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} compliance framework${pqcFrameworkCount > 1 ? 's' : ''} mandate${pqcFrameworkCount === 1 ? 's' : ''} PQC adoption.`
    )
  }

  const statusMsg: Record<string, string> = {
    started: 'Migration is underway.',
    planning: 'Migration planning is in progress — prioritize execution.',
    'not-started': 'Migration has not begun — immediate action recommended.',
    unknown: 'Migration status is unclear — establish a baseline first.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Persona-specific action reframing (presentation only — scoring untouched)
 * ────────────────────────────────────────────────────────────────────────────── */

interface ActionReframing {
  /** Substring to match in the original action text */
  pattern: string
  /** Persona-specific replacement text */
  reframings: Partial<Record<string, string>>
}

const ACTION_REFRAMINGS: ActionReframing[] = [
  {
    pattern:
      'Conduct a cryptographic asset inventory to identify all algorithms in use across systems, services, and dependencies.',
    reframings: {
      executive:
        'Commission a cryptographic asset inventory across your organization — this is the foundation for migration planning and budget estimation.',
      developer:
        'Run a dependency-level crypto audit: scan for algorithm identifiers in your codebase and audit transitive crypto library dependencies.',
      architect:
        'Map all cryptographic assets across your system topology — protocol endpoints, key stores, certificate chains, and embedded crypto.',
    },
  },
  {
    pattern:
      'Conduct cryptographic asset inventory to identify all systems using vulnerable algorithms.',
    reframings: {
      executive:
        'Commission a cryptographic asset inventory to determine which business systems require migration investment.',
      developer:
        'Scan your codebase and dependency tree for quantum-vulnerable algorithm usage before planning migration.',
      architect:
        'Map all systems consuming cryptographic services — direct and transitive — to scope the migration effort.',
    },
  },
  {
    pattern: 'Conduct a data classification exercise',
    reframings: {
      executive:
        'Commission a data classification exercise to understand which business data requires quantum-safe protection — this drives your HNDL risk exposure.',
      developer:
        'Audit the data sensitivity levels your code handles — PII, financial, and health data in long-lived stores drive HNDL risk.',
    },
  },
  {
    pattern: 'Refactor cryptographic implementations to use abstraction layers',
    reframings: {
      executive:
        'Invest in crypto-agility infrastructure — abstracting encryption from business logic reduces the cost of future algorithm transitions.',
      developer:
        'Introduce a provider/factory pattern for all crypto operations to enable algorithm-agnostic migration paths.',
      architect:
        'Design a crypto abstraction layer that supports algorithm negotiation and hybrid schemes across the infrastructure.',
    },
  },
  {
    pattern: 'Build PQC awareness across engineering and leadership teams.',
    reframings: {
      executive:
        'Brief the board and senior leadership on quantum risk and the PQC migration investment timeline.',
      developer:
        'Complete PQC learning modules relevant to your stack and share findings with your engineering team.',
      architect:
        'Conduct architecture review workshops focused on PQC migration patterns and hybrid deployment strategies.',
    },
  },
  {
    pattern: 'Evaluate PQC-ready libraries and tools for your technology stack.',
    reframings: {
      executive:
        'Direct your engineering leads to evaluate quantum-safe encryption libraries and estimate integration costs.',
      developer:
        'Benchmark PQC library candidates (liboqs, OpenSSL 3.5+, BoringSSL) against your performance and compatibility requirements.',
      architect:
        'Evaluate PQC-ready libraries for compatibility with your infrastructure topology, HSM integrations, and deployment pipeline.',
    },
  },
  {
    pattern: 'Migrate TLS endpoints to hybrid PQC key exchange',
    reframings: {
      executive:
        'Prioritize TLS migration to hybrid quantum-safe encryption — this protects data in transit immediately and demonstrates compliance progress.',
      developer:
        'Configure hybrid ML-KEM + X25519 key exchange on your TLS endpoints — start with non-critical services to validate performance.',
      architect:
        'Plan TLS migration as a phased rollout: hybrid ML-KEM + X25519 at edge gateways first, then propagate to internal service mesh.',
    },
  },
  {
    pattern: 'Evaluate HSM vendor PQC firmware roadmap',
    reframings: {
      executive:
        'Engage your HSM vendor about PQC firmware upgrade timelines and budget — HSMs are typically the highest-cost migration item.',
      architect:
        'Evaluate HSM vendor PQC firmware roadmap and plan trust root migration sequence — HSMs constrain the entire certificate chain.',
    },
  },
  {
    pattern: 'Implement hybrid PQC encryption for data-at-rest',
    reframings: {
      executive:
        'Prioritize hybrid quantum-safe encryption for your most sensitive stored data — this mitigates the Harvest-Now-Decrypt-Later threat immediately.',
      developer:
        'Implement hybrid PQC encryption (ML-KEM + AES) for data-at-rest in your highest-sensitivity data stores.',
      architect:
        'Design a hybrid PQC encryption layer for data-at-rest that integrates with your KMS topology and key rotation policies.',
    },
  },
  {
    pattern: 'Engage SaaS and SDK vendors for PQC migration timelines',
    reframings: {
      executive:
        'Request PQC migration roadmaps from your SaaS and SDK vendors — their timelines may constrain your own migration schedule.',
      developer:
        'Check your vendor SDKs and SaaS APIs for PQC support — file feature requests and track their migration roadmaps.',
    },
  },
]

/** Post-process recommended actions to use persona-appropriate language. */
function reframeActionsForPersona(
  actions: RecommendedAction[],
  persona: string
): RecommendedAction[] {
  return actions.map((action) => {
    for (const reframing of ACTION_REFRAMINGS) {
      if (action.action.includes(reframing.pattern)) {
        // eslint-disable-next-line security/detect-object-injection
        const replacement = reframing.reframings[persona]
        if (replacement) {
          return { ...action, action: replacement }
        }
        break
      }
    }
    return action
  })
}

export function computeAssessment(input: AssessmentInput): AssessmentResult {
  const algorithmMigrations: AlgorithmMigration[] = input.currentCryptoUnknown
    ? [
        {
          classical: 'Unknown algorithms (inventory required)',
          quantumVulnerable: true,
          replacement: 'Complete a cryptographic asset inventory first',
          urgency: 'immediate' as const,
          notes:
            'Cryptographic algorithms not identified. Conduct a full cryptographic asset inventory before migration planning.',
        },
      ]
    : input.currentCrypto.map((algo) => {
        // eslint-disable-next-line security/detect-object-injection
        const info = ALGORITHM_DB[algo]
        if (!info) {
          return {
            classical: algo,
            quantumVulnerable: true, // conservative: unknown algorithms treated as vulnerable
            replacement: 'Unknown — review manually',
            urgency: 'immediate' as const,
            notes:
              'Algorithm not in assessment database. Treated as quantum-vulnerable (conservative). Manual review recommended.',
          }
        }
        return {
          classical: algo,
          quantumVulnerable: info.quantumVulnerable,
          replacement: info.replacement,
          urgency: info.quantumVulnerable ? ('immediate' as const) : ('long-term' as const),
          notes: info.notes,
        }
      })
  // Filter compliance requirements to only include frameworks relevant to the user's industry AND country
  const filteredCompliance = input.complianceRequirements.filter((fw) => {
    const framework = industryComplianceConfigs.find((f) => f.label === fw)
    if (!framework) return true // don't silently drop unknowns

    const industryMatch =
      framework.industries.includes(input.industry) || framework.industries.length >= 3

    const countryMatch =
      !input.country ||
      input.country === 'Global' ||
      framework.countries.length === 0 ||
      framework.countries.includes('Global') ||
      framework.countries.includes(input.country)

    return industryMatch && countryMatch
  })
  const complianceImpacts: ComplianceImpact[] = filteredCompliance.map((fw) => {
    // eslint-disable-next-line security/detect-object-injection
    const info = COMPLIANCE_DB[fw]
    if (!info) {
      return {
        framework: fw,
        requiresPQC: null,
        deadline: 'Unknown',
        notes: 'Framework not in database — verify PQC requirements independently.',
      }
    }
    return { framework: fw, ...info }
  })
  const vulnerableCount = algorithmMigrations.filter((a) => a.quantumVulnerable).length
  const pqcCompliance = complianceImpacts.filter((c) => c.requiresPQC)
  const hasExtendedInput = !!(
    input.cryptoUseCases?.length ||
    input.useCasesUnknown ||
    input.dataRetention?.length ||
    input.retentionUnknown ||
    input.credentialLifetime?.length ||
    input.credentialLifetimeUnknown ||
    input.cryptoAgility ||
    input.infrastructure?.length ||
    input.infrastructureUnknown ||
    input.systemCount ||
    input.teamSize ||
    input.vendorDependency ||
    input.vendorUnknown ||
    input.timelinePressure
  )
  let riskScore: number
  let categoryScores: CategoryScores | undefined
  let categoryDrivers: CategoryDrivers | undefined
  let hndlRiskWindow: HNDLRiskWindow | undefined
  let hnflRiskWindow: HNFLRiskWindow | undefined
  let migrationEffort: MigrationEffortItem[] | undefined
  let recommendedActions: RecommendedAction[]
  let executiveSummary: string | undefined
  if (hasExtendedInput) {
    // ── Compound scoring path ──
    const qe = computeQuantumExposure(input, vulnerableCount)
    const mc = computeMigrationComplexity(input)
    const rp = computeRegulatoryPressure(input, complianceImpacts)
    const or_ = computeOrganizationalReadiness(input)

    categoryScores = {
      quantumExposure: qe,
      migrationComplexity: mc,
      regulatoryPressure: rp,
      organizationalReadiness: or_,
    }

    riskScore = computeCompositeScore(categoryScores, input)
    hndlRiskWindow = computeHNDLRiskWindow(input)
    hnflRiskWindow = computeHNFLRiskWindow(input)
    migrationEffort = computeMigrationEffort(input)
    categoryDrivers = generateCategoryDrivers(input, vulnerableCount, pqcCompliance.length)
    recommendedActions = generateExtendedActions(
      input,
      vulnerableCount,
      pqcCompliance,
      migrationEffort
    )
  } else {
    // ── Legacy additive scoring path ──
    let score = INDUSTRY_THREAT[input.industry] ?? 10

    if (input.currentCryptoUnknown) {
      // Conservative default: equivalent to RSA-2048 + ECDH (~18 pts)
      score += 18
    } else {
      const vulnerableAlgos = algorithmMigrations.filter((a) => a.quantumVulnerable)
      vulnerableAlgos.forEach((algo, i) => {
        const weight = ALGORITHM_WEIGHTS[algo.classical] ?? DEFAULT_ALGORITHM_WEIGHT
        score += i < 3 ? weight : Math.round(weight * 0.5)
      })
    }

    // Not knowing sensitivity → treat as 'high' (conservative worst-case)
    const legacySensitivity = input.sensitivityUnknown
      ? 'high'
      : getMaxSensitivity(input.dataSensitivity)
    score += DATA_SENSITIVITY_SCORES[legacySensitivity] ?? 0 // eslint-disable-line security/detect-object-injection

    complianceImpacts.forEach((ci) => {
      if (ci.requiresPQC) score += 8
    })

    score += MIGRATION_STATUS_SCORES[input.migrationStatus] ?? 0

    // Country-specific regulatory boost (scaled for additive scoring, max +5)
    const countryBoost = COUNTRY_REGULATORY_URGENCY[input.country ?? ''] ?? 0
    score += Math.round(Math.min(5, countryBoost * 0.4))

    riskScore = Math.max(0, Math.min(100, score))

    // Build legacy recommended actions — awareness gaps first
    recommendedActions = []
    let priority = 1

    if (input.currentCryptoUnknown) {
      recommendedActions.push({
        priority: priority++,
        action:
          'Conduct a cryptographic asset inventory to identify all algorithms in use across systems, services, and dependencies.',
        category: 'immediate',
        effort: 'high' as const,
        relatedModule: '/migrate',
      })
    }

    if (input.sensitivityUnknown) {
      recommendedActions.push({
        priority: priority++,
        action:
          'Conduct a data classification exercise to identify the sensitivity levels of data protected by cryptography — this determines Harvest-Now-Decrypt-Later exposure and appropriate encryption requirements.',
        category: 'immediate',
        effort: 'medium' as const,
        relatedModule: '/threats',
      })
    }

    if (input.complianceUnknown) {
      recommendedActions.push({
        priority: priority++,
        action:
          'Identify applicable regulatory and compliance frameworks for your industry and region to understand PQC obligations.',
        category: 'short-term',
        effort: 'low' as const,
        relatedModule: '/compliance',
      })
    }

    if (!input.currentCryptoUnknown && vulnerableCount > 0) {
      recommendedActions.push({
        priority: priority++,
        action: `Migrate ${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount > 1 ? 's' : ''} to PQC equivalents.`,
        category: 'immediate',
        relatedModule: '/algorithms',
      })
    }

    if (input.dataSensitivity.includes('critical') || input.dataSensitivity.includes('high')) {
      recommendedActions.push({
        priority: priority++,
        action: 'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.',
        category: 'immediate',
        relatedModule: '/threats',
      })
    }

    if (pqcCompliance.length > 0) {
      recommendedActions.push({
        priority: priority++,
        action: `Review PQC requirements for ${pqcCompliance.map((c) => c.framework).join(', ')}.`,
        category: 'short-term',
        relatedModule: '/compliance',
      })
    }

    if (input.migrationStatus === 'not-started' || input.migrationStatus === 'unknown') {
      recommendedActions.push({
        priority: priority++,
        action:
          'Conduct cryptographic asset inventory to identify all systems using vulnerable algorithms.',
        category: 'immediate',
        relatedModule: '/migrate',
      })
    }

    recommendedActions.push({
      priority: priority++,
      action: 'Evaluate PQC-ready libraries and tools for your technology stack.',
      category: 'short-term',
      relatedModule: '/migrate',
    })

    recommendedActions.push({
      priority: priority++,
      action: 'Build PQC awareness across engineering and leadership teams.',
      category: 'long-term',
      relatedModule: '/learn',
    })
  }

  // Apply persona-specific action framing (presentation only — prioritization unchanged)
  if (input.persona) {
    recommendedActions = reframeActionsForPersona(recommendedActions, input.persona)
  }

  const riskLevel: AssessmentResult['riskLevel'] =
    riskScore <= 25 ? 'low' : riskScore <= 55 ? 'medium' : riskScore <= 75 ? 'high' : 'critical'
  const narrative = generateNarrative(
    input,
    riskScore,
    riskLevel,
    vulnerableCount,
    pqcCompliance.length
  )
  if (hasExtendedInput) {
    executiveSummary = generateExecutiveSummary(
      input,
      riskScore,
      riskLevel,
      vulnerableCount,
      migrationEffort!,
      hndlRiskWindow,
      hnflRiskWindow,
      pqcCompliance.length
    )
  } else {
    executiveSummary = generateQuickSummary(
      input,
      riskScore,
      riskLevel,
      vulnerableCount,
      pqcCompliance.length
    )
  }

  const personaNarrative = generatePersonaNarrative(
    input.persona,
    input,
    riskScore,
    riskLevel,
    vulnerableCount,
    migrationEffort,
    categoryScores,
    hndlRiskWindow,
    hnflRiskWindow,
    pqcCompliance.length
  )

  const assessmentProfile = buildAssessmentProfile(input, hasExtendedInput)

  const keyFindings = generateKeyFindings(
    input,
    algorithmMigrations,
    complianceImpacts,
    hndlRiskWindow,
    hnflRiskWindow
  )

  return {
    riskScore,
    riskLevel,
    algorithmMigrations,
    complianceImpacts,
    recommendedActions,
    narrative,
    generatedAt: new Date().toISOString(),
    categoryScores,
    categoryDrivers,
    hndlRiskWindow,
    hnflRiskWindow,
    migrationEffort,
    executiveSummary,
    personaNarrative,
    assessmentProfile,
    keyFindings,
  }
}

function buildAssessmentProfile(input: AssessmentInput, hasExtended: boolean): AssessmentProfile {
  return {
    industry: input.industry,
    country: input.country,
    algorithmsSelected: input.currentCrypto,
    algorithmUnknown: !!input.currentCryptoUnknown,
    sensitivityLevels: input.dataSensitivity,
    sensitivityUnknown: !!input.sensitivityUnknown,
    complianceFrameworks: input.complianceRequirements,
    complianceUnknown: !!input.complianceUnknown,
    migrationStatus: input.migrationStatus,
    mode: hasExtended ? 'comprehensive' : 'quick',
    useCases: input.cryptoUseCases,
    useCasesUnknown: !!input.useCasesUnknown,
    retentionPeriods: input.dataRetention,
    retentionUnknown: !!input.retentionUnknown,
    credentialLifetimes: input.credentialLifetime,
    credentialLifetimeUnknown: !!input.credentialLifetimeUnknown,
    infrastructure: input.infrastructure,
    infrastructureUnknown: !!input.infrastructureUnknown,
    cryptoAgility: input.cryptoAgility,
    vendorDependency: input.vendorDependency,
    vendorUnknown: !!input.vendorUnknown,
    systemScale: input.systemCount,
    teamSize: input.teamSize,
    timelinePressure: input.timelinePressure,
  }
}

/** Generate a persona-tailored narrative that reframes the base summary. */
function generatePersonaNarrative(
  persona: string | undefined,
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  categoryScores: CategoryScores | undefined,
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined,
  pqcFrameworkCount: number
): string | undefined {
  if (!persona) return undefined

  switch (persona) {
    case 'executive':
      return generateExecNarrative(
        input,
        riskScore,
        riskLevel,
        vulnerableCount,
        migrationEffort,
        pqcFrameworkCount,
        hndl,
        hnfl
      )
    case 'developer':
      return generateDevNarrative(input, riskScore, riskLevel, vulnerableCount, migrationEffort)
    case 'architect':
      return generateArchitectNarrative(
        input,
        riskScore,
        riskLevel,
        vulnerableCount,
        migrationEffort,
        categoryScores
      )
    case 'researcher':
      return generateResearcherNarrative(
        input,
        riskScore,
        riskLevel,
        vulnerableCount,
        migrationEffort,
        categoryScores,
        hndl,
        hnfl,
        pqcFrameworkCount
      )
    default:
      return undefined
  }
}

function generateExecNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  pqcFrameworkCount: number,
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined
): string {
  const parts: string[] = []
  parts.push(
    `Your ${input.industry} organization carries a ${riskLevel} quantum risk rating (${riskScore}/100).`
  )

  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} compliance framework${pqcFrameworkCount > 1 ? 's' : ''} mandate${pqcFrameworkCount === 1 ? 's' : ''} post-quantum cryptography adoption — delays risk regulatory penalties and audit findings.`
    )
  }

  if (vulnerableCount > 0 && migrationEffort) {
    const majorProjects = migrationEffort.filter(
      (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
    ).length
    if (majorProjects > 0) {
      parts.push(
        `${majorProjects} migration${majorProjects > 1 ? 's' : ''} will require significant investment in engineering resources and vendor coordination.`
      )
    } else {
      parts.push('Most algorithm migrations are manageable in scope with existing resources.')
    }
  }

  if (hndl?.isAtRisk) {
    parts.push(
      `Sensitive data remains exposed for ${hndl.riskWindowYears} year${hndl.riskWindowYears !== 1 ? 's' : ''} beyond the quantum threat horizon — adversaries may already be harvesting encrypted data for future decryption.`
    )
  }

  if (hnfl?.isAtRisk) {
    parts.push(
      `Digital signatures and credentials remain trusted ${hnfl.riskWindowYears} year${hnfl.riskWindowYears !== 1 ? 's' : ''} past the quantum threat horizon — certificate and signing key migration should begin now.`
    )
  }

  if (input.country) {
    const effectiveThreatYear = getEffectiveThreatYear(input.country)
    if (effectiveThreatYear < ESTIMATED_QUANTUM_THREAT_YEAR) {
      parts.push(
        `${input.country} targets PQC readiness by ${effectiveThreatYear}, which sets the planning horizon for regulatory compliance.`
      )
    }
  }

  const statusMsg: Record<string, string> = {
    started: 'Your team has begun migration, which is a competitive advantage.',
    planning: 'Planning is underway — the priority now is to convert plans into execution.',
    'not-started':
      'Migration has not started. The board should prioritize funding a cryptographic assessment and migration roadmap.',
    unknown:
      'Migration status is unclear. The first step is commissioning a cryptographic baseline assessment.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateDevNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined
): string {
  const parts: string[] = []
  parts.push(`Quantum risk assessment: ${riskLevel} (${riskScore}/100).`)

  if (input.currentCryptoUnknown) {
    parts.push(
      'Algorithms are unspecified. Run a dependency audit to identify crypto libraries: check for OpenSSL, BoringSSL, libsodium, or platform crypto APIs in your dependency tree.'
    )
  } else if (vulnerableCount > 0) {
    const vulnAlgos = input.currentCrypto.filter((a) => ALGORITHM_DB[a]?.quantumVulnerable) // eslint-disable-line security/detect-object-injection
    const replacements = vulnAlgos.map((a) => {
      const info = ALGORITHM_DB[a] // eslint-disable-line security/detect-object-injection
      return `${a} → ${info?.replacement ?? 'review manually'}`
    })
    parts.push(`Migration paths: ${replacements.join('; ')}.`)
  }

  if (migrationEffort) {
    const quickWins = migrationEffort.filter((m) => m.estimatedScope === 'quick-win')
    if (quickWins.length > 0) {
      parts.push(
        `Quick wins: ${quickWins.map((q) => q.algorithm).join(', ')} can be migrated with minimal refactoring.`
      )
    }
    const hardMigrations = migrationEffort.filter(
      (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
    )
    if (hardMigrations.length > 0) {
      parts.push(
        `Complex migrations: ${hardMigrations.map((m) => `${m.algorithm} (${m.rationale})`).join('; ')}.`
      )
    }
  }

  if (input.cryptoAgility === 'hardcoded') {
    parts.push(
      'Crypto is hardcoded — consider introducing an abstraction layer (provider pattern or KEM/DSA factory) before per-algorithm migration.'
    )
  } else if (input.cryptoAgility === 'partially-abstracted') {
    parts.push(
      'Partial crypto abstraction detected. Extend your abstraction layer to cover all algorithm references before migrating.'
    )
  }

  const statusMsg: Record<string, string> = {
    started:
      'Migration is active. Focus on completing in-progress algorithm swaps and testing hybrid configurations.',
    planning:
      'Planning phase. Start with a proof-of-concept: migrate one TLS endpoint or signing path to a hybrid PQC configuration.',
    'not-started':
      'Not started. Begin with a cryptographic asset inventory: grep your codebase for algorithm identifiers and audit dependency crypto.',
    unknown: 'Status unknown. Run a dependency-level crypto audit to establish a baseline.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateArchitectNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  categoryScores: CategoryScores | undefined
): string {
  const parts: string[] = []
  parts.push(`System-level quantum risk: ${riskLevel} (${riskScore}/100).`)

  if (categoryScores) {
    parts.push(
      `Risk breakdown — Quantum Exposure: ${categoryScores.quantumExposure}/100, Migration Complexity: ${categoryScores.migrationComplexity}/100, Regulatory Pressure: ${categoryScores.regulatoryPressure}/100, Organizational Readiness: ${categoryScores.organizationalReadiness}/100.`
    )
  }

  if (vulnerableCount > 0) {
    parts.push(
      `${vulnerableCount} algorithm${vulnerableCount !== 1 ? 's' : ''} across the dependency graph require migration.`
    )
  }

  const infraCount = input.infrastructure?.length ?? 0
  if (infraCount > 0 || input.infrastructureUnknown) {
    parts.push(
      input.infrastructureUnknown
        ? 'Infrastructure dependencies are unmapped — conduct a topology review to identify all crypto touchpoints (HSMs, KMS, PKI, legacy systems).'
        : `Migration touches ${infraCount} infrastructure layer${infraCount !== 1 ? 's' : ''}. Prioritize the trust root (PKI/HSM) before leaf services.`
    )
  }

  if (input.cryptoAgility === 'hardcoded') {
    parts.push(
      'Architecture requires a crypto-agility layer before migration. Design a provider abstraction that supports hybrid (classical + PQC) algorithm negotiation.'
    )
  } else if (input.cryptoAgility === 'fully-abstracted') {
    parts.push(
      'Crypto-agility layer is in place — migration can proceed per-service without architectural changes.'
    )
  }

  if (migrationEffort) {
    const multiYear = migrationEffort.filter((m) => m.estimatedScope === 'multi-year')
    if (multiYear.length > 0) {
      parts.push(
        `${multiYear.length} migration${multiYear.length !== 1 ? 's' : ''} require multi-year planning due to ${multiYear.map((m) => m.rationale).join('; ')}.`
      )
    }
  }

  const statusMsg: Record<string, string> = {
    started:
      'Migration is underway. Ensure hybrid mode is the default for all new protocol negotiations.',
    planning:
      'In planning phase. Design the migration architecture: define abstraction boundaries, hybrid protocol support, and rollback strategies.',
    'not-started':
      'Not started. Begin with a system topology mapping: identify all crypto protocol endpoints, key management flows, and certificate chains.',
    unknown:
      'Status unknown. Commission a cryptographic architecture review across all system boundaries.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateResearcherNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  categoryScores: CategoryScores | undefined,
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined,
  pqcFrameworkCount: number
): string {
  const parts: string[] = []

  const w = INDUSTRY_COMPOSITE_WEIGHTS[input.industry] ?? DEFAULT_COMPOSITE_WEIGHTS
  if (categoryScores) {
    parts.push(
      `Composite risk: ${riskScore}/100 (${riskLevel}). Category scores — QE: ${categoryScores.quantumExposure}, MC: ${categoryScores.migrationComplexity}, RP: ${categoryScores.regulatoryPressure}, OR: ${categoryScores.organizationalReadiness}. Industry weights (${input.industry}): QE=${w.qe}, MC=${w.mc}, RP=${w.rp}, OR=${w.or}.`
    )
  } else {
    parts.push(
      `Additive risk score: ${riskScore}/100 (${riskLevel}). Quick assessment mode — extended category scoring not available.`
    )
  }

  if (vulnerableCount > 0) {
    const vulnAlgos = input.currentCrypto.filter((a) => ALGORITHM_DB[a]?.quantumVulnerable) // eslint-disable-line security/detect-object-injection
    parts.push(
      `${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount !== 1 ? 's' : ''}: ${vulnAlgos.join(', ')}. All broken by Shor's algorithm (polynomial-time factoring/ECDLP).`
    )
    if (migrationEffort) {
      const scopeCounts = {
        'quick-win': migrationEffort.filter((m) => m.estimatedScope === 'quick-win').length,
        moderate: migrationEffort.filter((m) => m.estimatedScope === 'moderate').length,
        'major-project': migrationEffort.filter((m) => m.estimatedScope === 'major-project').length,
        'multi-year': migrationEffort.filter((m) => m.estimatedScope === 'multi-year').length,
      }
      parts.push(
        `Migration effort distribution: ${scopeCounts['quick-win']} quick-win, ${scopeCounts.moderate} moderate, ${scopeCounts['major-project']} major, ${scopeCounts['multi-year']} multi-year.`
      )
    }
  }

  if (hndl) {
    const effectiveThreatYear = getEffectiveThreatYear(input.country)
    parts.push(
      `HNDL analysis: ${hndl.dataRetentionYears}yr retention, CRQC ~${effectiveThreatYear}, risk window = ${hndl.riskWindowYears}yr${hndl.isAtRisk ? ' (AT RISK)' : ' (safe)'}${hndl.isEstimated ? ' (estimated)' : ''}.`
    )
  }

  if (hnfl) {
    parts.push(
      `HNFL analysis: ${hnfl.credentialLifetimeYears}yr credential lifetime, signing algos: ${hnfl.hasSigningAlgorithms ? 'present' : 'none detected'}, risk window = ${hnfl.riskWindowYears}yr${hnfl.isAtRisk ? ' (AT RISK)' : ' (safe)'}. High-risk use cases: ${hnfl.hnflRelevantUseCases.length > 0 ? hnfl.hnflRelevantUseCases.join(', ') : 'none'}.`
    )
  }

  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} PQC-mandating framework${pqcFrameworkCount > 1 ? 's' : ''} selected. NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) are the primary replacement standards.`
    )
  }

  return parts.filter(Boolean).join(' ')
}

function generateNarrative(
  input: AssessmentInput,
  score: number,
  level: string,
  vulnerableAlgos: number,
  pqcFrameworks: number
): string {
  const parts: string[] = []
  parts.push(
    `Your organization in the ${input.industry} sector has a quantum risk score of ${score}/100 (${level}).`
  )
  if (vulnerableAlgos > 0) {
    parts.push(
      `You are currently using ${vulnerableAlgos} quantum-vulnerable cryptographic algorithm${vulnerableAlgos > 1 ? 's' : ''} that require migration to post-quantum alternatives.`
    )
  } else {
    parts.push(
      'Your current cryptographic algorithms do not include quantum-vulnerable public-key schemes.'
    )
  }

  if (input.dataSensitivity.includes('critical') || input.dataSensitivity.includes('high')) {
    parts.push(
      'Given your high data sensitivity, "Harvest Now, Decrypt Later" attacks represent an immediate threat to long-lived data.'
    )
  }

  if (pqcFrameworks > 0) {
    parts.push(
      `${pqcFrameworks} of your compliance framework${pqcFrameworks > 1 ? 's' : ''} already require${pqcFrameworks === 1 ? 's' : ''} or will soon require PQC adoption.`
    )
  }

  const statusMsg: Record<string, string> = {
    started: 'Your migration has already begun, which significantly reduces your risk.',
    planning: 'You are in the planning phase — prioritize converting plans to implementation.',
    'not-started':
      'Migration has not yet started. We recommend beginning with a cryptographic asset inventory.',
    unknown: 'Your migration status is unclear — this should be established as a first priority.',
  }
  parts.push(statusMsg[input.migrationStatus] || '')
  if (input.dataRetention?.length) {
    const years = getMaxRetentionYears(input.dataRetention)
    if (years > 10) {
      parts.push(
        `With a data retention period of ${years}+ years, your data may remain encrypted beyond the expected quantum computing timeline.`
      )
    }
  }

  if (input.cryptoAgility === 'hardcoded') {
    parts.push(
      'Your cryptographic implementations are hardcoded, which will significantly increase migration effort.'
    )
  }

  return parts.filter(Boolean).join(' ')
}

/**
 * Generates 3-5 key findings from the assessment — the most important takeaways.
 */
function generateKeyFindings(
  input: AssessmentInput,
  algorithmMigrations: AlgorithmMigration[],
  complianceImpacts: ComplianceImpact[],
  hndlRiskWindow?: HNDLRiskWindow,
  hnflRiskWindow?: HNFLRiskWindow
): string[] {
  const findings: string[] = []
  const p = input.persona

  // 1. Overall risk posture
  const vulnCount = algorithmMigrations.filter((a) => a.quantumVulnerable).length
  if (vulnCount > 0) {
    if (p === 'executive') {
      findings.push(
        `Your organization relies on ${vulnCount} encryption method${vulnCount > 1 ? 's' : ''} that quantum computers will break — board-level migration planning should begin.`
      )
    } else if (p === 'developer') {
      findings.push(
        `${vulnCount} algorithm${vulnCount > 1 ? 's' : ''} in your dependency chain ${vulnCount > 1 ? 'are' : 'is'} quantum-vulnerable and need${vulnCount === 1 ? 's' : ''} replacement with NIST-standardized PQC alternatives.`
      )
    } else if (p === 'architect') {
      findings.push(
        `${vulnCount} quantum-vulnerable algorithm${vulnCount > 1 ? 's' : ''} span${vulnCount === 1 ? 's' : ''} your dependency graph — migration must be sequenced from trust roots (PKI/HSM) to leaf services.`
      )
    } else {
      findings.push(
        `Your organization uses ${vulnCount} quantum-vulnerable algorithm${vulnCount > 1 ? 's' : ''} that ${vulnCount > 1 ? 'require' : 'requires'} migration to post-quantum alternatives.`
      )
    }
  }

  // 2. HNDL risk
  if (hndlRiskWindow?.isAtRisk) {
    const suffix = hndlRiskWindow.isEstimated ? ' (conservative estimate)' : ''
    if (p === 'executive') {
      findings.push(
        `Sensitive data remains exposed for ${hndlRiskWindow.riskWindowYears} years beyond the quantum horizon — adversaries may already be harvesting encrypted data for future decryption${suffix}.`
      )
    } else if (p === 'developer') {
      findings.push(
        `Data-at-rest encryption uses quantum-vulnerable algorithms with ${hndlRiskWindow.riskWindowYears} years of exposure beyond estimated CRQC arrival${suffix}.`
      )
    } else {
      findings.push(
        `Harvest-Now-Decrypt-Later risk detected: your data retention period extends ${hndlRiskWindow.riskWindowYears} years beyond the estimated quantum threat horizon${suffix}.`
      )
    }
  }

  // 3. HNFL risk
  if (hnflRiskWindow?.isAtRisk && hnflRiskWindow.hasSigningAlgorithms) {
    findings.push(
      `Harvest-Now-Forge-Later risk: signing credentials may remain trusted past the quantum threat year, exposing ${hnflRiskWindow.hnflRelevantUseCases.length} use case${hnflRiskWindow.hnflRelevantUseCases.length !== 1 ? 's' : ''} to forgery attacks.`
    )
  }

  // 4. Compliance urgency
  const urgentCompliance = complianceImpacts.filter(
    (c) => c.requiresPQC && c.deadline.match(/202[5-9]|203[0-2]/)
  )
  if (urgentCompliance.length > 0) {
    const names = urgentCompliance.map((c) => c.framework).join(', ')
    if (p === 'executive') {
      findings.push(
        `${urgentCompliance.length} compliance deadline${urgentCompliance.length > 1 ? 's' : ''} (${names}) require${urgentCompliance.length === 1 ? 's' : ''} board attention — non-compliance risks regulatory penalties and audit findings.`
      )
    } else if (p === 'developer') {
      findings.push(
        `${urgentCompliance.length} compliance framework${urgentCompliance.length > 1 ? 's' : ''} (${names}) mandate${urgentCompliance.length === 1 ? 's' : ''} PQC adoption — check framework-specific algorithm requirements for your stack.`
      )
    } else {
      findings.push(
        `${urgentCompliance.length} compliance framework${urgentCompliance.length > 1 ? 's' : ''} (${names}) ${urgentCompliance.length > 1 ? 'have' : 'has'} near-term PQC migration deadlines.`
      )
    }
  }

  // 5. Migration status
  if (input.migrationStatus === 'not-started') {
    if (p === 'executive') {
      findings.push(
        `Migration not yet started — early movers gain compliance advantages and spread costs over more budget cycles.`
      )
    } else if (p === 'developer') {
      findings.push(
        `No PQC migration started — begin with quick-win algorithm swaps in non-critical services to build experience.`
      )
    } else {
      findings.push(
        `PQC migration has not yet started. Beginning with a cryptographic inventory and pilot project would significantly reduce your risk exposure.`
      )
    }
  } else if (input.migrationStatus === 'planning') {
    if (p === 'executive') {
      findings.push(
        `Migration planning is underway — ensure budget and staffing are allocated for the first phase of implementation.`
      )
    } else {
      findings.push(
        `Migration planning is underway. Prioritize quantum-vulnerable algorithms in your highest-sensitivity systems to maximize risk reduction.`
      )
    }
  }

  return findings.slice(0, 5)
}

export function useAssessmentEngine(input: AssessmentInput | null): AssessmentResult | null {
  return useMemo(() => {
    if (!input) return null
    return computeAssessment(input)
  }, [input])
}
