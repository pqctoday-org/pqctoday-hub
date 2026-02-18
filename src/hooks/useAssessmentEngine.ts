import { useMemo } from 'react'

export interface AssessmentInput {
  industry: string
  currentCrypto: string[]
  /** One or more sensitivity levels — risk scored against the highest selected. */
  dataSensitivity: string[]
  complianceRequirements: string[]
  migrationStatus: 'started' | 'planning' | 'not-started' | 'unknown'
  // Extended inputs (optional for backward compat)
  country?: string
  cryptoUseCases?: string[]
  /** One or more retention periods — HNDL risk uses the longest selected. */
  dataRetention?: string[]
  systemCount?: '1-10' | '11-50' | '51-200' | '200-plus'
  teamSize?: '1-10' | '11-50' | '51-200' | '200-plus'
  cryptoAgility?: 'fully-abstracted' | 'partially-abstracted' | 'hardcoded' | 'unknown'
  infrastructure?: string[]
  vendorDependency?: 'heavy-vendor' | 'open-source' | 'mixed' | 'in-house'
  timelinePressure?: 'within-1y' | 'within-2-3y' | 'internal-deadline' | 'no-deadline' | 'unknown'
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
  requiresPQC: boolean
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
}

export interface MigrationEffortItem {
  algorithm: string
  complexity: 'low' | 'medium' | 'high' | 'critical'
  estimatedScope: 'quick-win' | 'moderate' | 'major-project' | 'multi-year'
  rationale: string
}

export interface AssessmentResult {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  algorithmMigrations: AlgorithmMigration[]
  complianceImpacts: ComplianceImpact[]
  recommendedActions: RecommendedAction[]
  narrative: string
  generatedAt: string
  // Extended result fields (present only for extended assessments)
  categoryScores?: CategoryScores
  hndlRiskWindow?: HNDLRiskWindow
  migrationEffort?: MigrationEffortItem[]
  executiveSummary?: string
}

// Algorithms and their quantum vulnerability
const ALGORITHM_DB: Record<
  string,
  { quantumVulnerable: boolean; replacement: string; notes: string }
> = {
  'RSA-2048': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 / ML-DSA-65',
    notes: "Broken by Shor's algorithm. NIST targets deprecation by 2030.",
  },
  'RSA-4096': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-1024 / ML-DSA-87',
    notes: "Broken by Shor's algorithm. Larger key provides no quantum resistance.",
  },
  'ECDSA P-256': {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: "Broken by Shor's algorithm. Used widely in TLS and code signing.",
  },
  'ECDSA P-384': {
    quantumVulnerable: true,
    replacement: 'ML-DSA-65',
    notes: "Broken by Shor's algorithm.",
  },
  ECDH: {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768',
    notes: "Key agreement vulnerable to Shor's. Replace with KEM-based approach.",
  },
  Ed25519: {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: 'Used in SSH, Solana. Vulnerable to quantum attack.',
  },
  'DH (Diffie-Hellman)': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768',
    notes: 'Classic key exchange. Fully broken by quantum computers.',
  },
  'AES-128': {
    quantumVulnerable: false,
    replacement: 'AES-256 (recommended upgrade)',
    notes: "Grover's algorithm reduces security to ~64-bit. Upgrade to AES-256.",
  },
  'AES-256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: "Quantum-safe. Grover's reduces to ~128-bit, still secure.",
  },
  'SHA-256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: "Quantum-safe at current sizes. Grover's has limited impact on hash functions.",
  },
  'SHA-3': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'Quantum-safe. Modern hash function with strong security margins.',
  },
  '3DES': {
    quantumVulnerable: false,
    replacement: 'AES-256 (regardless of quantum)',
    notes: 'Already deprecated for classical security reasons. Migrate immediately.',
  },
  'ChaCha20-Poly1305': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'Symmetric stream cipher. Quantum-safe at current key sizes.',
  },
  'HMAC-SHA256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'MAC function. Not affected by quantum computers.',
  },
  X25519: {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768',
    notes: "Curve25519 key exchange. Vulnerable to Shor's algorithm.",
  },
  secp256k1: {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: 'Used in Bitcoin/Ethereum. Vulnerable to quantum attack.',
  },
}

