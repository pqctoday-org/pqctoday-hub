// SPDX-License-Identifier: GPL-3.0-only

// ── Core Types ────────────────────────────────────────────────────────────────

export type SensitivityTier = 'low' | 'medium' | 'high' | 'critical'
export type AssetType =
  | 'data-store'
  | 'key-material'
  | 'communication'
  | 'credential'
  | 'code-artifact'
export type RetentionPeriod = 'under-1y' | '1-5y' | '5-10y' | '10-25y' | '25-plus' | 'indefinite'
export type MigrationEffort = 'low' | 'medium' | 'high'

export interface DataAsset {
  id: string
  name: string
  assetType: AssetType
  sensitivityTier: SensitivityTier
  retentionPeriod: RetentionPeriod
  currentEncryption: string
  businessOwner: string
  industry: string
  complianceFlags: string[]
  notes?: string
}

export interface PQCRecommendation {
  kem: string | null
  signature: string | null
  hybrid: string
  rationale: string
}

export interface ScoredAsset extends DataAsset {
  sensitivityScore: number
  retentionScore: number
  complianceScore: number
  hndlScore: number
  compositeScore: number
  pqcRecommendation: PQCRecommendation
  migrationEffort: MigrationEffort
}

export interface ScoringWeights {
  sensitivity: number
  retention: number
  compliance: number
  hndlWindow: number
}

// ── Config Interfaces ─────────────────────────────────────────────────────────

export interface SensitivityTierConfig {
  id: SensitivityTier
  label: string
  description: string
  examples: string[]
  hndlRisk: 'minimal' | 'low' | 'significant' | 'immediate'
  pqcUrgency: 'when-convenient' | 'standard' | 'high' | 'urgent'
  colorClass: string
  bgClass: string
  borderClass: string
  weight: number
}

export interface RetentionConfig {
  id: RetentionPeriod
  label: string
  description: string
  years: number
  weight: number
}

export interface AssetTypeConfig {
  id: AssetType
  label: string
  description: string
  typicalEncryption: string[]
  defaultSensitivity: SensitivityTier
}

// ── Risk Methodology Result Types ─────────────────────────────────────────────

export interface NISTRMFResult {
  fips199Level: 'Low' | 'Moderate' | 'High'
  controlGaps: string[]
  riskScore: number
  recommendation: string
}

export interface ISO27005Result {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  threatScenarios: string[]
  treatment: 'Accept' | 'Mitigate' | 'Transfer' | 'Avoid'
  likelihoodScore: number
  consequenceScore: number
}

export interface FAIRResult {
  aleMin: number
  aleMostLikely: number
  aleMax: number
  tef: number
  vulnerability: number
  primaryLoss: number
  secondaryLoss: number
}

export interface DORANis2Result {
  gapScore: number
  affectedPillars: string[]
  cryptoCompliant: boolean
  priorityRemediations: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const ESTIMATED_CRQC_YEAR = 2034

export const CURRENT_YEAR = 2026

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  sensitivity: 30,
  retention: 25,
  compliance: 25,
  hndlWindow: 20,
}

export const SENSITIVITY_TIERS: SensitivityTierConfig[] = [
  {
    id: 'low',
    label: 'Low',
    description: 'Publicly available or non-sensitive internal data',
    examples: ['Marketing content', 'Public documentation', 'Open-source code', 'Announcements'],
    hndlRisk: 'minimal',
    pqcUrgency: 'when-convenient',
    colorClass: 'text-status-success',
    bgClass: 'bg-status-success/10',
    borderClass: 'border-status-success/30',
    weight: 10,
  },
  {
    id: 'medium',
    label: 'Medium',
    description: 'Internal business data with limited exposure consequences',
    examples: [
      'Employee records (non-sensitive)',
      'Internal communications',
      'Operational data',
      'Non-PII analytics',
    ],
    hndlRisk: 'low',
    pqcUrgency: 'standard',
    colorClass: 'text-status-info',
    bgClass: 'bg-status-info/10',
    borderClass: 'border-status-info/30',
    weight: 40,
  },
  {
    id: 'high',
    label: 'High',
    description: 'Sensitive personal or financial data with significant breach consequences',
    examples: [
      'Customer PII',
      'Financial records',
      'Healthcare data (ePHI)',
      'Legal communications',
      'Authentication secrets',
    ],
    hndlRisk: 'significant',
    pqcUrgency: 'high',
    colorClass: 'text-status-warning',
    bgClass: 'bg-status-warning/10',
    borderClass: 'border-status-warning/30',
    weight: 75,
  },
  {
    id: 'critical',
    label: 'Critical',
    description: 'State secrets, classified data, or indefinitely-sensitive cryptographic material',
    examples: [
      'National security data',
      'Root CA keys',
      'Long-lived signing keys',
      'Trade secrets with perpetual protection',
    ],
    hndlRisk: 'immediate',
    pqcUrgency: 'urgent',
    colorClass: 'text-status-error',
    bgClass: 'bg-status-error/10',
    borderClass: 'border-status-error/30',
    weight: 100,
  },
]

