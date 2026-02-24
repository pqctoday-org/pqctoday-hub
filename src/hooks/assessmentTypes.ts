export interface AssessmentInput {
  industry: string
  currentCrypto: string[]
  /** When true, user indicated they don't know their cryptographic algorithms. */
  currentCryptoUnknown?: boolean
  /** One or more sensitivity levels — risk scored against the highest selected. */
  dataSensitivity: string[]
  complianceRequirements: string[]
  migrationStatus: 'started' | 'planning' | 'not-started' | 'unknown'
  country?: string
  cryptoUseCases?: string[]
  /** One or more retention periods — HNDL risk uses the longest selected. */
  dataRetention?: string[]
  /** When true, user indicated they don't know their data retention period. */
  retentionUnknown?: boolean
  systemCount?: '1-10' | '11-50' | '51-200' | '200-plus'
  teamSize?: '1-10' | '11-50' | '51-200' | '200-plus'
  cryptoAgility?: 'fully-abstracted' | 'partially-abstracted' | 'hardcoded' | 'unknown'
  infrastructure?: string[]
  vendorDependency?: 'heavy-vendor' | 'open-source' | 'mixed' | 'in-house'
  /** When true, user indicated they don't know their vendor dependency model. */
  vendorUnknown?: boolean
  timelinePressure?: 'within-1y' | 'within-2-3y' | 'internal-deadline' | 'no-deadline' | 'unknown'
  /** How long signed artifacts / certificates must remain trusted (multi-select, HNFL uses longest). */
  credentialLifetime?: string[]
  /** When true, user indicated they don't know their credential lifetime. */
  credentialLifetimeUnknown?: boolean
  /** When true, user indicated they don't know their data sensitivity level. */
  sensitivityUnknown?: boolean
  /** When true, user indicated they don't know their compliance requirements. */
  complianceUnknown?: boolean
  /** When true, user indicated they don't know their crypto use cases. */
  useCasesUnknown?: boolean
  /** When true, user indicated they don't know their infrastructure. */
  infrastructureUnknown?: boolean
  /** Active persona at assessment time — drives narrative framing and scoring adjustments. */
  persona?: 'executive' | 'developer' | 'architect' | 'researcher'
}

export interface AlgorithmMigration {
  classical: string
  quantumVulnerable: boolean
  replacement: string
  urgency: 'immediate' | 'near-term' | 'long-term'
  notes: string
}

export interface ComplianceImpact {
  framework: string
  /** true = PQC required, false = not required, null = framework not in database */
  requiresPQC: boolean | null
  deadline: string
  notes: string
}

export interface RecommendedAction {
  priority: number
  action: string
  category: 'immediate' | 'short-term' | 'long-term'
  relatedModule: string
  effort?: 'low' | 'medium' | 'high'
}

export interface CategoryScores {
  quantumExposure: number
  migrationComplexity: number
  regulatoryPressure: number
  organizationalReadiness: number
}

export interface HNDLRiskWindow {
  dataRetentionYears: number
  estimatedQuantumThreatYear: number
  currentYear: number
  isAtRisk: boolean
  riskWindowYears: number
  /** true when retention period is a conservative default (user selected "I don't know") */
  isEstimated?: boolean
}

export interface HNFLRiskWindow {
  credentialLifetimeYears: number
  estimatedQuantumThreatYear: number
  currentYear: number
  /** true only when signing algorithms are present AND credentials expire past the threat year */
  isAtRisk: boolean
  riskWindowYears: number
  hasSigningAlgorithms: boolean
  /** Use cases with hnflRelevance >= 7 */
  hnflRelevantUseCases: string[]
  /** true when credential lifetime is a conservative default (user selected "I don't know") */
  isEstimated?: boolean
}

export interface MigrationEffortItem {
  algorithm: string
  complexity: 'low' | 'medium' | 'high' | 'critical'
  estimatedScope: 'quick-win' | 'moderate' | 'major-project' | 'multi-year'
  rationale: string
}

/** Human-readable explanations of what drives each category score. */
export interface CategoryDrivers {
  quantumExposure: string
  migrationComplexity: string
  regulatoryPressure: string
  organizationalReadiness: string
}

/** Summary of user selections for report context. */
export interface AssessmentProfile {
  industry: string
  country?: string
  algorithmsSelected: string[]
  algorithmUnknown: boolean
  sensitivityLevels: string[]
  sensitivityUnknown: boolean
  complianceFrameworks: string[]
  complianceUnknown: boolean
  migrationStatus: string
  mode: 'quick' | 'comprehensive'
  useCases?: string[]
  useCasesUnknown: boolean
  retentionPeriods?: string[]
  retentionUnknown: boolean
  credentialLifetimes?: string[]
  credentialLifetimeUnknown: boolean
  infrastructure?: string[]
  infrastructureUnknown: boolean
  cryptoAgility?: string
  vendorDependency?: string
  vendorUnknown: boolean
  systemScale?: string
  teamSize?: string
  timelinePressure?: string
}

export interface AssessmentResult {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  algorithmMigrations: AlgorithmMigration[]
  complianceImpacts: ComplianceImpact[]
  recommendedActions: RecommendedAction[]
  narrative: string
  generatedAt: string
  categoryScores?: CategoryScores
  categoryDrivers?: CategoryDrivers
  hndlRiskWindow?: HNDLRiskWindow
  hnflRiskWindow?: HNFLRiskWindow
  migrationEffort?: MigrationEffortItem[]
  executiveSummary?: string
  /** Persona-tailored narrative (falls back to executiveSummary when no persona). */
  personaNarrative?: string
  /** Summary of user's assessment inputs for report context. */
  assessmentProfile?: AssessmentProfile
}