// Derived set of quantum-vulnerable algorithm names
export const VULNERABLE_ALGORITHMS = new Set(
  Object.entries(ALGORITHM_DB)
    .filter(([, info]) => info.quantumVulnerable)
    .map(([name]) => name)
)

// Compliance framework data
const COMPLIANCE_DB: Record<string, { requiresPQC: boolean; deadline: string; notes: string }> = {
  'FIPS 140-3': {
    requiresPQC: true,
    deadline: '2030 (NIST deprecation target)',
    notes:
      'CMVP validation will require PQC algorithm support. FIPS 203/204/205 already published.',
  },
  'Common Criteria': {
    requiresPQC: true,
    deadline: 'Ongoing — PQC protection profiles emerging',
    notes:
      'New protection profiles for PQC are being developed. Certification timelines vary by scheme.',
  },
  ANSSI: {
    requiresPQC: true,
    deadline: '2025-2030 (phased)',
    notes: 'French regulation requires hybrid PQC for new systems. Full migration by 2030.',
  },
  'CNSA 2.0': {
    requiresPQC: true,
    deadline: '2025 (software), 2030 (infrastructure)',
    notes: 'NSA mandate for U.S. national security systems. Aggressive timeline.',
  },
  'eIDAS 2.0': {
    requiresPQC: true,
    deadline: '2027+ (wallet deployments)',
    notes: 'EU Digital Identity framework. PQC readiness expected for wallet implementations.',
  },
  'PCI DSS': {
    requiresPQC: false,
    deadline: 'No explicit PQC timeline yet',
    notes: 'Payment card industry will follow NIST guidance. Monitor for updates.',
  },
  HIPAA: {
    requiresPQC: false,
    deadline: 'No explicit PQC timeline yet',
    notes: 'Healthcare data has long sensitivity periods — HNDL risk is significant.',
  },
}

// Industry threat levels
const INDUSTRY_THREAT: Record<string, number> = {
  'Finance & Banking': 25,
  'Government & Defense': 30,
  Healthcare: 20,
  Telecommunications: 20,
  Technology: 15,
  'Energy & Utilities': 20,
  Automotive: 15,
  Aerospace: 25,
  'Retail & E-Commerce': 10,
  Education: 5,
  Other: 10,
}

// Per-algorithm risk weights (higher = more impactful to migrate)
const ALGORITHM_WEIGHTS: Record<string, number> = {
  'RSA-2048': 10,
  'RSA-4096': 8,
  'ECDSA P-256': 10,
  'ECDSA P-384': 6,
  ECDH: 10,
  Ed25519: 6,
  'DH (Diffie-Hellman)': 4,
  X25519: 8,
  secp256k1: 6,
}

const DEFAULT_ALGORITHM_WEIGHT = 8

const DATA_SENSITIVITY_SCORES: Record<string, number> = {
  low: 0,
  medium: 5,
  high: 15,
  critical: 25,
}

const MIGRATION_STATUS_SCORES: Record<string, number> = {
  started: -20,
  planning: -10,
  'not-started': 10,
  unknown: 15,
}

// ── Extended scoring reference data ──