export const RETENTION_CONFIGS: RetentionConfig[] = [
  {
    id: 'under-1y',
    label: 'Under 1 year',
    description: 'Short-lived transient data',
    years: 0.5,
    weight: 10,
  },
  {
    id: '1-5y',
    label: '1–5 years',
    description: 'Standard operational retention',
    years: 3,
    weight: 30,
  },
  {
    id: '5-10y',
    label: '5–10 years',
    description: 'Long-term business records',
    years: 7,
    weight: 55,
  },
  {
    id: '10-25y',
    label: '10–25 years',
    description: 'Regulatory long-retention (healthcare, financial)',
    years: 17,
    weight: 80,
  },
  {
    id: '25-plus',
    label: '25+ years',
    description: 'Decades-long retention (government, critical infrastructure)',
    years: 30,
    weight: 95,
  },
  {
    id: 'indefinite',
    label: 'Indefinite',
    description: 'No defined expiry (root CA keys, national security data)',
    years: 50,
    weight: 100,
  },
]

export const ASSET_TYPES: AssetTypeConfig[] = [
  {
    id: 'data-store',
    label: 'Data Store',
    description: 'Databases, file systems, object storage containing sensitive data',
    typicalEncryption: ['AES-256-GCM', 'RSA-2048 envelope', 'TLS at rest'],
    defaultSensitivity: 'high',
  },
  {
    id: 'key-material',
    label: 'Key Material',
    description: 'Cryptographic keys, certificates, HSM-protected secrets',
    typicalEncryption: ['RSA-4096', 'ECDSA P-384', 'AES-256-KW'],
    defaultSensitivity: 'critical',
  },
  {
    id: 'communication',
    label: 'Communication Channel',
    description: 'TLS sessions, VPN tunnels, API connections',
    typicalEncryption: ['ECDHE-P256', 'RSA-2048', 'TLS 1.3'],
    defaultSensitivity: 'medium',
  },
  {
    id: 'credential',
    label: 'Credential',
    description: 'Passwords, tokens, authentication secrets, session keys',
    typicalEncryption: ['bcrypt', 'PBKDF2', 'AES-256'],
    defaultSensitivity: 'high',
  },
  {
    id: 'code-artifact',
    label: 'Code / Firmware',
    description: 'Signed software releases, firmware images, container registries',
    typicalEncryption: ['RSA-3072 signature', 'ECDSA P-256 signature'],
    defaultSensitivity: 'medium',
  },
]

export const DEFAULT_ASSETS: DataAsset[] = [
  {
    id: 'asset-1',
    name: 'Customer PII Database',
    assetType: 'data-store',
    sensitivityTier: 'high',
    retentionPeriod: '5-10y',
    currentEncryption: 'RSA-2048 envelope + AES-256-GCM at rest',
    businessOwner: 'Data Engineering',
    industry: 'Finance & Banking',
    complianceFlags: ['GDPR', 'PCI-DSS'],
    notes: 'EU and US customers',
  },
  {
    id: 'asset-2',
    name: 'TLS Server Certificates',
    assetType: 'communication',
    sensitivityTier: 'medium',
    retentionPeriod: 'under-1y',
    currentEncryption: 'ECDSA P-256 (auto-rotating 90d)',
    businessOwner: 'Platform Engineering',
    industry: 'Technology',
    complianceFlags: ['NIST-IR-8547'],
    notes: '',
  },
  {
    id: 'asset-3',
    name: 'Root CA Signing Key',
    assetType: 'key-material',
    sensitivityTier: 'critical',
    retentionPeriod: '25-plus',
    currentEncryption: 'RSA-4096 in Luna HSM',
    businessOwner: 'PKI Operations',
    industry: 'Government & Defense',
    complianceFlags: ['CNSA-2.0', 'FIPS-140-3'],
    notes: 'Offline, air-gapped',
  },
  {
    id: 'asset-4',
    name: 'Marketing Email Lists',
    assetType: 'data-store',
    sensitivityTier: 'low',
    retentionPeriod: '1-5y',
    currentEncryption: 'TLS in transit, AES-256 at rest',
    businessOwner: 'Marketing',
    industry: 'Retail & E-Commerce',
    complianceFlags: ['GDPR'],
    notes: '',
  },
]

