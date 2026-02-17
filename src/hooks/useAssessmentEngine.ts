import { useMemo } from 'react'

export interface AssessmentInput {
  industry: string
  currentCrypto: string[]
  dataSensitivity: 'low' | 'medium' | 'high' | 'critical'
  complianceRequirements: string[]
  migrationStatus: 'started' | 'planning' | 'not-started' | 'unknown'
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
}

export interface AssessmentResult {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  algorithmMigrations: AlgorithmMigration[]
  complianceImpacts: ComplianceImpact[]
  recommendedActions: RecommendedAction[]
  narrative: string
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
}

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

function computeAssessment(input: AssessmentInput): AssessmentResult {
  // 1. Base score from industry

  let score = INDUSTRY_THREAT[input.industry] ?? 10

  // 2. Score from vulnerable algorithms
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
    if (info.quantumVulnerable) {
      score += 12
    }
    return {
      classical: algo,
      quantumVulnerable: info.quantumVulnerable,
      replacement: info.replacement,
      urgency: info.quantumVulnerable ? ('immediate' as const) : ('long-term' as const),
      notes: info.notes,
    }
  })

  // 3. Data sensitivity

  score += DATA_SENSITIVITY_SCORES[input.dataSensitivity] ?? 0

  // 4. Compliance requirements
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
    if (info.requiresPQC) {
      score += 8
    }
    return {
      framework: fw,
      ...info,
    }
  })

  // 5. Migration status

  score += MIGRATION_STATUS_SCORES[input.migrationStatus] ?? 0

  // Clamp
  score = Math.max(0, Math.min(100, score))

  // Risk level
  const riskLevel: AssessmentResult['riskLevel'] =
    score <= 30 ? 'low' : score <= 60 ? 'medium' : score <= 80 ? 'high' : 'critical'

  // Build recommended actions
  const recommendedActions: RecommendedAction[] = []
  let priority = 1

  const vulnerableCount = algorithmMigrations.filter((a) => a.quantumVulnerable).length
  if (vulnerableCount > 0) {
    recommendedActions.push({
      priority: priority++,
      action: `Migrate ${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount > 1 ? 's' : ''} to PQC equivalents.`,
      category: 'immediate',
      relatedModule: '/algorithms',
    })
  }

  if (input.dataSensitivity === 'critical' || input.dataSensitivity === 'high') {
    recommendedActions.push({
      priority: priority++,
      action: 'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.',
      category: 'immediate',
      relatedModule: '/threats',
    })
  }

  const pqcCompliance = complianceImpacts.filter((c) => c.requiresPQC)
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

  // Generate narrative
  const narrative = generateNarrative(
    input,
    score,
    riskLevel,
    vulnerableCount,
    pqcCompliance.length
  )

  return {
    riskScore: score,
    riskLevel,
    algorithmMigrations,
    complianceImpacts,
    recommendedActions,
    narrative,
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

  if (input.dataSensitivity === 'critical' || input.dataSensitivity === 'high') {
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
