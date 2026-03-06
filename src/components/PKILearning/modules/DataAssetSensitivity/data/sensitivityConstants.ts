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
      hybrid: 'X25519+ML-KEM-512',
      rationale: 'Lightweight hybrid TLS for non-sensitive channels',
    },
    credential: {
      kem: 'ML-KEM-512 (FIPS 203)',
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'X25519+ML-KEM-512',
      rationale: 'Minimum PQC for credential systems',
    },
    'code-artifact': {
      kem: null,
      signature: 'ML-DSA-44 (FIPS 204)',
      hybrid: 'ML-DSA-44 + ECDSA P-256',
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

// ── Classification Challenge Data ────────────────────────────────────────────

export interface ClassificationScenario {
  id: string
  title: string
  description: string
  context: string
  correctTier: SensitivityTier
  explanation: string
  hndlImplication: string
  commonMistake: string
  relevantFrameworks: string[]
}

export const CLASSIFICATION_SCENARIOS: ClassificationScenario[] = [
  {
    id: 'cls-01',
    title: 'Hospital Electronic Health Records',
    description:
      'A regional hospital stores patient electronic health records (EHR) including diagnoses, medications, lab results, and treatment history. Records are retained for a minimum of 10 years per regulatory requirements.',
    context:
      'Healthcare sector; accessed by clinical staff and billing; stored in an on-premises database encrypted with RSA-2048 envelope keys.',
    correctTier: 'critical',
    explanation:
      'EHR data combines ePHI (HIPAA), long retention (10+ years), and irreplaceable personal health details. HNDL risk is immediate: data intercepted today may be decrypted after CRQC arrival (est. 2034) well within the retention window. HIPAA + HITECH mandate the highest protection level.',
    hndlImplication:
      'HNDL risk year ≈ 2024 (2034 − 10 years). Data already in the HNDL window — adversaries intercepting today can decrypt after 2034.',
    commonMistake:
      'Many classify as High (HIPAA ePHI default). The 10-year retention pushes this into Critical because the HNDL window has already opened.',
    relevantFrameworks: ['HIPAA', 'HITECH', 'NIST-SP-800-66'],
  },
  {
    id: 'cls-02',
    title: 'JWT Access Tokens',
    description:
      'Short-lived JSON Web Tokens issued by an identity provider for API authentication. Tokens expire after 15 minutes, contain user ID and role claims, and are never stored server-side after issuance.',
    context:
      'Technology sector; transmitted over TLS 1.3; no persistence beyond the active session.',
    correctTier: 'low',
    explanation:
      'JWTs with a 15-minute TTL have near-zero HNDL risk. By the time a CRQC could decrypt intercepted traffic, the token is long expired and has no value. No PII is stored beyond the transient session, and there is no meaningful retention period.',
    hndlImplication:
      'HNDL risk year ≈ 2034 (less than 1 year retention). Token is worthless before CRQC arrives — effectively no HNDL threat.',
    commonMistake:
      'Classifying as Medium because tokens carry authentication claims. The key factor is lifetime: ephemeral credentials with no storage have minimal exposure.',
    relevantFrameworks: ['NIST-IR-8547'],
  },
  {
    id: 'cls-03',
    title: 'Root CA Signing Key',
    description:
      'The private key of an internal root certificate authority used to sign subordinate CA certificates and TLS server certificates across the enterprise PKI. The key is generated once and expected to remain valid for 25+ years.',
    context:
      'Finance sector; stored offline in an air-gapped HSM; access requires dual-control ceremony.',
    correctTier: 'critical',
    explanation:
      'Root CA keys are irreplaceable cryptographic anchors. If compromised, all certificates in the trust chain must be revoked and reissued. With a 25-year expected lifetime, the HNDL window is deep into the past — any captured ceremony traffic is at risk once CRQC arrives. CNSA 2.0 mandates PQC for all key material by 2030.',
    hndlImplication:
      'HNDL risk year ≈ 2009 (2034 − 25 years). Any recorded key-generation or signing ceremony from the past 15 years is exposed.',
    commonMistake:
      'Classifying as High because it is "already in an HSM." HSM protection guards against direct theft, but HNDL captures network-transmitted usage and ceremonial data.',
    relevantFrameworks: ['CNSA-2.0', 'FIPS-140-3', 'NIST-SP-800-57'],
  },
  {
    id: 'cls-04',
    title: 'Internal Engineering Slack Messages',
    description:
      'Day-to-day text messages in a company-internal Slack workspace between software engineering team members. Messages cover sprint planning, code reviews, and deployment discussions. Retention is 90 days (Slack free tier).',
    context:
      'Technology sector; SaaS platform; no PII, trade secrets, or classified information in scope.',
    correctTier: 'medium',
    explanation:
      'Internal communications between employees with no PII, trade secrets, or regulated data fall in the Medium tier. They are not public (some breach consequence exists if leaked), but 90-day retention means HNDL risk is negligible. The primary risk is operational confidentiality, not regulatory exposure.',
    hndlImplication:
      'HNDL risk year ≈ 2034 (under 1 year retention). Essentially zero HNDL threat — messages expire long before CRQC arrival.',
    commonMistake:
      'Classifying as Low because "it is just chat." Internal communications can reveal system architecture, vulnerabilities, and credentials if captured — Medium is appropriate.',
    relevantFrameworks: [],
  },
  {
    id: 'cls-05',
    title: 'Credit Card Transaction Records',
    description:
      'Encrypted records of credit card transactions including masked PAN (last 4 digits), transaction amount, merchant, and timestamp. CVV is never stored post-authorization. Records retained for 7 years for chargeback and audit purposes.',
    context:
      'Retail/E-commerce sector; PCI DSS Level 1 merchant; stored in a tokenized database with AES-256 encryption.',
    correctTier: 'high',
    explanation:
      'Payment records fall under PCI DSS with a 7-year retention requirement. While CVV is not stored and PAN is masked, the combination of transaction history, timing, and merchant data can still be used for fraud or identity inference. With 7-year retention, the HNDL window opens around 2027 — moderate urgency.',
    hndlImplication:
      'HNDL risk year ≈ 2027 (2034 − 7 years). Records encrypted today will be at risk from CRQC within 8 years.',
    commonMistake:
      'Classifying as Critical because "financial data." No full PAN or CVV stored reduces impact. The 7-year retention and PCI DSS requirements land this firmly at High.',
    relevantFrameworks: ['PCI-DSS', 'GDPR'],
  },
  {
    id: 'cls-06',
    title: 'Government Satellite Telemetry',
    description:
      'Encrypted downlink telemetry data from a classified government reconnaissance satellite, including positional data, sensor readings, and mission status. Data is retained indefinitely at a classified facility.',
    context:
      'Government/Defense sector; encrypted with AES-256 and RSA-4096; indefinite retention; NSA-classified.',
    correctTier: 'critical',
    explanation:
      'Classified national security data with indefinite retention is the canonical Critical case. Even if encrypted today, adversaries recording this traffic will decrypt it post-CRQC. Operational intelligence from decades ago can still compromise ongoing missions, personnel, and national security. CNSA 2.0 mandates immediate PQC migration for this class.',
    hndlImplication:
      'HNDL risk year ≈ 1984 (indefinite retention). All historical intercepts are at risk the moment CRQC arrives.',
    commonMistake:
      'No common mistake — this is unambiguously Critical. The exercise point is understanding why indefinite retention triggers the worst HNDL exposure.',
    relevantFrameworks: ['CNSA-2.0', 'NIST-SP-800-53', 'FIPS-140-3'],
  },
  {
    id: 'cls-07',
    title: 'E-Commerce Recommendation Cache',
    description:
      'Server-side cache of product recommendation scores computed from aggregated browsing behavior. The cache contains no user identifiers — only product ID pairs and collaborative-filtering weights. Cache entries expire after 30 days.',
    context:
      'Retail sector; stored in Redis; no PII; publicly derived from aggregate behavior patterns.',
    correctTier: 'low',
    explanation:
      'Anonymous aggregate recommendation data with no PII and a 30-day TTL has minimal sensitivity. There is no compliance burden, no HNDL risk (data is stale before CRQC arrives), and no individual harm if exposed. Public products with public pricing need no special protection.',
    hndlImplication:
      'HNDL risk year ≈ 2034 (under 1 year). Data is replaced faster than any adversary could use it.',
    commonMistake:
      'Classifying as Medium citing "business value." Competitive sensitivity applies to the algorithm, not the cached scores which are ephemeral and non-identifying.',
    relevantFrameworks: [],
  },
  {
    id: 'cls-08',
    title: 'Biometric Authentication Templates',
    description:
      'Fingerprint minutiae templates extracted and stored for employee access control at a secure data center. Templates cannot be changed — if compromised, the employee permanently loses use of that authentication factor.',
    context:
      'Technology/Finance sector; stored in an HSM; used for physical and logical access; retained for employee tenure + 5 years.',
    correctTier: 'critical',
    explanation:
      'Biometric templates are irreplaceable — unlike passwords, you cannot issue new fingerprints. Even with long employment tenures (e.g., 20+ years), permanent retention means HNDL exposure is severe. Compromise enables permanent impersonation. GDPR Art. 9 classifies biometrics as "special category" data requiring maximum protection.',
    hndlImplication:
      "HNDL risk year ≈ 2014 (2034 − 20 years typical tenure). Long-serving employees' templates are already at HNDL risk.",
    commonMistake:
      'Classifying as High because "it is just access control." The irreplaceability and lifetime binding to a person — not the operational function — drives the Critical classification.',
    relevantFrameworks: ['GDPR', 'FIPS-140-3', 'NIST-SP-800-76'],
  },
  {
    id: 'cls-09',
    title: 'Public-Facing API TLS Certificate',
    description:
      "An X.509 TLS server certificate used to authenticate a public REST API endpoint. The certificate is auto-renewed every 90 days via ACME/Let's Encrypt. The corresponding private key is generated fresh on each renewal.",
    context:
      "Technology sector; publicly trusted CA; ECDSA P-256; private key never leaves the server's HSM partition.",
    correctTier: 'medium',
    explanation:
      'Short-lived TLS certificates (90-day cycle with fresh key generation) have near-zero HNDL risk since the key protecting any intercepted session is rotated before CRQC arrives. However, the certificate does identify the service, and the private key controls session establishment — enough to warrant Medium rather than Low.',
    hndlImplication:
      'HNDL risk year ≈ 2034 (under 1 year retention). Each key lives only 90 days — essentially immune to HNDL attacks.',
    commonMistake:
      'Classifying as High because "it protects all API traffic." Traffic confidentiality depends on ephemeral key exchange (ECDHE), not the certificate lifetime. The certificate itself is publicly distributed.',
    relevantFrameworks: ['NIST-IR-8547', 'CA-B-Forum'],
  },
  {
    id: 'cls-10',
    title: 'Employee Payroll Records',
    description:
      'Payroll records including full legal name, national ID (SSN/SIN), bank account numbers, salary history, and tax withholding data for all employees. Records retained for 7 years per employment law.',
    context:
      'Any industry; HR system; encrypted with AES-256 at rest; accessible to HR, payroll service, and auditors.',
    correctTier: 'high',
    explanation:
      'Payroll records include SSNs and bank account numbers — two of the most impactful categories in identity theft. With a 7-year retention requirement, the HNDL window opens around 2027. Regulatory exposure spans GDPR (for EU employees), US state privacy laws, and employment regulations. This is squarely High.',
    hndlImplication:
      'HNDL risk year ≈ 2027 (2034 − 7 years). Records created now will still be held when CRQC arrives.',
    commonMistake:
      'Classifying as Critical because it contains SSNs. While SSNs are highly sensitive, payroll records are bounded by employment tenure and 7-year retention — enough for High but not the indefinite/irreplaceable threshold of Critical.',
    relevantFrameworks: ['GDPR', 'CCPA', 'NIST-SP-800-122'],
  },
]

// ── Conflict Resolver Data ────────────────────────────────────────────────────

export type ConflictResolutionRule =
  | 'most-restrictive'
  | 'jurisdiction-priority'
  | 'data-subject-location'
  | 'asset-type-override'

export interface ConflictingRequirement {
  framework: string
  prescribedTier: SensitivityTier
  reason: string
}

export interface ConflictScenario {
  id: string
  title: string
  assetDescription: string
  conflictingRequirements: ConflictingRequirement[]
  resolutionRule: ConflictResolutionRule
  correctTier: SensitivityTier
  governingFramework: string
  explanation: string
  pqcImplication: string
}

export const CONFLICT_SCENARIOS: ConflictScenario[] = [
  {
    id: 'con-01',
    title: 'US Hospital Serving EU Patients — Patient EHR Database',
    assetDescription:
      'A US hospital stores EHR data for patients that include both US and EU residents. The same database is subject to HIPAA (US healthcare law) and GDPR (EU personal data regulation).',
    conflictingRequirements: [
      {
        framework: 'HIPAA / HITECH',
        prescribedTier: 'high',
        reason:
          'ePHI requires robust protection and 6-year retention; no prescribed cryptographic standard.',
      },
      {
        framework: 'GDPR Art. 9',
        prescribedTier: 'high',
        reason:
          'Health data is "special category" requiring explicit consent and state-of-the-art encryption.',
      },
      {
        framework: 'NIST SP 800-66',
        prescribedTier: 'high',
        reason: 'HIPAA implementation guide recommends NIST Level 3+ controls for ePHI.',
      },
    ],
    resolutionRule: 'most-restrictive',
    correctTier: 'high',
    governingFramework: 'GDPR + HIPAA (equal; GDPR adds data subject rights)',
    explanation:
      "Both HIPAA and GDPR land this at High. The resolution rule here is not about escalating the tier — both agree. However, GDPR adds additional obligations: right to erasure, data portability, and explicit consent for each use. The governing classification is High, but operational requirements follow GDPR's stricter obligations. When frameworks agree on tier but disagree on operational requirements, apply the most restrictive operational requirements from each.",
    pqcImplication:
      'ML-KEM-768 (FIPS 203) for key encapsulation, ML-DSA-65 (FIPS 204) for signatures. Both NIST Level 3 — satisfies HIPAA, GDPR "state of the art," and NIST SP 800-66 guidance.',
  },
  {
    id: 'con-02',
    title: 'EU Payment Gateway — Transaction Processing System',
    assetDescription:
      'A payment gateway operating in the EU processes credit card transactions and is classified as a critical ICT service under DORA. The same system handles cardholder data subject to PCI DSS v4.0.',
    conflictingRequirements: [
      {
        framework: 'PCI DSS v4.0',
        prescribedTier: 'high',
        reason:
          'Cardholder data requires encryption, access controls, and annual assessments. PQC not yet mandated but recommended.',
      },
      {
        framework: 'DORA (EU)',
        prescribedTier: 'critical',
        reason:
          'Critical ICT services require operational resilience, crypto-agility, and ENISA-aligned PQC readiness by 2026.',
      },
    ],
    resolutionRule: 'jurisdiction-priority',
    correctTier: 'critical',
    governingFramework: 'DORA (EU)',
    explanation:
      "DORA elevates this to Critical because it classifies the entire payment gateway as a critical ICT service — not just the cardholder data. DORA's ICT operational resilience requirements are more stringent and broader in scope than PCI DSS for this asset type. When a jurisdiction-specific regulation explicitly designates a system as critical infrastructure, that designation overrides a narrower data-centric classification.",
    pqcImplication:
      "ML-KEM-1024 (FIPS 203) and ML-DSA-87 (FIPS 204) — NIST Level 5 to satisfy DORA's critical ICT requirements. Hybrid with X25519+ML-KEM-1024 for transition.",
  },
  {
    id: 'con-03',
    title: 'Defense Contractor Root CA Key',
    assetDescription:
      'A US defense contractor operates a private PKI. The root CA private key is used to sign certificates for classified systems. It is stored in an HSM and subject to both FedRAMP authorization requirements and CMVP FIPS 140-3 validation.',
    conflictingRequirements: [
      {
        framework: 'FedRAMP High',
        prescribedTier: 'high',
        reason:
          'FedRAMP High impact systems require FIPS 140-2+ validated cryptography and NIST SP 800-53 High controls.',
      },
      {
        framework: 'CMVP / FIPS 140-3',
        prescribedTier: 'critical',
        reason:
          'FIPS 140-3 Security Level 4 is required for key material protecting classified systems — requires tamper-evident physical protection and the highest cryptographic assurance.',
      },
      {
        framework: 'CNSA 2.0',
        prescribedTier: 'critical',
        reason:
          'NSA mandates PQC for all key material used in classified national security systems by 2030.',
      },
    ],
    resolutionRule: 'asset-type-override',
    correctTier: 'critical',
    governingFramework: 'CNSA 2.0 + FIPS 140-3 Security Level 4',
    explanation:
      'Key material (cryptographic keys) always escalates to the highest applicable tier. The asset-type-override rule recognizes that root CA keys are the trust anchor for all downstream certificates — their compromise is catastrophic and irreversible. Even if the data the PKI protects is only High sensitivity, the key material itself must be classified Critical. FedRAMP High (which prescribes High) applies to the data, not the key material protecting it.',
    pqcImplication:
      'SLH-DSA-256s (FIPS 205) for root CA signing — stateless hash-based signatures provide long-term security without state management risk. ML-KEM-1024 for key transport ceremonies.',
  },
  {
    id: 'con-04',
    title: 'Open-Source Firmware Signing Key (Supply Chain)',
    assetDescription:
      'A technology company produces open-source firmware for network equipment. The code-signing key is used to sign publicly released firmware images. The project has recently been designated as critical to US federal supply chains under NIST SP 800-218.',
    conflictingRequirements: [
      {
        framework: 'NIST SP 800-218 (SSDF)',
        prescribedTier: 'medium',
        reason:
          'Secure Software Development Framework classifies open-source code signing as medium risk; key material should use FIPS-validated HSMs.',
      },
      {
        framework: 'CNSA 2.0 (Supply Chain)',
        prescribedTier: 'high',
        reason:
          'When firmware is used in NSS or federal products, signing keys must meet CNSA 2.0 requirements — including PQC migration by 2030.',
      },
    ],
    resolutionRule: 'most-restrictive',
    correctTier: 'high',
    governingFramework: 'CNSA 2.0',
    explanation:
      'The most-restrictive-wins rule applies: CNSA 2.0 prescribes High for this key because it protects firmware used in federal systems. Even though the firmware is open-source and the key is "only" signing public releases, the downstream impact on national security systems elevates the classification. A compromised signing key could inject malicious firmware into critical infrastructure.',
    pqcImplication:
      'ML-DSA-65 (FIPS 204) for code signing — NIST Level 3 satisfies CNSA 2.0 requirements for non-classified federal supply chain components. Hybrid with ECDSA P-256 during transition.',
  },
  {
    id: 'con-05',
    title: 'IoT Device with Embedded TLS Private Key',
    assetDescription:
      "A smart energy meter contains an embedded TLS private key provisioned at manufacturing time and used for secure communications with the utility's backend. The device data transmitted (energy readings) is not sensitive, but the key itself is embedded for the device's lifetime (10–15 years).",
    conflictingRequirements: [
      {
        framework: 'ETSI EN 303 645',
        prescribedTier: 'low',
        reason:
          'Consumer IoT standard classifies energy reading data as low sensitivity — basic encryption sufficient; no PQC mandate.',
      },
      {
        framework: 'FIPS 140-3 (Key Material)',
        prescribedTier: 'high',
        reason:
          'Embedded cryptographic keys with 10–15 year operational lifetimes must be treated as High — they will be active past estimated CRQC arrival and cannot be easily rotated.',
      },
      {
        framework: 'NIST SP 800-82 (ICS/OT)',
        prescribedTier: 'high',
        reason:
          'Critical infrastructure IoT devices require robust cryptographic protection for authentication keys.',
      },
    ],
    resolutionRule: 'asset-type-override',
    correctTier: 'high',
    governingFramework: 'FIPS 140-3 + NIST SP 800-82',
    explanation:
      'The asset-type-override rule elevates key material above the data it protects. The energy readings are Low, but the embedded private key is High because: (1) it is key material, (2) it has a 10–15 year lifetime extending past CRQC arrival, and (3) it cannot be rotated without physical device access. The classification of the key is independent of the sensitivity of the data it encrypts.',
    pqcImplication:
      'ML-KEM-512 (FIPS 203) for key exchange — minimum PQC for device-constrained environments. Consider hardware support requirements before specifying; some constrained devices may require Kyber-512 interim implementations.',
  },
  {
    id: 'con-06',
    title: 'Global AI Training Dataset with PII',
    assetDescription:
      'A technology company trains an AI model on a dataset containing user-generated content that includes names, email addresses, and behavioral patterns from users in the EU (GDPR), California (CCPA), and Brazil (LGPD). The same dataset is used across all jurisdictions.',
    conflictingRequirements: [
      {
        framework: 'GDPR (EU)',
        prescribedTier: 'high',
        reason:
          'Personal data including behavioral profiling requires lawful basis, data minimization, and state-of-the-art encryption. Violation fines up to 4% of global revenue.',
      },
      {
        framework: 'CCPA / CPRA (California)',
        prescribedTier: 'medium',
        reason:
          "Covers California residents' personal information; requires opt-out of sale and reasonable security. Less prescriptive than GDPR on cryptographic requirements.",
      },
      {
        framework: 'LGPD (Brazil)',
        prescribedTier: 'high',
        reason:
          'Brazil\'s data protection law mirrors GDPR in scope and requirements, including "appropriate technical measures" for protection.',
      },
    ],
    resolutionRule: 'data-subject-location',
    correctTier: 'high',
    governingFramework: 'GDPR + LGPD (most restrictive applicable laws)',
    explanation:
      "The data-subject-location rule applies: you must comply with the requirements applicable to each data subject based on where they are located — even if you process data in a single jurisdiction. Since the dataset contains EU and Brazilian residents, both GDPR and LGPD apply (both prescribe High). CCPA prescribes Medium but doesn't override the stricter obligations for EU/BR data subjects in the same dataset. The entire dataset must meet the High standard to protect all subjects.",
    pqcImplication:
      'ML-KEM-768 (FIPS 203) + ML-DSA-65 (FIPS 204) — NIST Level 3 satisfies GDPR and LGPD "state of the art" requirements. Encryption at rest and in transit must cover all copies of the training dataset.',
  },
]

// ── Related Module Links by Asset Type ───────────────────────────────────────

export const RELATED_MODULE_MAP: Record<AssetType, { id: string; title: string }> = {
  'key-material': { id: 'kms-pqc', title: 'KMS & PQC Key Management' },
  'data-store': { id: 'kms-pqc', title: 'KMS & PQC Key Management' },
  communication: { id: 'tls-basics', title: 'TLS Basics' },
  credential: { id: 'pki-workshop', title: 'PKI' },
  'code-artifact': { id: 'code-signing', title: 'Code Signing' },
}

// ── Scoring Logic ─────────────────────────────────────────────────────────────

export function computeHndlRiskYear(
  retentionPeriod: RetentionPeriod,
  crqcYear: number = ESTIMATED_CRQC_YEAR
): number {
  const config = RETENTION_CONFIGS.find((r) => r.id === retentionPeriod)
  const years = config?.years ?? 0
  return Math.round(crqcYear - years)
}

export function scoreAsset(
  asset: DataAsset,
  weights: ScoringWeights,
  crqcYear: number = ESTIMATED_CRQC_YEAR
): ScoredAsset {
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
  const hndlYear = computeHndlRiskYear(asset.retentionPeriod, crqcYear)
  let hndlScore: number
  if (hndlYear <= CURRENT_YEAR) {
    hndlScore = 100
  } else {
    const remainingYears = hndlYear - CURRENT_YEAR
    const totalWindow = crqcYear - CURRENT_YEAR
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
