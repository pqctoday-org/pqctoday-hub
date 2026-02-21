import { useMemo } from 'react'

export interface AssessmentInput {
  industry: string
  currentCrypto: string[]
  /** When true, user indicated they don't know their cryptographic algorithms. */
  currentCryptoUnknown?: boolean
  /** One or more sensitivity levels — risk scored against the highest selected. */
  dataSensitivity: string[]
  complianceRequirements: string[]
  migrationStatus: 'started' | 'planning' | 'not-started' | 'unknown'
  // Extended inputs (optional for backward compat)
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
  hnflRiskWindow?: HNFLRiskWindow
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

/** Signature algorithms vulnerable to Shor's algorithm (HNFL targets). */
export const SIGNING_ALGORITHMS = new Set([
  'RSA-2048',
  'RSA-4096',
  'ECDSA P-256',
  'ECDSA P-384',
  'Ed25519',
  'secp256k1',
])

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
  // ── Industry-specific frameworks (from pqcassessment CSV) ──
  'GSMA NG.116 / FS.40': {
    requiresPQC: true,
    deadline: '2026-2028',
    notes: 'Mobile network operator PQC guidance from GSMA. Covers 5G and beyond.',
  },
  'ETSI TS 103 744': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes: 'ETSI specification for quantum-safe algorithms in telecom protocols.',
  },
  'DORA (EU Digital Operational Resilience)': {
    requiresPQC: true,
    deadline: '2025 (effective)',
    notes: 'Operational resilience requirements for EU financial entities. Crypto risk in scope.',
  },
  'SWIFT CSP': {
    requiresPQC: false,
    deadline: 'Annual',
    notes: 'Annual security attestation required for SWIFT network participants.',
  },
  'ISO 27001': {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes:
      'Widely adopted ISMS standard. No explicit PQC deadline but requires crypto risk management.',
  },
  'SOC 2': {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes: 'Trust Services Criteria. Cryptographic controls reviewed in SOC 2 Type II audits.',
  },
  GDPR: {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes:
      'Art. 32 requires appropriate encryption. PQC becoming expected standard for long-lived personal data.',
  },
  'HITECH Act': {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes:
      'Extends HIPAA enforcement. Mandates breach notification and strong encryption for ePHI.',
  },
  'FDA 21 CFR Part 11': {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes:
      'Signature integrity requirements applicable to PQC migration for regulated medical software.',
  },
  FedRAMP: {
    requiresPQC: true,
    deadline: '2027 (Rev 5 PQC guidance)',
    notes:
      'Cloud service authorization for U.S. federal agencies. Rev 5 expected to reference PQC.',
  },
  'DISA STIGs': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes:
      'Mandatory hardening guides for U.S. DoD systems. Crypto requirements updated regularly.',
  },
  'NATO STANAG 4774': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes:
      'Coalition partner interoperability requirements. PQC transition affects classified data exchange.',
  },
  'ISO/SAE 21434': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes:
      'Full vehicle lifecycle security including post-quantum readiness. Required for new type approvals.',
  },
  'UN ECE WP.29 R155/R156': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes:
      'Type approval requires cybersecurity management systems and secure OTA update processes.',
  },
  'NERC CIP': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes:
      'Mandatory cybersecurity standards for bulk power systems. Crypto controls in CIP-005/007/011.',
  },
  'IEC 62443': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes:
      'Defense-in-depth for industrial control systems. PQC relevant for long-lived OT deployments.',
  },
  'DO-326A / ED-202A': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes:
      'Aviation cybersecurity certification basis. PQC critical given 30-40 year aircraft lifespans.',
  },
  'RTCA DO-355A': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes: 'Supplement to DO-326A for operational phase. Covers cryptographic controls in service.',
  },
  FERPA: {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes:
      'Student record confidentiality. Long retention periods imply HNDL exposure for sensitive records.',
  },
  'NIS2 Directive': {
    requiresPQC: true,
    deadline: 'October 2024 (transposition passed — enforcement underway)',
    notes:
      'EU-wide cybersecurity baseline for essential and important entities. Member states were required to transpose NIS2 by October 2024; enforcement is now active across the EU.',
  },
  COPPA: {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes: "Children's online privacy — PQC relevant for long-lived minor data.",
  },
  TISAX: {
    requiresPQC: false,
    deadline: 'Ongoing',
    notes: 'Automotive supply chain information security assessment.',
  },
  MiCA: {
    requiresPQC: true,
    deadline: '2025 (phased)',
    notes: 'EU crypto-asset regulation — custody and wallet cryptographic security.',
  },
  'TSA Pipeline Security Directive': {
    requiresPQC: true,
    deadline: 'Ongoing',
    notes: 'US pipeline cybersecurity — covers OT/SCADA encryption requirements.',
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

const USE_CASE_WEIGHTS: Record<
  string,
  { hndlRelevance: number; migrationPriority: number; hnflRelevance: number }
> = {
  'TLS/HTTPS': { hndlRelevance: 6, migrationPriority: 10, hnflRelevance: 5 },
  'Data-at-rest encryption': { hndlRelevance: 9, migrationPriority: 7, hnflRelevance: 1 },
  'Digital signatures / code signing': {
    hndlRelevance: 3,
    migrationPriority: 8,
    hnflRelevance: 10,
  },
  'Key exchange / agreement': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 2 },
  'Authentication / identity': { hndlRelevance: 4, migrationPriority: 7, hnflRelevance: 7 },
  'Blockchain / cryptocurrency': { hndlRelevance: 5, migrationPriority: 6, hnflRelevance: 8 },
  'Email encryption (S/MIME, PGP)': { hndlRelevance: 7, migrationPriority: 5, hnflRelevance: 6 },
  'VPN / IPSec': { hndlRelevance: 7, migrationPriority: 8, hnflRelevance: 4 },
  'IoT device communication': { hndlRelevance: 5, migrationPriority: 6, hnflRelevance: 5 },
  'Database encryption': { hndlRelevance: 8, migrationPriority: 7, hnflRelevance: 1 },
  // ── Industry-specific use cases (from pqcassessment CSV) ──
  'SIM/eSIM provisioning': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 4 },
  '5G network slicing security': { hndlRelevance: 7, migrationPriority: 8, hnflRelevance: 4 },
  'SS7/Diameter protocol security': { hndlRelevance: 6, migrationPriority: 8, hnflRelevance: 3 },
  'SWIFT messaging integrity': { hndlRelevance: 9, migrationPriority: 9, hnflRelevance: 8 },
  'Trading system code signing': { hndlRelevance: 5, migrationPriority: 8, hnflRelevance: 9 },
  'Card payment encryption': { hndlRelevance: 6, migrationPriority: 7, hnflRelevance: 2 },
  'Medical device communication': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 4 },
  'EHR/FHIR data exchange': { hndlRelevance: 9, migrationPriority: 8, hnflRelevance: 3 },
  'V2X communication': { hndlRelevance: 7, migrationPriority: 9, hnflRelevance: 6 },
  'OTA firmware updates': { hndlRelevance: 5, migrationPriority: 9, hnflRelevance: 9 },
  'ECU secure boot': { hndlRelevance: 4, migrationPriority: 8, hnflRelevance: 9 },
  'SCADA/OT system security': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 5 },
  'Smart meter communication': { hndlRelevance: 7, migrationPriority: 7, hnflRelevance: 4 },
  'Avionics communication': { hndlRelevance: 8, migrationPriority: 10, hnflRelevance: 7 },
  'Satellite link encryption': { hndlRelevance: 10, migrationPriority: 9, hnflRelevance: 4 },
  'PKI / HSPD-12': { hndlRelevance: 6, migrationPriority: 9, hnflRelevance: 10 },
  'Classified data exchange': { hndlRelevance: 10, migrationPriority: 10, hnflRelevance: 7 },
  'DNS/DNSSEC': { hndlRelevance: 3, migrationPriority: 8, hnflRelevance: 9 },
  'Timestamping services': { hndlRelevance: 9, migrationPriority: 7, hnflRelevance: 9 },
  'Backup/archive encryption': { hndlRelevance: 9, migrationPriority: 6, hnflRelevance: 1 },
  'API gateway / microservices': { hndlRelevance: 5, migrationPriority: 8, hnflRelevance: 5 },
  'Secure boot (non-automotive)': { hndlRelevance: 4, migrationPriority: 8, hnflRelevance: 9 },
}

