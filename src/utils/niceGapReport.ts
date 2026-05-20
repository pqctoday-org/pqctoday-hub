// SPDX-License-Identifier: GPL-3.0-only
/**
 * Derives a NICE Framework gap report from pqctoday assessment inputs.
 *
 * Pure function — no side effects, no store access.
 * Input: AssessmentInput + AssessmentResult
 * Output: NiceGapReport
 */
import type { AssessmentInput, AssessmentResult } from '../hooks/assessmentTypes'
import {
  NICE_COMPETENCY_AREAS,
  NICE_WORK_ROLES,
  getWorkRolesForCompetencyArea,
  type NiceCompetencyAreaId,
  type NiceProficiencyTier,
  type NiceWorkRoleId,
} from '../data/niceFramework'
import { getModulesForCompetencyArea } from '../data/niceModuleMapping'

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface NiceCompetencyGap {
  competencyAreaId: NiceCompetencyAreaId
  title: string
  /** Why this CA is flagged for this assessment */
  rationale: string
  /** Recommended proficiency tier to reach */
  targetTier: NiceProficiencyTier
  /** Ordered list of pqctoday module IDs to address this gap */
  recommendedModules: string[]
  /** Estimated minutes to complete recommended modules (awareness tier) */
  estimatedMinutesAwareness: number
  /** Estimated minutes to complete recommended modules (practitioner tier) */
  estimatedMinutesPractitioner: number
}

export interface NiceWorkRoleRecommendation {
  workRoleId: NiceWorkRoleId
  niceCode: string
  title: string
  description: string
  /** Why this role is surfaced for this assessment */
  rationale: string
  /** pqctoday modules most relevant for onboarding someone into this role */
  onboardingModules: string[]
}

export interface NiceLearningStep {
  order: number
  moduleId: string
  competencyAreaId: NiceCompetencyAreaId
  rationale: string
}

export interface NiceGapReport {
  generatedAt: string
  /** Primary Competency Areas the org needs to develop */
  competencyGaps: NiceCompetencyGap[]
  /** Work Roles to hire or upskill */
  workRoleRecommendations: NiceWorkRoleRecommendation[]
  /** Ordered learning sequence for this org profile */
  learningSequence: NiceLearningStep[]
  /** Coverage summary: CAs already implicitly addressed by current migration status */
  partialCoverage: NiceCompetencyAreaId[]
  /** JSON-serialisable export (same shape, plain object) */
  exportData: object
}

// ---------------------------------------------------------------------------
// Scoring weights — which signals drive which CAs
// ---------------------------------------------------------------------------

interface CaSignal {
  caId: NiceCompetencyAreaId
  weight: number
  rationale: string
  targetTier: NiceProficiencyTier
}