const USE_CASE_WEIGHTS: Record<string, { hndlRelevance: number; migrationPriority: number }> = {
  'TLS/HTTPS': { hndlRelevance: 6, migrationPriority: 10 },
  'Data-at-rest encryption': { hndlRelevance: 9, migrationPriority: 7 },
  'Digital signatures / code signing': { hndlRelevance: 3, migrationPriority: 8 },
  'Key exchange / agreement': { hndlRelevance: 8, migrationPriority: 9 },
  'Authentication / identity': { hndlRelevance: 4, migrationPriority: 7 },
  'Blockchain / cryptocurrency': { hndlRelevance: 5, migrationPriority: 6 },
  'Email encryption (S/MIME, PGP)': { hndlRelevance: 7, migrationPriority: 5 },
  'VPN / IPSec': { hndlRelevance: 7, migrationPriority: 8 },
  'IoT device communication': { hndlRelevance: 5, migrationPriority: 6 },
  'Database encryption': { hndlRelevance: 8, migrationPriority: 7 },
}

const DATA_RETENTION_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-5y': 5,
  '5-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 50,
}

const AGILITY_COMPLEXITY: Record<string, number> = {
  'fully-abstracted': 0.2,
  'partially-abstracted': 0.5,
  hardcoded: 0.9,
  unknown: 0.7,
}

const INFRA_COMPLEXITY: Record<string, number> = {
  'HSM / Hardware security modules': 15,
  'Cloud KMS (AWS, Azure, GCP)': 5,
  'On-premise PKI': 12,
  'Third-party certificate authorities': 8,
  'Legacy systems (10+ years old)': 14,
  'Embedded / IoT devices': 13,
  'Mobile applications': 6,
}

const SYSTEM_SCALE: Record<string, number> = {
  '1-10': 1.0,
  '11-50': 1.3,
  '51-200': 1.6,
  '200-plus': 2.0,
}

const TEAM_CAPACITY: Record<string, number> = {
  '1-10': 0.4,
  '11-50': 0.6,
  '51-200': 0.8,
  '200-plus': 1.0,
}

const VENDOR_DEPENDENCY_WEIGHT: Record<string, number> = {
  'heavy-vendor': 20,
  mixed: 10,
  'open-source': 5,
  'in-house': 3,
}

const TIMELINE_URGENCY: Record<string, number> = {
  'within-1y': 1.3,
  'within-2-3y': 1.15,
  'internal-deadline': 1.05,
  'no-deadline': 1.0,
  unknown: 1.1,
}

const ESTIMATED_QUANTUM_THREAT_YEAR = 2035

// ── Multi-select helpers ──

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
  return Math.max(...arr.map((r) => DATA_RETENTION_YEARS[r] ?? 0)) // eslint-disable-line security/detect-object-injection
}

// ── Category score functions (each 0-100) ──

function computeQuantumExposure(input: AssessmentInput, vulnerableCount: number): number {
  // Base from vulnerable algorithm weights (reuse existing weights)
  let base = 0
  const vulnerableAlgos = input.currentCrypto.filter(
    (a) => ALGORITHM_DB[a]?.quantumVulnerable // eslint-disable-line security/detect-object-injection
  )
  vulnerableAlgos.forEach((algo, i) => {
    // eslint-disable-next-line security/detect-object-injection
    const weight = ALGORITHM_WEIGHTS[algo] ?? DEFAULT_ALGORITHM_WEIGHT
    base += i < 3 ? weight : Math.round(weight * 0.5)
  })
  // Normalize algorithm contribution to ~0-40 range (max possible ~38 for 9 algos)
  const algoScore = Math.min(40, base)

  // Use-case HNDL relevance contribution (0-25)
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

  // Data retention amplifier (0-20)
  let retentionScore = 0
  if (input.dataRetention?.length) {
    const years = getMaxRetentionYears(input.dataRetention)
    retentionScore = Math.min(20, years * 0.8)
  } else {
    // Estimate from sensitivity for legacy inputs
    const ms = getMaxSensitivity(input.dataSensitivity)
    retentionScore = ms === 'critical' ? 16 : ms === 'high' ? 10 : ms === 'medium' ? 4 : 0
  }

  // Data sensitivity multiplier (0-15)
  const sensitivityScore = Math.min(
    15,
    (DATA_SENSITIVITY_SCORES[getMaxSensitivity(input.dataSensitivity)] ?? 0) * 0.6
  )

  return Math.max(
    0,
    Math.min(100, Math.round(algoScore + useCaseScore + retentionScore + sensitivityScore))
  )
}