export const AVAILABLE_INDUSTRIES: string[] = [
  'Finance & Banking',
  'Government & Defense',
  'Healthcare',
  'Telecommunications',
  'Technology',
  'Energy & Utilities',
  'Automotive',
  'Aerospace',
  'Retail & E-Commerce',
  'Insurance',
  'Legal / eSignature',
  'Payment Card Industry',
  'Supply Chain / Logistics',
  'IoT / OT',
  'Media / Entertainment',
  'Other',
]

// ── PQC Algorithm Recommendation Map ─────────────────────────────────────────

export const PQC_ALGORITHM_MAP: Record<SensitivityTier, Record<AssetType, PQCRecommendation>> = {
  critical: {
    'data-store': {
      kem: 'ML-KEM-1024 (FIPS 203)',
      signature: 'ML-DSA-87 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-1024',
      rationale: 'Critical data warrants maximum security (NIST Level 5)',
    },
    'key-material': {
      kem: 'ML-KEM-1024 (FIPS 203)',
      signature: 'SLH-DSA-256s (FIPS 205)',
      hybrid: 'X25519+ML-KEM-1024',
      rationale:
        'Long-lived key material requires stateless hash signatures for maximum longevity assurance',
    },
    communication: {
      kem: 'ML-KEM-1024 (FIPS 203)',
      signature: 'ML-DSA-87 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-1024',
      rationale: 'Highly sensitive channels require NIST Level 5 protection',
    },
    credential: {
      kem: 'ML-KEM-1024 (FIPS 203)',
      signature: 'ML-DSA-87 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-1024',
      rationale: 'Critical credentials demand highest security level',
    },
    'code-artifact': {
      kem: null,
      signature: 'SLH-DSA-256s (FIPS 205)',
      hybrid: 'ML-DSA-87 + ECDSA P-384',
      rationale: 'Long-lived firmware signatures benefit from hash-based stateless signatures',
    },
  },
  high: {
    'data-store': {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-65 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'High sensitivity data warrants NIST Level 3 protection',
    },
    'key-material': {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-65 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Recommended baseline for high-value key material',
    },
    communication: {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-65 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Standard recommendation for secure channels carrying high-sensitivity data',
    },
    credential: {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-65 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Industry standard for authentication credential protection',
    },
    'code-artifact': {
      kem: null,
      signature: 'ML-DSA-65 (FIPS 204)',
      hybrid: 'ML-DSA-65 + ECDSA P-256',
      rationale: 'Efficient signing with strong security for software integrity',
    },
  },
  medium: {
    'data-store': {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Balanced security for medium sensitivity internal data',
    },
    'key-material': {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-65 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Key material always warrants at least Level 3 protection',
    },
    communication: {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'TLS 1.3 default recommendation with ML-KEM hybrid',
    },
    credential: {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Standard hybrid for authentication systems',
    },
    'code-artifact': {
      kem: null,
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'ML-DSA-44 + ECDSA P-256',
      rationale: 'Efficient signing for medium-criticality software',
    },
  },
  low: {
    'data-store': {
      kem: 'ML-KEM-512 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-512',
      rationale: 'Minimum recommended PQC for any data store — when schedule permits',
    },
    'key-material': {
      kem: 'ML-KEM-768 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Even low-sensitivity key material benefits from Level 3 KEM',
    },
    communication: {
      kem: 'ML-KEM-512 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Lightweight hybrid TLS for non-sensitive channels',
    },
    credential: {
      kem: 'ML-KEM-512 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-768',
      rationale: 'Minimum PQC for credential systems',
    },
    'code-artifact': {
      kem: null,
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'ML-DSA-44',
      rationale: 'Lightweight signing for non-critical artifacts',
    },
  },
}