function deriveCaSignals(input: AssessmentInput, result: AssessmentResult): CaSignal[] {
  const signals: CaSignal[] = []

  // CA-CRYPTO: always relevant; weight increases with algorithm breadth and testing gap
  const cryptoAlgoCount = input.currentCrypto?.length ?? 0
  const cryptoWeight =
    0.6 +
    (cryptoAlgoCount >= 4 ? 0.3 : cryptoAlgoCount >= 2 ? 0.15 : 0) +
    (result.riskScore >= 70 ? 0.1 : 0)
  signals.push({
    caId: 'CA-CRYPTO',
    weight: Math.min(cryptoWeight, 1),
    rationale:
      cryptoAlgoCount >= 4
        ? `Your portfolio spans ${cryptoAlgoCount} cryptographic algorithms — deep Cryptography competency is needed to manage the transition of each.`
        : 'Post-quantum migration requires selecting, validating, and deploying new cryptographic primitives.',
    targetTier:
      input.persona === 'developer' || input.persona === 'architect' ? 'practitioner' : 'awareness',
  })

  // CA-RISK: always relevant; weight from risk score and compliance requirements
  const complianceCount = input.complianceRequirements?.length ?? 0
  signals.push({
    caId: 'CA-RISK',
    weight: 0.5 + (result.riskScore >= 60 ? 0.2 : 0) + (complianceCount >= 2 ? 0.2 : 0),
    rationale:
      result.riskScore >= 70
        ? `Your risk score of ${result.riskScore} indicates significant quantum exposure requiring structured risk management.`
        : 'Identifying and prioritizing cryptographic risks is the foundation of any PQC migration program.',
    targetTier: input.persona === 'executive' ? 'awareness' : 'practitioner',
  })

  // CA-GOVCOMP: compliance requirements and executive persona
  if (complianceCount > 0 || input.persona === 'executive') {
    signals.push({
      caId: 'CA-GOVCOMP',
      weight: 0.4 + (complianceCount >= 3 ? 0.4 : complianceCount >= 1 ? 0.2 : 0),
      rationale:
        complianceCount > 0
          ? `You selected ${complianceCount} compliance framework${complianceCount > 1 ? 's' : ''} (${input.complianceRequirements.slice(0, 2).join(', ')}${complianceCount > 2 ? '…' : ''}) — governance and policy competency is required to meet those mandates.`
          : 'Executive leadership of a PQC program requires governance and compliance competency.',
      targetTier: 'awareness',
    })
  }

  // CA-SYSARCH: architect persona, infrastructure complexity, crypto agility posture
  const infraCount = input.infrastructure?.length ?? 0
  if (
    input.persona === 'architect' ||
    infraCount >= 3 ||
    input.cryptoAgility === 'hardcoded' ||
    input.cryptoAgility === 'partially-abstracted'
  ) {
    signals.push({
      caId: 'CA-SYSARCH',
      weight:
        0.5 +
        (infraCount >= 3 ? 0.2 : 0) +
        (input.cryptoAgility === 'hardcoded' ? 0.2 : 0) +
        (input.persona === 'architect' ? 0.1 : 0),
      rationale:
        input.cryptoAgility === 'hardcoded'
          ? 'Your cryptography is hardcoded — building crypto-agile architecture is the highest-leverage architectural investment.'
          : infraCount >= 3
            ? `Your ${infraCount}-layer infrastructure requires architectural analysis to sequence the migration safely.`
            : 'Designing PQC-ready systems requires Systems Security Architecture competency.',
      targetTier: 'practitioner',
    })
  }

  // CA-NETDEF: VPN, TLS, web gateway, SSH use cases or network infrastructure selected
  const networkInfra = (input.infrastructure ?? []).some((i) =>
    ['network', 'cloud', 'vpn', 'tls', 'firewall'].some((kw) => i.toLowerCase().includes(kw))
  )
  const networkUseCases = (input.cryptoUseCases ?? []).some((u) =>
    ['tls', 'vpn', 'ssh', 'network'].some((kw) => u.toLowerCase().includes(kw))
  )
  if (networkInfra || networkUseCases || input.persona === 'ops') {
    signals.push({
      caId: 'CA-NETDEF',
      weight: 0.5 + (networkInfra && networkUseCases ? 0.3 : 0.1),
      rationale:
        'Network transport and protocol configurations must be updated to PQC-safe variants.',
      targetTier: input.persona === 'ops' ? 'practitioner' : 'awareness',
    })
  }

  // CA-IDENT: PKI, certificates, IAM, signatures, JWT use cases
  const identUseCases = (input.cryptoUseCases ?? []).some((u) =>
    ['certificate', 'signing', 'pki', 'jwt', 'identity', 'iam', 'auth'].some((kw) =>
      u.toLowerCase().includes(kw)
    )
  )
  if (identUseCases || infraCount >= 2) {
    signals.push({
      caId: 'CA-IDENT',
      weight: 0.4 + (identUseCases ? 0.3 : 0),
      rationale:
        'Digital identity infrastructure — certificates, PKI, and authentication tokens — must be migrated to PQC-resistant algorithms.',
      targetTier: 'practitioner',
    })
  }

  // CA-DATASEC: data sensitivity, encryption at rest, database use cases
  const sensitiveLevels = input.dataSensitivity ?? []
  const highSensitivity = sensitiveLevels.some((s) =>
    ['secret', 'top-secret', 'restricted', 'highly-sensitive'].some((kw) =>
      s.toLowerCase().includes(kw)
    )
  )
  if (highSensitivity || sensitiveLevels.length >= 2) {
    signals.push({
      caId: 'CA-DATASEC',
      weight: 0.4 + (highSensitivity ? 0.4 : 0.1),
      rationale: highSensitivity
        ? 'High-sensitivity data requires immediate attention to encryption-at-rest and data lifecycle controls under PQC.'
        : 'Protecting diverse data classifications requires Data Security competency during migration.',
      targetTier: input.persona === 'developer' ? 'practitioner' : 'awareness',
    })
  }

  // CA-SECPROG: developer persona, open-source or in-house vendor model
  if (
    input.persona === 'developer' ||
    input.vendorDependency === 'open-source' ||
    input.vendorDependency === 'in-house'
  ) {
    signals.push({
      caId: 'CA-SECPROG',
      weight: 0.5 + (input.persona === 'developer' ? 0.3 : 0),
      rationale:
        input.vendorDependency === 'in-house'
          ? 'In-house cryptographic code requires Secure Programming competency to implement and validate PQC primitives correctly.'
          : 'Integrating PQC libraries into application code is a core developer skill for the migration.',
      targetTier: 'practitioner',
    })
  }

  return signals
}

