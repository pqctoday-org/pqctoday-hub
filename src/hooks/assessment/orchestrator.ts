import {
  ALGORITHM_DB,
  COMPLIANCE_DB,
  DATA_SENSITIVITY_SCORES,
  ALGORITHM_WEIGHTS,
  DEFAULT_ALGORITHM_WEIGHT,
  INDUSTRY_THREAT,
  COUNTRY_REGULATORY_URGENCY,
  MIGRATION_STATUS_SCORES,
} from '../assessmentData'

import { industryComplianceConfigs } from '../../data/industryAssessConfig'

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
} from '../assessmentTypes'

import {
  computeQuantumExposure,
  computeMigrationComplexity,
  computeRegulatoryPressure,
  computeCompositeScore,
  computeOrganizationalReadiness,
  getMaxSensitivity,
} from './scoring'
import { computeHNDLRiskWindow, computeHNFLRiskWindow, computeMigrationEffort } from './riskWindows'
import {
  generateCategoryDrivers,
  generateExtendedActions,
  generateExecutiveSummary,
  generateQuickSummary,
  generateNarrative,
  generateKeyFindings,
} from './generators'
import { reframeActionsForPersona, generatePersonaNarrative } from './personas'

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

export function buildAssessmentProfile(
  input: AssessmentInput,
  hasExtended: boolean
): AssessmentProfile {
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
    infrastructureSubCategories: input.infrastructureSubCategories,
    cryptoAgility: input.cryptoAgility,
    vendorDependency: input.vendorDependency,
    vendorUnknown: !!input.vendorUnknown,
    systemScale: input.systemCount,
    teamSize: input.teamSize,
    timelinePressure: input.timelinePressure,
    migrationUnknown: !!input.migrationUnknown,
    agilityUnknown: !!input.agilityUnknown,
    timelineUnknown: !!input.timelineUnknown,
  }
}