const DATA_RETENTION_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-5y': 5,
  '5-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 50,
  // ── Industry-specific retention periods (from pqcassessment CSV) ──
  '2y': 2,
  '6y': 6,
  '7y': 7,
  '75y-plus': 75,
  permanent: 100,
}

/** Credential / signature lifetime → years (parallel to DATA_RETENTION_YEARS for HNFL). */
const CREDENTIAL_LIFETIME_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-3y': 3,
  '3-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 100,
}

const AGILITY_COMPLEXITY: Record<string, number> = {
  'fully-abstracted': 0.2,
  'partially-abstracted': 0.5,
  hardcoded: 0.9,
  unknown: 0.9, // not knowing is worst-case — assume hardcoded
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
  unknown: 1.2, // not knowing is worse than no deadline — assume near-term pressure
}

/** Country-specific regulatory urgency scores (0-12) for risk scoring. */
const COUNTRY_REGULATORY_URGENCY: Record<string, number> = {
  'United States': 12, // CNSA 2.0, FedRAMP, FIPS 140-3
  France: 10, // ANSSI 2025 mandate
  Germany: 8, // BSI PQC guidance, NIS2
  Netherlands: 7, // NIS2, EU financial regulation
  'United Kingdom': 7, // NCSC PQC guidance
  Australia: 6, // ASD guidance
  Canada: 6, // CCCS guidance
  Japan: 5, // NISC guidance
  'South Korea': 5, // KISA guidance
  Spain: 6, // NIS2
  Italy: 6, // NIS2
  Belgium: 6, // NIS2
  Sweden: 6, // NIS2
  Denmark: 5, // NIS2
}