// ---------------------------------------------------------------------------
// Module recommendations per CA
// ---------------------------------------------------------------------------

// Awareness-tier module time estimates (minutes)
const MODULE_MINUTES_AWARENESS: Record<string, number> = {
  'pqc-101': 15,
  'quantum-threats': 20,
  'pqc-risk-management': 25,
  'data-asset-sensitivity': 20,
  'pqc-business-case': 20,
  'pqc-governance': 25,
  'compliance-strategy': 25,
  'standards-bodies': 20,
  'vendor-risk': 20,
  'migration-program': 30,
}

function getModuleMinutes(moduleId: string): number {
  return MODULE_MINUTES_AWARENESS[moduleId] ?? 30
}

function buildCompetencyGap(signal: CaSignal): NiceCompetencyGap {
  const ca = NICE_COMPETENCY_AREAS[signal.caId]
  const allModules = getModulesForCompetencyArea(signal.caId)
  const awarenessModules = allModules
    .filter((m) => m.tier === 'awareness')
    .map((m) => m.moduleId)
    .slice(0, 4)
  const practitionerModules = allModules
    .filter((m) => m.tier === 'practitioner')
    .map((m) => m.moduleId)
    .slice(0, 4)

  const recommendedModules =
    signal.targetTier === 'awareness'
      ? awarenessModules
      : [...awarenessModules, ...practitionerModules]

  return {
    competencyAreaId: signal.caId,
    title: ca.title,
    rationale: signal.rationale,
    targetTier: signal.targetTier,
    recommendedModules,
    estimatedMinutesAwareness: awarenessModules.reduce((sum, m) => sum + getModuleMinutes(m), 0),
    estimatedMinutesPractitioner:
      awarenessModules.reduce((sum, m) => sum + getModuleMinutes(m), 0) +
      practitionerModules.length * 30,
  }
}

// ---------------------------------------------------------------------------
// Work role recommendations
// ---------------------------------------------------------------------------

function buildWorkRoleRecommendations(
  caIds: NiceCompetencyAreaId[],
  input: AssessmentInput
): NiceWorkRoleRecommendation[] {
  const roleScores = new Map<NiceWorkRoleId, number>()

  for (const caId of caIds) {
    const roles = getWorkRolesForCompetencyArea(caId)
    for (const role of roles) {
      roleScores.set(role.id, (roleScores.get(role.id) ?? 0) + 1)
    }
  }

  // Boost roles that match persona
  const personaRoleBoost: Record<string, NiceWorkRoleId[]> = {
    executive: ['is-security-manager', 'risk-manager'],
    architect: ['security-architect', 'systems-security-analyst'],
    developer: ['security-developer', 'iam-specialist'],
    ops: ['system-administrator', 'network-security-specialist'],
    researcher: ['security-architect', 'systems-security-analyst'],
    curious: ['risk-manager'],
  }
  const boosted = personaRoleBoost[input.persona ?? ''] ?? []
  for (const id of boosted) {
    roleScores.set(id, (roleScores.get(id) ?? 0) + 2)
  }

  // Sort by score desc, take top 4
  const topRoles = [...roleScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id)

  const infraCount = input.infrastructure?.length ?? 0
  const complianceCount = input.complianceRequirements?.length ?? 0

  const roleRationales: Partial<Record<NiceWorkRoleId, string>> = {
    'security-architect':
      infraCount >= 3
        ? `Your ${infraCount}-layer infrastructure needs a Security Architect to design the PQC migration sequence.`
        : 'Designing crypto-agile systems for PQC is a core Security Architect responsibility.',
    'security-developer':
      input.vendorDependency === 'in-house' || input.vendorDependency === 'open-source'
        ? 'In-house or open-source crypto stacks require Security Developer expertise to integrate PQC primitives correctly.'
        : 'Updating cryptographic implementations in code requires Security Developer competency.',
    'is-security-manager':
      complianceCount >= 2
        ? `With ${complianceCount} compliance frameworks in scope, an IS Security Manager is needed to govern the cross-framework migration program.`
        : 'Overseeing the PQC migration program requires IS Security Manager governance.',
    'risk-manager':
      "Assessing and prioritizing quantum risk across organizational assets is the Risk Manager's core function.",
    'system-administrator':
      'Deploying PQC certificates, updating TLS configurations, and rotating keys across systems is an Administrator-level operation.',
    'network-security-specialist':
      'Updating transport protocols (TLS, VPN, SSH) to PQC-safe variants requires Network Security expertise.',
    'iam-specialist':
      'Migrating PKI, certificate authorities, and identity tokens to PQC-resistant algorithms requires IAM Specialist skills.',
    'systems-security-analyst':
      'Assessing the current cryptographic posture and validating post-migration compliance is a Systems Security Analyst responsibility.',
  }

  return topRoles.map((roleId) => {
    const role = NICE_WORK_ROLES[roleId]
    const onboardingModules = role.competencyAreas
      .flatMap((caId) =>
        getModulesForCompetencyArea(caId)
          .filter((m) => m.tier === 'awareness' || m.tier === 'practitioner')
          .slice(0, 2)
          .map((m) => m.moduleId)
      )
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 5)

    return {
      workRoleId: roleId,
      niceCode: role.niceCode,
      title: role.title,
      description: role.description,
      rationale:
        roleRationales[roleId] ??
        `This role addresses competency gaps in ${role.competencyAreas.join(', ')}.`,
      onboardingModules,
    }
  })
}