function computeMigrationComplexity(input: AssessmentInput): number {
  // Crypto agility is the major factor (0-40)

  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const agilityScore = agilityFactor * 40

  // Infrastructure complexity (0-30)
  let infraScore = 0
  if (input.infrastructure?.length) {
    const totalInfra = input.infrastructure.reduce((sum, item) => {
      // eslint-disable-next-line security/detect-object-injection
      return sum + (INFRA_COMPLEXITY[item] ?? 5)
    }, 0)
    infraScore = Math.min(30, totalInfra)
  } else {
    infraScore = 10 // moderate default
  }

  // System scale (0-15)

  const scale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3
  const scaleScore = Math.min(15, scale * 7.5)

  // Vendor dependency (0-15)

  const vendorScore = Math.min(
    15,
    (VENDOR_DEPENDENCY_WEIGHT[input.vendorDependency ?? 'mixed'] ?? 10) * 0.75
  )

  return Math.max(
    0,
    Math.min(100, Math.round(agilityScore + infraScore + scaleScore + vendorScore))
  )
}

function computeRegulatoryPressure(
  input: AssessmentInput,
  complianceImpacts: ComplianceImpact[]
): number {
  // PQC-required frameworks (0-40)
  const pqcCount = complianceImpacts.filter((c) => c.requiresPQC).length
  const frameworkScore = Math.min(40, pqcCount * 12)

  // Industry regulatory weight (0-25)

  const industryBase = INDUSTRY_THREAT[input.industry] ?? 10
  const industryRegScore = Math.min(25, industryBase * 0.85)

  // Timeline pressure (multiplier applied at end)

  const timelineMul = TIMELINE_URGENCY[input.timelinePressure ?? 'unknown'] ?? 1.1

  const raw = (frameworkScore + industryRegScore) * timelineMul

  return Math.max(0, Math.min(100, Math.round(raw)))
}

function computeOrganizationalReadiness(input: AssessmentInput): number {
  // Migration status is the largest factor (0-40)
  // Inverted: higher score = less ready = more risk
  const statusScores: Record<string, number> = {
    started: 5,
    planning: 20,
    'not-started': 35,
    unknown: 40,
  }

  const statusScore = statusScores[input.migrationStatus] ?? 30

  // Team-to-system capacity ratio (0-25)
  // High system count + small team = poor readiness

  const sysScale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3

  const teamCap = TEAM_CAPACITY[input.teamSize ?? '11-50'] ?? 0.6
  const capacityGap = sysScale / teamCap // >1 means understaffed
  const capacityScore = Math.min(25, Math.round(capacityGap * 8))

  // Crypto agility (inverted: hardcoded = less ready) (0-20)

  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const readinessAgilityScore = Math.round(agilityFactor * 20)

  // Vendor dependency (heavy vendor = less control) (0-15)

  const vendorWeight = VENDOR_DEPENDENCY_WEIGHT[input.vendorDependency ?? 'mixed'] ?? 10
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

  // HNDL multiplier: critical data + long retention + migration not started
  if (
    input.dataSensitivity.includes('critical') &&
    input.dataRetention?.length &&
    getMaxRetentionYears(input.dataRetention) > 10 &&
    input.migrationStatus !== 'started'
  ) {
    composite *= 1.15
  }

  // Compliance urgency: Government + CNSA 2.0 + no migration
  if (
    input.industry === 'Government & Defense' &&
    input.complianceRequirements.includes('CNSA 2.0') &&
    input.migrationStatus !== 'started'
  ) {
    composite *= 1.1
  }

  // Migration difficulty: hardcoded + HSMs or legacy
  if (
    input.cryptoAgility === 'hardcoded' &&
    input.infrastructure?.some((i) => i.includes('HSM') || i.includes('Legacy'))
  ) {
    composite *= 1.08
  }

  return Math.max(0, Math.min(100, Math.round(composite)))
}