// ── Migration Effort by Asset Type ────────────────────────────────────────────

export const MIGRATION_EFFORT_MAP: Record<AssetType, MigrationEffort> = {
  'data-store': 'high',
  'key-material': 'high',
  communication: 'medium',
  credential: 'medium',
  'code-artifact': 'low',
}

// ── Related Module Links by Asset Type ───────────────────────────────────────

export const RELATED_MODULE_MAP: Record<AssetType, { id: string; title: string }> = {
  'key-material': { id: 'kms-pqc', title: 'KMS & PQC Key Management' },
  'data-store': { id: 'kms-pqc', title: 'KMS & PQC Key Management' },
  communication: { id: 'tls-basics', title: 'TLS Basics' },
  credential: { id: 'pki-workshop', title: 'PKI' },
  'code-artifact': { id: 'code-signing', title: 'Code Signing' },
}

// ── Scoring Logic ─────────────────────────────────────────────────────────────

export function computeHndlRiskYear(retentionPeriod: RetentionPeriod): number {
  const config = RETENTION_CONFIGS.find((r) => r.id === retentionPeriod)
  const years = config?.years ?? 0
  return Math.round(ESTIMATED_CRQC_YEAR - years)
}

export function scoreAsset(asset: DataAsset, weights: ScoringWeights): ScoredAsset {
  const tierConfig = SENSITIVITY_TIERS.find((t) => t.id === asset.sensitivityTier)
  const retConfig = RETENTION_CONFIGS.find((r) => r.id === asset.retentionPeriod)

  const sensitivityScore = tierConfig?.weight ?? 0
  const retentionScore = retConfig?.weight ?? 0

  // Compliance score: base on count + deadline bonus
  const baseCompliance = Math.min(asset.complianceFlags.length * 20, 60)
  const hasUrgentDeadline = asset.complianceFlags.some((f) =>
    ['CNSA-2.0', 'NIS2', 'DORA', 'PCI-DSS'].includes(f)
  )
  const complianceScore = Math.min(baseCompliance + (hasUrgentDeadline ? 20 : 0), 80)

  // HNDL window score
  const hndlYear = computeHndlRiskYear(asset.retentionPeriod)
  let hndlScore: number
  if (hndlYear <= CURRENT_YEAR) {
    hndlScore = 100
  } else {
    const remainingYears = hndlYear - CURRENT_YEAR
    const totalWindow = ESTIMATED_CRQC_YEAR - CURRENT_YEAR
    hndlScore = Math.max(0, Math.round((1 - remainingYears / totalWindow) * 100))
  }

  const wS = weights.sensitivity / 100
  const wR = weights.retention / 100
  const wC = weights.compliance / 100
  const wH = weights.hndlWindow / 100

  const compositeScore = Math.round(
    sensitivityScore * wS + retentionScore * wR + complianceScore * wC + hndlScore * wH
  )

  const pqcRecommendation = PQC_ALGORITHM_MAP[asset.sensitivityTier][asset.assetType]
  const migrationEffort = MIGRATION_EFFORT_MAP[asset.assetType]

  return {
    ...asset,
    sensitivityScore,
    retentionScore,
    complianceScore,
    hndlScore,
    compositeScore,
    pqcRecommendation,
    migrationEffort,
  }
}

export function getPriorityBand(score: number): {
  label: string
  colorClass: string
  bgClass: string
} {
  if (score >= 80)
    return { label: 'Critical', colorClass: 'text-status-error', bgClass: 'bg-status-error/10' }
  if (score >= 60)
    return {
      label: 'High',
      colorClass: 'text-status-warning',
      bgClass: 'bg-status-warning/10',
    }
  if (score >= 40)
    return { label: 'Medium', colorClass: 'text-status-info', bgClass: 'bg-status-info/10' }
  return {
    label: 'Low',
    colorClass: 'text-status-success',
    bgClass: 'bg-status-success/10',
  }
}