// ---------------------------------------------------------------------------
// Learning sequence
// ---------------------------------------------------------------------------

function buildLearningSequence(gaps: NiceCompetencyGap[]): NiceLearningStep[] {
  const seen = new Set<string>()
  const steps: NiceLearningStep[] = []

  // Prioritise: awareness modules first, then practitioner
  const orderedCAs: NiceCompetencyAreaId[] = [
    'CA-RISK',
    'CA-GOVCOMP',
    'CA-CRYPTO',
    'CA-NETDEF',
    'CA-IDENT',
    'CA-DATASEC',
    'CA-SYSARCH',
    'CA-SECPROG',
  ]

  const gapByCa = new Map(gaps.map((g) => [g.competencyAreaId, g]))

  for (const caId of orderedCAs) {
    const gap = gapByCa.get(caId)
    if (!gap) continue
    for (const moduleId of gap.recommendedModules) {
      if (seen.has(moduleId)) continue
      seen.add(moduleId)
      steps.push({
        order: steps.length + 1,
        moduleId,
        competencyAreaId: caId,
        rationale: `Addresses ${NICE_COMPETENCY_AREAS[caId].title} competency gap`,
      })
    }
  }

  return steps
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateNiceGapReport(
  input: AssessmentInput,
  result: AssessmentResult
): NiceGapReport {
  const signals = deriveCaSignals(input, result).filter((s) => s.weight >= 0.4)

  // Sort by weight descending
  signals.sort((a, b) => b.weight - a.weight)

  const competencyGaps = signals.map(buildCompetencyGap)
  const caIds = signals.map((s) => s.caId)
  const workRoleRecommendations = buildWorkRoleRecommendations(caIds, input)
  const learningSequence = buildLearningSequence(competencyGaps)

  // Partial coverage: CAs where migrationStatus === 'started' reduces urgency
  const partialCoverage: NiceCompetencyAreaId[] =
    input.migrationStatus === 'started'
      ? (['CA-RISK', 'CA-CRYPTO'].filter((ca) =>
          caIds.includes(ca as NiceCompetencyAreaId)
        ) as NiceCompetencyAreaId[])
      : []

  const report: NiceGapReport = {
    generatedAt: new Date().toISOString(),
    competencyGaps,
    workRoleRecommendations,
    learningSequence,
    partialCoverage,
    exportData: {},
  }

  // Build export-safe copy (same shape, just plain object)
  report.exportData = {
    generatedAt: report.generatedAt,
    niceFrameworkVersion: 'SP 800-181 Rev 1 (2020)',
    platform: 'pqctoday.org',
    assessmentProfile: {
      industry: input.industry,
      persona: input.persona,
      migrationStatus: input.migrationStatus,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
    },
    competencyGaps: competencyGaps.map((g) => ({
      competencyAreaId: g.competencyAreaId,
      title: g.title,
      targetTier: g.targetTier,
      rationale: g.rationale,
      recommendedModules: g.recommendedModules,
    })),
    workRoles: workRoleRecommendations.map((r) => ({
      niceCode: r.niceCode,
      title: r.title,
      rationale: r.rationale,
    })),
    learningSequence: learningSequence.map((s) => ({
      order: s.order,
      moduleId: s.moduleId,
      competencyArea: s.competencyAreaId,
    })),
  }

  return report
}