/** Expose compliance deadline/notes for UI tooltips in the wizard. */
export const COMPLIANCE_DESCRIPTIONS: Record<string, { deadline: string; notes: string }> =
  Object.fromEntries(
    Object.entries(COMPLIANCE_DB).map(([k, v]) => [k, { deadline: v.deadline, notes: v.notes }])
  )

// Planning horizon aligned with NIST and NSA guidance (2030–2035 range).
// NSA CNSA 2.0 targets 2030 for software; NIST uses 2035 as conservative planning horizon.
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
  // When user indicated unknown crypto, apply a conservative default equivalent to RSA-2048 + ECDH
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

  // Data sensitivity modifier (0-15). Caps at 15 (= 25 * 0.6) — sensitivity is a modifier,
  // not a primary driver; algorithm exposure and data retention dominate quantum exposure.
  // Not knowing sensitivity → treat as 'high' (conservative worst-case)
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
  // Crypto agility is the major factor (0-40)

  const agilityFactor = AGILITY_COMPLEXITY[input.cryptoAgility ?? 'unknown'] ?? 0.7
  const agilityScore = agilityFactor * 40

  // Infrastructure complexity (0-30)
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

  // System scale (0-15)

  const scale = SYSTEM_SCALE[input.systemCount ?? '11-50'] ?? 1.3
  const scaleScore = Math.min(15, scale * 7.5)

  // Vendor dependency (0-15)
  // Not knowing vendor dependency → treat as heavy-vendor (worst case)
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
  // PQC-required frameworks (0-40)
  const pqcCount = complianceImpacts.filter((c) => c.requiresPQC).length
  const frameworkScore = Math.min(40, pqcCount * 12)

  // Industry regulatory weight (0-25)

  const industryBase = INDUSTRY_THREAT[input.industry] ?? 10
  const industryRegScore = Math.min(25, industryBase * 0.85)

  // Country-specific regulatory urgency (0-10), independent of framework selection
  const countryUrgency = COUNTRY_REGULATORY_URGENCY[input.country ?? ''] ?? 0

  // Timeline pressure (multiplier applied at end)
  const timelineMul = TIMELINE_URGENCY[input.timelinePressure ?? 'unknown'] ?? 1.1

  const raw = (frameworkScore + industryRegScore + Math.min(10, countryUrgency)) * timelineMul

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
  // Not knowing vendor dependency → treat as heavy-vendor (worst case)
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

  // HNDL multiplier: critical data + long retention + migration not started
  if (
    input.dataSensitivity.includes('critical') &&
    input.dataRetention?.length &&
    getMaxRetentionYears(input.dataRetention) > 10 &&
    input.migrationStatus !== 'started'
  ) {
    composite *= 1.15
  }

  // HNFL multiplier: signing algos + long credential lifetime + migration not started
  const hasSigningAlgos = (input.currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a))
  if (
    hasSigningAlgos &&
    input.credentialLifetime?.length &&
    Math.max(...input.credentialLifetime.map((v) => CREDENTIAL_LIFETIME_YEARS[v] ?? 0)) > 10 && // eslint-disable-line security/detect-object-injection
    input.migrationStatus !== 'started'
  ) {
    composite *= 1.1
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
  const isEstimated = !!input.retentionUnknown
  if (!input.dataRetention?.length && !isEstimated) return undefined

  const currentYear = new Date().getFullYear()

  // Conservative default: 15 years when user doesn't know retention period
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
    !!input.currentCryptoUnknown // conservative: treat unknown as potentially signing

  // Conservative default: 10 years when user doesn't know credential lifetimes
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

  // ── Awareness-gap actions (highest priority — fill knowledge voids first) ──

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

  // Only fire compliance awareness action when user explicitly said "I don't know" (not "none apply")
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

  // Only fire use-case awareness action when user explicitly said "I don't know" (not "none apply")
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

  // Only fire infrastructure awareness action when user explicitly said "I don't know" (not "none apply")
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

  // Build context-aware algorithm highlight URLs
  const vulnerableAlgoNames = input.currentCrypto.filter((a) => ALGORITHM_DB[a]?.quantumVulnerable) // eslint-disable-line security/detect-object-injection

  // Quick wins first
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

  // Major algorithm migrations
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

  // Remaining moderate migrations
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

  // Use-case-specific TLS action
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

  // HNFL actions — signing algorithms + long-lived credentials at risk
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

function computeAssessment(input: AssessmentInput): AssessmentResult {
  // Build algorithm migrations and compliance impacts (shared by both paths)
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

  const complianceImpacts: ComplianceImpact[] = input.complianceRequirements.map((fw) => {
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

  // Determine if this is an extended assessment
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
export const AVAILABLE_CREDENTIAL_LIFETIME: string[] = [
  'under-1y',
  '1-3y',
  '3-10y',
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