function computeHNDLRiskWindow(input: AssessmentInput): HNDLRiskWindow | undefined {
  if (!input.dataRetention?.length) return undefined

  const currentYear = new Date().getFullYear()

  const retentionYears = getMaxRetentionYears(input.dataRetention)
  const dataExpirationYear = currentYear + retentionYears
  const riskWindowYears = dataExpirationYear - ESTIMATED_QUANTUM_THREAT_YEAR

  return {
    dataRetentionYears: retentionYears,
    estimatedQuantumThreatYear: ESTIMATED_QUANTUM_THREAT_YEAR,
    currentYear,
    isAtRisk: riskWindowYears > 0,
    riskWindowYears: Math.max(0, riskWindowYears),
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

function generateExtendedActions(
  input: AssessmentInput,
  vulnerableCount: number,
  pqcCompliance: ComplianceImpact[],
  migrationEffort: MigrationEffortItem[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = []
  let priority = 1

  // Quick wins first
  const quickWins = migrationEffort.filter((m) => m.estimatedScope === 'quick-win')
  if (quickWins.length > 0) {
    actions.push({
      priority: priority++,
      action: `Migrate ${quickWins.length} quick-win algorithm${quickWins.length > 1 ? 's' : ''} (${quickWins.map((q) => q.algorithm).join(', ')}) to PQC equivalents.`,
      category: 'immediate',
      relatedModule: '/algorithms',
      effort: 'low',
    })
  }

  // Major algorithm migrations
  const majorMigrations = migrationEffort.filter(
    (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
  )
  if (majorMigrations.length > 0) {
    actions.push({
      priority: priority++,
      action: `Plan migration for ${majorMigrations.length} high-complexity algorithm${majorMigrations.length > 1 ? 's' : ''} (${majorMigrations.map((m) => m.algorithm).join(', ')}).`,
      category: 'immediate',
      relatedModule: '/algorithms',
      effort: 'high',
    })
  }

  // Remaining moderate migrations
  const moderateMigrations = migrationEffort.filter((m) => m.estimatedScope === 'moderate')
  if (moderateMigrations.length > 0 && quickWins.length === 0 && majorMigrations.length === 0) {
    actions.push({
      priority: priority++,
      action: `Migrate ${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount > 1 ? 's' : ''} to PQC equivalents.`,
      category: 'immediate',
      relatedModule: '/algorithms',
      effort: 'medium',
    })
  }

  // Use-case-specific TLS action
  if (input.cryptoUseCases?.includes('TLS/HTTPS') && vulnerableCount > 0) {
    actions.push({
      priority: priority++,
      action: 'Migrate TLS endpoints to hybrid PQC key exchange (ML-KEM + X25519).',
      category: 'immediate',
      relatedModule: '/algorithms',
      effort: 'medium',
    })
  }

  // HNDL action for high sensitivity + long retention
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
      relatedModule: '/threats',
      effort: 'high',
    })
  } else if (hasHighSensitivity) {
    actions.push({
      priority: priority++,
      action: 'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.',
      category: 'immediate',
      relatedModule: '/threats',
      effort: 'medium',
    })
  }

  // HSM-specific action
  if (input.infrastructure?.some((i) => i.includes('HSM'))) {
    actions.push({
      priority: priority++,
      action: 'Evaluate HSM vendor PQC firmware roadmap and plan hardware upgrades.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  // Vendor dependency action
  if (input.vendorDependency === 'heavy-vendor') {
    actions.push({
      priority: priority++,
      action: 'Engage SaaS and SDK vendors for PQC migration timelines and compatibility.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  // Compliance action
  if (pqcCompliance.length > 0) {
    actions.push({
      priority: priority++,
      action: `Review PQC requirements for ${pqcCompliance.map((c) => c.framework).join(', ')}.`,
      category: 'short-term',
      relatedModule: '/compliance',
      effort: 'low',
    })
  }

  // Crypto asset inventory
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

  // Crypto agility improvement
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

  // Always include
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

function computeAssessment(input: AssessmentInput): AssessmentResult {
  // Build algorithm migrations and compliance impacts (shared by both paths)
  const algorithmMigrations: AlgorithmMigration[] = input.currentCrypto.map((algo) => {
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

  const complianceImpacts: ComplianceImpact[] = input.complianceRequirements.map((fw) => {
    // eslint-disable-next-line security/detect-object-injection
    const info = COMPLIANCE_DB[fw]
    if (!info) {
      return {
        framework: fw,
        requiresPQC: false,
        deadline: 'Unknown',
        notes: 'Framework not in database.',
      }
    }
    return { framework: fw, ...info }
  })

  const vulnerableCount = algorithmMigrations.filter((a) => a.quantumVulnerable).length
  const pqcCompliance = complianceImpacts.filter((c) => c.requiresPQC)

  // Determine if this is an extended assessment
  const hasExtendedInput = !!(
    input.cryptoUseCases?.length ||
    input.dataRetention?.length ||
    input.cryptoAgility ||
    input.infrastructure?.length ||
    input.systemCount ||
    input.teamSize ||
    input.vendorDependency ||
    input.timelinePressure
  )

  let riskScore: number
  let categoryScores: CategoryScores | undefined
  let hndlRiskWindow: HNDLRiskWindow | undefined
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
    migrationEffort = computeMigrationEffort(input)
    recommendedActions = generateExtendedActions(
      input,
      vulnerableCount,
      pqcCompliance,
      migrationEffort
    )
  } else {
    // ── Legacy additive scoring path (unchanged for backward compat) ──
    let score = INDUSTRY_THREAT[input.industry] ?? 10

    const vulnerableAlgos = algorithmMigrations.filter((a) => a.quantumVulnerable)
    vulnerableAlgos.forEach((algo, i) => {
      const weight = ALGORITHM_WEIGHTS[algo.classical] ?? DEFAULT_ALGORITHM_WEIGHT
      score += i < 3 ? weight : Math.round(weight * 0.5)
    })

    score += DATA_SENSITIVITY_SCORES[getMaxSensitivity(input.dataSensitivity)] ?? 0

    complianceImpacts.forEach((ci) => {
      if (ci.requiresPQC) score += 8
    })

    score += MIGRATION_STATUS_SCORES[input.migrationStatus] ?? 0

    riskScore = Math.max(0, Math.min(100, score))

    // Build legacy recommended actions
    recommendedActions = []
    let priority = 1

    if (vulnerableCount > 0) {
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
    riskScore <= 30 ? 'low' : riskScore <= 60 ? 'medium' : riskScore <= 80 ? 'high' : 'critical'

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

  // Extended narrative additions
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

// Export for direct usage
export { computeAssessment }

// Export available options for the wizard
export const AVAILABLE_INDUSTRIES = Object.keys(INDUSTRY_THREAT)
export const AVAILABLE_ALGORITHMS = Object.keys(ALGORITHM_DB)
export const AVAILABLE_COMPLIANCE = Object.keys(COMPLIANCE_DB)
export const AVAILABLE_USE_CASES = Object.keys(USE_CASE_WEIGHTS)
export const AVAILABLE_INFRASTRUCTURE = Object.keys(INFRA_COMPLEXITY)
export const AVAILABLE_DATA_RETENTION: string[] = [
  'under-1y',
  '1-5y',
  '5-10y',
  '10-25y',
  '25-plus',
  'indefinite',
]
export const AVAILABLE_SYSTEM_COUNTS: AssessmentInput['systemCount'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
export const AVAILABLE_TEAM_SIZES: AssessmentInput['teamSize'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
