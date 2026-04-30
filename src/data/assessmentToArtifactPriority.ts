// SPDX-License-Identifier: GPL-3.0-only
/**
 * Per-(zone, artifact-type) rules that derive whether the user's assessment
 * answers imply a missing artifact is "Suggested" (i.e., high priority to
 * create). Used by CSWP39ZonePanel to render a "Suggested by your assessment"
 * badge next to artifact placeholders.
 *
 * Rules are pure functions over `AssessmentSnapshot` so they can be unit-tested
 * without React.
 */
import type { ExecutiveDocumentType } from '@/services/storage/types'
import type { AssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'

export interface ArtifactSuggestion {
  /** Short human reason shown in the badge tooltip. */
  reason: string
}

type SuggestionRule = (snap: AssessmentSnapshot) => ArtifactSuggestion | null

const isLongRetention = (retention: string[] | undefined): boolean => {
  if (!retention || retention.length === 0) return false
  // Buckets emitted by the wizard include strings like "10-25", "25-plus",
  // "long-term", "indefinite". We treat anything containing "25", "plus",
  // "indefinite", or "long" as long retention.
  return retention.some((r) => /25|plus|indefinite|long/i.test(r))
}

const isHighRisk = (snap: AssessmentSnapshot): boolean =>
  snap.result?.riskLevel === 'high' || snap.result?.riskLevel === 'critical'

/** Industries with elevated supply-chain / vendor exposure (where third-party
 *  crypto changes drive material risk). Sourced from INDUSTRY_THREAT keys
 *  with threat weight >= 20 and known vendor concentration. */
const HIGH_VENDOR_EXPOSURE_INDUSTRIES = new Set([
  'Finance & Banking',
  'Government & Defense',
  'Healthcare',
  'Telecommunications',
  'Energy & Utilities',
  'Aerospace',
])

/** Industries where crypto incidents must surface to a board / regulator
 *  quickly enough to warrant an executive briefing artifact. */
const HIGH_BOARD_VISIBILITY_INDUSTRIES = new Set([
  'Finance & Banking',
  'Government & Defense',
  'Healthcare',
  'Aerospace',
])

/** Country → most-relevant compliance framework. Used to nudge the user
 *  toward the right gap artifact in their jurisdiction. Matches values
 *  emitted by the Country wizard step. */
const JURISDICTION_FRAMEWORK_HINT: Record<string, string> = {
  'United States': 'OMB M-23-02 / NSM-10',
  Canada: 'Canadian Centre for Cyber Security guidance',
  'European Union': 'DORA + NIS2',
  'United Kingdom': 'NCSC PQC migration guidance',
  France: 'ANSSI PQC roadmap',
  Germany: 'BSI TR-02102',
  Japan: 'CRYPTREC PQC list',
  'South Korea': 'KISA PQC guidance',
  Australia: 'ACSC ISM',
  Singapore: 'CSA Singapore PQC roadmap',
  China: 'GM/T cryptographic requirements',
}

/** Sensitivity values that warrant explicit risk artifacts. Wizard emits
 *  values like "low", "medium", "high", "critical", "regulated", "classified". */
const isHighSensitivity = (sensitivities: string[] | undefined): boolean => {
  if (!sensitivities || sensitivities.length === 0) return false
  return sensitivities.some((s) => /critical|classified|regulated|high/i.test(s))
}

const RULES: Partial<Record<ExecutiveDocumentType, SuggestionRule>> = {
  'crypto-cbom': ({ input }) => {
    if (!input) return null
    if (input.currentCrypto.length > 0)
      return { reason: 'You reported current cryptography in the assessment.' }
    if (input.currentCryptoUnknown)
      return { reason: 'You said current cryptography is unknown — start a CBOM to inventory it.' }
    return null
  },

  'migration-roadmap': ({ input, result }) => {
    if (!input) return null
    if (input.migrationStatus === 'not-started' || input.migrationStatus === 'planning')
      return {
        reason: `Migration status is "${input.migrationStatus}" — a roadmap will accelerate it.`,
      }
    if (input.timelinePressure === 'within-1y' || input.timelinePressure === 'within-2-3y')
      return { reason: 'Your timeline pressure requires a concrete roadmap.' }
    if ((result?.algorithmMigrations?.length ?? 0) > 0)
      return { reason: 'Algorithm migrations were identified in the assessment.' }
    return null
  },

  'compliance-timeline': ({ input, result }) => {
    if ((input?.complianceRequirements?.length ?? 0) > 0)
      return { reason: 'You selected compliance frameworks in the assessment.' }
    if ((result?.complianceImpacts?.length ?? 0) > 0)
      return { reason: 'Compliance impacts were identified in the assessment.' }
    if (input?.country && JURISDICTION_FRAMEWORK_HINT[input.country])
      return {
        reason: `${input.country} sits under ${JURISDICTION_FRAMEWORK_HINT[input.country]} — track its deadlines.`,
      }
    return null
  },

  'compliance-checklist': ({ input }) => {
    if ((input?.complianceRequirements?.length ?? 0) > 0)
      return { reason: 'You selected compliance frameworks in the assessment.' }
    return null
  },

  'audit-checklist': ({ input }) => {
    if ((input?.complianceRequirements?.length ?? 0) > 0)
      return { reason: 'Compliance frameworks usually require periodic audits.' }
    if (input?.country && JURISDICTION_FRAMEWORK_HINT[input.country])
      return {
        reason: `Audits expected under ${JURISDICTION_FRAMEWORK_HINT[input.country]} (${input.country}).`,
      }
    return null
  },

  'policy-draft': ({ input }) => {
    if (input?.cryptoAgility === 'hardcoded' || input?.cryptoAgility === 'partially-abstracted')
      return { reason: 'Limited crypto agility — a policy draft formalizes the upgrade path.' }
    if ((input?.complianceRequirements?.length ?? 0) > 0)
      return { reason: 'Compliance frameworks expect a written crypto policy.' }
    return null
  },

  'risk-register': (snap) => {
    if (isHighRisk(snap)) return { reason: `Assessment risk level is ${snap.result!.riskLevel}.` }
    if (snap.result?.hndlRiskWindow?.isAtRisk)
      return { reason: 'Harvest-now-decrypt-later window is open.' }
    if (isHighSensitivity(snap.input?.dataSensitivity))
      return { reason: 'High-sensitivity data warrants a tracked risk register.' }
    return null
  },

  'risk-treatment-plan': (snap) => {
    if (isHighRisk(snap)) return { reason: `Assessment risk level is ${snap.result!.riskLevel}.` }
    if (isHighSensitivity(snap.input?.dataSensitivity))
      return { reason: 'High-sensitivity data needs a documented treatment plan.' }
    return null
  },

  'crqc-scenario': ({ input, result }) => {
    if (isLongRetention(input?.dataRetention))
      return { reason: 'Long data retention puts you in CRQC scenario range.' }
    if (isLongRetention(input?.credentialLifetime))
      return { reason: 'Long credential lifetime puts you in CRQC scenario range.' }
    if (result?.hndlRiskWindow?.isAtRisk)
      return { reason: 'HNDL window is open per your assessment.' }
    if (isHighSensitivity(input?.dataSensitivity))
      return { reason: 'High-sensitivity data magnifies CRQC impact — model it.' }
    return null
  },

  'crypto-architecture': ({ input }) => {
    if (input?.cryptoAgility === 'hardcoded')
      return { reason: 'Hardcoded crypto — an architecture artifact captures the to-be design.' }
    if ((input?.cryptoUseCases?.length ?? 0) > 0)
      return { reason: 'You reported crypto use cases — capture the architecture per use case.' }
    return null
  },

  'supply-chain-matrix': ({ input }) => {
    if (input?.vendorDependency === 'heavy-vendor' || input?.vendorDependency === 'mixed')
      return { reason: 'Significant vendor dependency — a supply-chain matrix is needed.' }
    if (input?.industry && HIGH_VENDOR_EXPOSURE_INDUSTRIES.has(input.industry))
      return { reason: `${input.industry} has elevated third-party crypto exposure.` }
    return null
  },

  'vendor-scorecard': ({ input }) => {
    if (input?.vendorDependency === 'heavy-vendor')
      return { reason: 'Heavy vendor dependency — score vendors on PQC readiness.' }
    if (
      (input?.complianceRequirements?.length ?? 0) > 0 &&
      input?.migrationStatus === 'not-started'
    )
      return { reason: 'Compliance frameworks selected and migration not started.' }
    return null
  },

  'kpi-tracker': ({ result }) => {
    if (result) return { reason: 'You have an assessment baseline — track KPIs against it.' }
    return null
  },

  'kpi-dashboard': ({ result }) => {
    if (result?.riskLevel === 'high' || result?.riskLevel === 'critical')
      return { reason: 'Elevated risk warrants an executive KPI dashboard.' }
    return null
  },

  'roi-model': ({ result }) => {
    if (result) return { reason: 'Build the business case from your assessment baseline.' }
    return null
  },

  'board-deck': ({ input, result }) => {
    if (input?.persona === 'executive')
      return { reason: 'Executive persona — a board deck communicates the plan upward.' }
    if (isHighRisk({ ...({} as AssessmentSnapshot), result } as AssessmentSnapshot))
      return { reason: `Risk level is ${result?.riskLevel} — surface to the board.` }
    if (input?.industry && HIGH_BOARD_VISIBILITY_INDUSTRIES.has(input.industry))
      return { reason: `${input.industry} typically requires board-level crypto attestation.` }
    return null
  },

  'raci-matrix': ({ input }) => {
    if (input?.teamSize === '51-200' || input?.teamSize === '200-plus')
      return { reason: 'Larger team — RACI clarifies migration ownership.' }
    if (input?.systemCount === '51-200' || input?.systemCount === '200-plus')
      return { reason: 'Many systems — RACI clarifies migration ownership.' }
    return null
  },

  'stakeholder-comms': ({ input }) => {
    if (input?.teamSize === '51-200' || input?.teamSize === '200-plus')
      return { reason: 'Larger org — stakeholder comms keeps the migration on rails.' }
    return null
  },

  'deployment-playbook': ({ input }) => {
    if ((input?.infrastructure?.length ?? 0) > 0)
      return { reason: 'You reported infrastructure layers — capture deploy steps per layer.' }
    return null
  },

  'crypto-vulnerability-watch': ({ input }) => {
    if (input?.currentCrypto.some((a) => /^RSA|^ECDSA|^DSA|^DH|^ECDH/i.test(a)))
      return { reason: 'You use quantum-vulnerable algorithms — watch for new advisories.' }
    return null
  },

  'management-tools-audit': ({ input }) => {
    if ((input?.infrastructure?.length ?? 0) > 0)
      return { reason: 'Infrastructure reported — audit the management tools that run on it.' }
    return null
  },

  'contract-clause': ({ input }) => {
    if (input?.vendorDependency === 'heavy-vendor' || input?.vendorDependency === 'mixed')
      return { reason: 'Vendor exposure — add PQC clauses to contracts.' }
    return null
  },
}

/**
 * Given a missing artifact type and the current assessment snapshot, return a
 * suggestion (with a human reason) when the assessment data implies the user
 * should create it. Returns null when there's no signal.
 */
export function getArtifactSuggestion(
  type: ExecutiveDocumentType,
  snap: AssessmentSnapshot
): ArtifactSuggestion | null {
  if (!snap.hasAssessment) return null
  // eslint-disable-next-line security/detect-object-injection
  const rule = RULES[type]
  return rule ? rule(snap) : null
}
