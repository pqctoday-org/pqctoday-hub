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
} from './assessmentData'
import { complianceFrameworks } from '../data/complianceData'

import { useMemo } from 'react'
import { SIGNING_ALGORITHMS } from './assessmentData'
import type {
  AssessmentInput,
  ComplianceImpact,
  CategoryScores,
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
  // eslint-disable-next-line security/detect-object-injection
  return Math.max(...arr.map((r) => DATA_RETENTION_YEARS[r] ?? 0))
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
    // Not knowing retention is worst-case — assume 15-year retention (~12 pts)
    retentionScore = 12
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
  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const agilityScore = agilityFactor * 40
  let infraScore = 0
  if (input.infrastructureUnknown) {
    infraScore = 15 // not knowing infrastructure is worse than the moderate default
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
    ? VENDOR_DEPENDENCY_WEIGHT['heavy-vendor']
    : (VENDOR_DEPENDENCY_WEIGHT[input.vendorDependency ?? 'mixed'] ?? 10)
  const vendorScore = Math.min(15, effectiveVendorWeight * 0.75)
  return Math.max(
    0,
    Math.min(100, Math.round(agilityScore + infraScore + scaleScore + vendorScore))
  )
}

function computeRegulatoryPressure(
  input: AssessmentInput,
  complianceImpacts: ComplianceImpact[]
): number {
  const pqcCount = complianceImpacts.filter((c) => c.requiresPQC).length
  const frameworkScore = Math.min(40, pqcCount * 12)
  const industryBase = INDUSTRY_THREAT[input.industry] ?? 10
  const industryRegScore = Math.min(25, industryBase * 0.85)
  const countryUrgency = COUNTRY_REGULATORY_URGENCY[input.country ?? ''] ?? 0
  const timelineMul = TIMELINE_URGENCY[input.timelinePressure ?? 'unknown'] ?? 1.1
  const raw = (frameworkScore + industryRegScore + Math.min(10, countryUrgency)) * timelineMul
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function computeOrganizationalReadiness(input: AssessmentInput): number {
  const statusScores: Record<string, number> = {
    started: 5,
    planning: 20,
    'not-started': 35,
    unknown: 40,
  }
  const statusScore = statusScores[input.migrationStatus] ?? 30
  const sysScale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3
  const teamCap = TEAM_CAPACITY[input.teamSize ?? '11-50'] ?? 0.6
  const capacityGap = sysScale / teamCap
  const capacityScore = Math.min(25, Math.round(capacityGap * 8))
  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const readinessAgilityScore = Math.round(agilityFactor * 20)
  const vendorWeight = input.vendorUnknown
    ? VENDOR_DEPENDENCY_WEIGHT['heavy-vendor']
    : (VENDOR_DEPENDENCY_WEIGHT[input.vendorDependency ?? 'mixed'] ?? 10)
  const vendorReadiness = Math.min(15, Math.round(vendorWeight * 0.75))
  return Math.max(
    0,
    Math.min(100, statusScore + capacityScore + readinessAgilityScore + vendorReadiness)
  )
}

function computeCompositeScore(categoryScores: CategoryScores, input: AssessmentInput): number {
  let composite =
    categoryScores.quantumExposure * 0.35 +
    categoryScores.migrationComplexity * 0.2 +
    categoryScores.regulatoryPressure * 0.2 +
    categoryScores.organizationalReadiness * 0.25
  if (
    input.dataSensitivity.includes('critical') &&
    input.dataRetention?.length &&
    getMaxRetentionYears(input.dataRetention) > 10 &&
    input.migrationStatus !== 'started'
  ) {
    composite *= 1.15
  }

  const hasSigningAlgos = (input.currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a))
  if (
    hasSigningAlgos &&
    input.credentialLifetime?.length &&
    Math.max(...input.credentialLifetime.map((v) => CREDENTIAL_LIFETIME_YEARS[v] ?? 0)) > 10 && // eslint-disable-line security/detect-object-injection
    input.migrationStatus !== 'started'
  ) {
    composite *= 1.1
  }

  if (
    input.industry === 'Government & Defense' &&
    input.complianceRequirements.includes('CNSA 2.0') &&
    input.migrationStatus !== 'started'
  ) {
    composite *= 1.1
  }

  if (
    input.cryptoAgility === 'hardcoded' &&
    input.infrastructure?.some((i) => i.includes('HSM') || i.includes('Legacy'))
  ) {
    composite *= 1.08
  }

  return Math.max(0, Math.min(100, Math.round(composite)))
}

function computeHNDLRiskWindow(input: AssessmentInput): HNDLRiskWindow | undefined {
  const isEstimated = !!input.retentionUnknown
  if (!input.dataRetention?.length && !isEstimated) return undefined
  const currentYear = new Date().getFullYear()
  const retentionYears = isEstimated ? 15 : getMaxRetentionYears(input.dataRetention ?? [])
  const dataExpirationYear = currentYear + retentionYears
  const riskWindowYears = dataExpirationYear - ESTIMATED_QUANTUM_THREAT_YEAR
  return {
    dataRetentionYears: retentionYears,
    estimatedQuantumThreatYear: ESTIMATED_QUANTUM_THREAT_YEAR,
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
  const credentialExpiryYear = currentYear + lifetimeYears
  const riskWindowYears = credentialExpiryYear - ESTIMATED_QUANTUM_THREAT_YEAR
  const hnflRelevantUseCases = (input.cryptoUseCases ?? []).filter(
    (uc) => (USE_CASE_WEIGHTS[uc]?.hnflRelevance ?? 0) >= 7 // eslint-disable-line security/detect-object-injection
  )
  return {
    credentialLifetimeYears: lifetimeYears,
    estimatedQuantumThreatYear: ESTIMATED_QUANTUM_THREAT_YEAR,
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
      ['ECDH', 'X25519', 'DH (Diffie-Hellman)', 'RSA-2048', 'RSA-4096'].includes(a)
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
            quantumVulnerable: false,
            replacement: 'Unknown — review manually',
            urgency: 'long-term' as const,
            notes: 'Algorithm not in database. Manual review recommended.',
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
  // Filter compliance requirements to only include frameworks relevant to the user's industry
  const filteredCompliance = input.complianceRequirements.filter((fw) => {
    const framework = complianceFrameworks.find((f) => f.label === fw)
    // Keep if: not in DB (don't silently drop unknowns), matches industry, or universal (3+ industries)
    return (
      !framework ||
      framework.industries.includes(input.industry) ||
      framework.industries.length >= 3
    )
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

  return {
    riskScore,
    riskLevel,
    algorithmMigrations,
    complianceImpacts,
    recommendedActions,
    narrative,
    generatedAt: new Date().toISOString(),
    categoryScores,
    hndlRiskWindow,
    hnflRiskWindow,
    migrationEffort,
    executiveSummary,
  }
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

export function useAssessmentEngine(input: AssessmentInput | null): AssessmentResult | null {
  return useMemo(() => {
    if (!input) return null
    return computeAssessment(input)
  }, [input])
}
