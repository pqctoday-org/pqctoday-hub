// SPDX-License-Identifier: AGPL-3.0-only

// ── Core Types ────────────────────────────────────────────────────────────────

export type SensitivityTier = 'low' | 'medium' | 'high' | 'critical'
export type AssetType =
  'data-store' | 'key-material' | 'communication' | 'credential' | 'code-artifact'
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
    notes:
      'EU and US customers. Sample fact for this exercise: the bank offers its services to people in the EU, so GDPR Art. 3(2)(a) is met; it also handles cardholder data, so PCI DSS is in scope.',
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
    notes:
      'Sample fact for this exercise: the retailer offers goods to people in the EU, so GDPR Art. 3(2)(a) is met.',
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
        'SLH-DSA relies only on hash-function security, a conservative option for a long-lived key that signs rarely (its large signatures and slow signing matter less there). ML-DSA-87 is the alternative, and the choice depends on what the protocol and tools support. SLH-DSA is outside CNSA 2.0, so assets flagged CNSA-2.0 get ML-DSA-87 instead.',
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
      rationale:
        'SLH-DSA is stateless and relies only on hash-function security, at the cost of large signatures and slow signing; stateful LMS/XMSS (SP 800-208) are the other hash-based options for firmware. SLH-DSA is outside CNSA 2.0, so assets flagged CNSA-2.0 get ML-DSA-87 instead.',
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

/** Shown with every suggested parameter set: the suggestion does not know the learner's stack. */
export const PROTOCOL_SUPPORT_NOTE =
  'Check that your protocol, library and HSM support these parameter sets before relying on them.'

/**
 * Educational recommendation for a tier and asset type, filtered by the suites
 * that apply to the asset. An asset flagged CNSA-2.0 is limited to the
 * parameter sets NSA's CNSA 2.0 FAQ (v2.2) approves for all classification
 * levels (ML-KEM-1024, ML-DSA-87); SLH-DSA is not part of CNSA, so the general
 * sample choice is replaced rather than shown as a CNSA recommendation.
 */
export function getPqcRecommendation(
  tier: SensitivityTier,
  assetType: AssetType,
  complianceFlags: string[] = []
): PQCRecommendation {
  const base = PQC_ALGORITHM_MAP[tier][assetType]
  const withNote = (r: PQCRecommendation): PQCRecommendation => ({
    ...r,
    rationale: `${r.rationale} ${PROTOCOL_SUPPORT_NOTE}`,
  })
  if (!complianceFlags.includes('CNSA-2.0')) return withNote(base)
  return withNote({
    kem: base.kem === null ? null : 'ML-KEM-1024 (FIPS 203)',
    signature: base.signature === null ? null : 'ML-DSA-87 (FIPS 204)',
    hybrid: 'Optional: NSA does not require hybrids',
    rationale:
      'CNSA 2.0 scope: the NSA FAQ (v2.2) approves ML-KEM-1024 and ML-DSA-87 for all classification levels and says SLH-DSA is not part of CNSA, so the general sample choice is replaced. For software and firmware signing NSA also lists LMS and XMSS and wants them used whenever possible.',
  })
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
      'A regional hospital stores patient electronic health records (EHR) including diagnoses, medications, lab results, and treatment history. Records are retained for 10 years in this sample, a planning horizon chosen for the exercise rather than a figure taken from a regulation.',
    context:
      'Healthcare sector; accessed by clinical staff and billing; stored in an on-premises database encrypted with RSA-2048 envelope keys.',
    correctTier: 'critical',
    explanation:
      'EHR data combines ePHI (HIPAA), a long sample retention horizon (10 years), and irreplaceable personal health details. The HNDL concern is high: if ciphertext or traffic is recorded today and protected only by quantum-vulnerable key establishment, it could be decrypted after a CRQC arrives (assumed 2034) while the records are still held and still sensitive. The HIPAA Security Rule requires ePHI to be protected from reasonably anticipated threats and impermissible uses or disclosures, while allowing flexible, scalable compliance approaches.',
    hndlImplication:
      'Sample threshold year: 2034 − 10 = 2024, already past. Records captured now that must stay confidential for 10 years would still be sensitive when a CRQC arrives, so they would be exposed if recorded while protected only by RSA envelope keys. This is a date calculation on sample inputs; it does not show that any data has been recorded.',
    commonMistake:
      'Many classify as High (HIPAA ePHI default). The 10-year sample horizon pushes this into Critical because newly captured records would still need confidentiality when a CRQC arrives; that is a statement about future exposure, not evidence that any data has been taken.',
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
      'A 15-minute token validity means a recorded token cannot be replayed once a CRQC exists. That is a statement about credential validity, not about how long the claims it carries must stay confidential: a recorded TLS session could still reveal the user ID and role claims if its key establishment is quantum-vulnerable. Here the claims are low-sensitivity, nothing is stored beyond the session, and the need for confidentiality is short, so the module classes this Low. A token carrying sensitive claims would need its confidentiality lifetime assessed separately.',
    hndlImplication:
      'Sample threshold year: 2034 − 0.5 ≈ 2034 (the claims need confidentiality for under a year). Replay value ends at expiry, but the confidentiality of the claims depends on the key-establishment mode of any recorded session. With a short confidentiality need, the HNDL concern is low.',
    commonMistake:
      'Classifying as Medium because tokens carry authentication claims. The deciding facts are a short confidentiality need, low-sensitivity claims and no storage; token expiry alone does not end the confidentiality need for what was transmitted.',
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
      'Root CA keys are irreplaceable cryptographic anchors. If compromised, all certificates in the trust chain must be revoked and reissued. The quantum risk is future forgery over the period the root public key stays trusted: with a 25-year expected lifetime, a CRQC that can derive the private key from the public key could sign certificates that verifiers still accept. That is a signature-forgery risk, not harvest-now-decrypt-later; recording a key ceremony does not give an adversary a secret to decrypt later. A backup of the key, or a ceremony exchange that wraps the key under a quantum-vulnerable algorithm, would be assessed separately, and only once the scenario states which secret crosses which cryptographic boundary. If this PKI served National Security Systems, NSA expects the transition to QR algorithms to be complete by 2035, in line with NSM-10.',
    hndlImplication:
      'Not a harvest-now-decrypt-later case: the exposure is signature forgery for as long as the root is trusted. A 25-year root created now stays trusted until about 2051, past the assumed 2034 CRQC year, so its algorithm must still be sound then or the root must be replaced before that.',
    commonMistake:
      'Classifying as High because it is "already in an HSM." HSM protection guards against theft of the key, not against a future computer that derives the private key from the public key; the 25-year trust period and the impact of forgery drive the Critical tier.',
    relevantFrameworks: ['CNSA-2.0', 'FIPS-140-3', 'NIST-SP-800-57'],
  },
  {
    id: 'cls-04',
    title: 'Internal Engineering Slack Messages',
    description:
      'Day-to-day text messages in a company-internal Slack workspace between software engineering team members. Messages cover sprint planning, code reviews, and deployment discussions. Retention is set to 90 days.',
    context:
      'Technology sector; SaaS platform; no PII, trade secrets, or classified information in scope.',
    correctTier: 'medium',
    explanation:
      'Internal communications between employees with no PII, trade secrets, or regulated data fall in the Medium tier. They are not public (some breach consequence exists if leaked). The 90-day setting is a storage retention period: it limits how long the organization keeps the messages, not how long a copy an adversary recorded stays readable or how long the content stays useful. In this sample the content has a short useful life, so the HNDL concern is low. The primary risk is operational confidentiality, not regulatory exposure.',
    hndlImplication:
      'Storage retention is under 1 year, so the sample threshold year is about 2034. Deleting messages from the platform does not remove copies recorded elsewhere; the HNDL concern is low only because the content stops being sensitive within a short time.',
    commonMistake:
      'Classifying as Low because "it is just chat." Internal communications can reveal system architecture, vulnerabilities, and credentials if captured — Medium is appropriate.',
    relevantFrameworks: [],
  },
  {
    id: 'cls-05',
    title: 'Credit Card Transaction Records',
    description:
      'Encrypted records of credit card transactions including masked PAN (last 4 digits), transaction amount, merchant, and timestamp. CVV is never stored post-authorization. Records are retained for 7 years in this sample, a business and legal-hold assumption chosen for the exercise (PCI DSS sets no retention period).',
    context:
      'Retail/E-commerce sector; merchant in scope for PCI DSS; stored in a tokenized database with AES-256 encryption.',
    correctTier: 'high',
    explanation:
      'Payment records fall under PCI DSS, which does not set a retention period: Requirement 3.2.1 requires a retention and disposal policy that limits storage to what is necessary for legal, regulatory and business purposes, and sensitive authentication data such as the card verification code must not be stored after authorization (Requirement 3.3.1). The 7 years here is a sample business assumption, not a PCI DSS figure. While CVV is not stored and PAN is masked, the combination of transaction history, timing, and merchant data can still be used for fraud or identity inference. With this sample horizon the threshold year is about 2027 — moderate urgency.',
    hndlImplication:
      'Sample threshold year: 2034 − 7 = 2027. Records captured in or after 2027 and kept for 7 years would still be held at the assumed CRQC year; records captured today (2026) would be deleted in 2033, before it. Exposure also depends on whether any copy was recorded under quantum-vulnerable protection.',
    commonMistake:
      'Classifying as Critical because "financial data." No full PAN or CVV stored reduces impact. The sample 7-year horizon lands this at High; the tier is this module\'s policy, not a PCI DSS classification.',
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
      'Classified national security data with indefinite retention is the canonical Critical case. If this traffic is recorded and its keys were established with a quantum-vulnerable algorithm (the context lists RSA-4096), it could be decrypted once a CRQC exists. Operational intelligence from decades ago can still compromise ongoing missions, personnel, and national security. NSA anticipates that NSS will finish moving to QR algorithms by 2035, consistent with NSM-10, and it calls on vendors as well as NSS owners and operators to spare no effort in meeting that target.',
    hndlImplication:
      'With an indefinite confidentiality need there is no threshold year: any recorded traffic protected only by quantum-vulnerable key establishment becomes readable once a CRQC exists. The scenario does not say what has been recorded.',
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
      'Anonymous aggregate recommendation data with no PII has minimal sensitivity. The scenario states that no regulated data is involved, and there is no individual harm if it is exposed. The 30-day cache expiry is a storage setting, not a measure of how long the values stay confidential; the HNDL concern is low because the content has little value even if a recorded copy is decrypted later. Public products with public pricing need no special protection.',
    hndlImplication:
      'Storage retention is under 1 year, so the sample threshold year is about 2034. Replacing cache entries does not remove copies recorded elsewhere; the concern is low because the content is non-identifying and of little value.',
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
      'Biometric templates are irreplaceable — unlike passwords, you cannot issue new fingerprints. A template stays tied to the person even after the employment record ends, so the confidentiality need can outlast the sample retention period of tenure + 5 years. Compromise enables permanent impersonation. Where GDPR applies, Art. 9(1) lists biometric data processed to uniquely identify a person as a special category, and processing is prohibited unless an Art. 9(2) condition applies.',
    hndlImplication:
      'Sample threshold year: 2034 − 20 = 2014, already past, so templates captured now would still need confidentiality when a CRQC arrives. That is a calculation on sample inputs; the scenario says the templates are held in an HSM and describes no transmission, so it does not show that any template has been recorded.',
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
      'The certificate key authenticates the server; it does not encrypt the traffic. A 90-day certificate with a fresh key on each renewal limits how long a key that a CRQC could derive from its public key would stay useful for impersonation. Confidentiality of recorded sessions is a separate question that depends on the key-establishment mode: ECDHE gives forward secrecy against later theft of the certificate key, but ECDHE is itself quantum-vulnerable, so recorded handshakes could be decrypted by a CRQC unless key establishment is hybrid or post-quantum. The certificate does identify the service, and the private key controls session establishment — enough to warrant Medium rather than Low.',
    hndlImplication:
      'Rotating the key every 90 days shortens the exposure of the certificate key to forgery. It says nothing about recorded sessions: their confidentiality depends on the key-establishment mode and on how long the transmitted data must stay secret.',
    commonMistake:
      'Classifying as High because "it protects all API traffic." The certificate authenticates the server and is publicly distributed; traffic confidentiality depends on the key-establishment mode, not on the certificate lifetime.',
    relevantFrameworks: ['NIST-IR-8547', 'CA-B-Forum'],
  },
  {
    id: 'cls-10',
    title: 'Employee Payroll Records',
    description:
      'Payroll records including full legal name, national ID (SSN/SIN), bank account numbers, salary history, and tax withholding data for all employees. Records are retained for 7 years in this sample, a planning horizon chosen for the exercise (actual periods vary by jurisdiction).',
    context:
      'Any industry; HR system; encrypted with AES-256 at rest; accessible to HR, payroll service, and auditors.',
    correctTier: 'high',
    explanation:
      'Payroll records include SSNs and bank account numbers — two of the most impactful categories in identity theft. With the 7-year sample horizon the threshold year is about 2027. Regulatory exposure could include GDPR (if its territorial scope is met, for example through an establishment in the EU), US state privacy laws, and employment regulations; which of them apply depends on facts the scenario does not state. This is squarely High.',
    hndlImplication:
      'Sample threshold year: 2034 − 7 = 2027. Records created in or after 2027 would still be held at the assumed CRQC year; records created today (2026) would be deleted in 2033, before it.',
    commonMistake:
      'Classifying as Critical because it contains SSNs. While SSNs are highly sensitive, payroll records are bounded by employment tenure and the sample 7-year horizon — enough for High but not the indefinite/irreplaceable threshold of Critical.',
    relevantFrameworks: ['GDPR', 'CCPA', 'NIST-SP-800-122'],
  },
]

// ── Conflict Resolver Data ────────────────────────────────────────────────────

export type ConflictResolutionRule =
  'most-restrictive' | 'jurisdiction-priority' | 'data-subject-location' | 'asset-type-override'

/**
 * One row of a conflict-scenario table. The row keeps two things apart:
 * - `frameworkSays` is the only field that describes the law or standard. It holds
 *   wording about the cited text, or a neutral pointer to the document when the
 *   module does not summarize it.
 * - `moduleTier` and `tierRationale` belong to this module's own teaching scale
 *   (Low, Medium, High, Critical). None of the listed laws or standards defines
 *   those four tiers, so neither field is the law's position.
 */
export interface ConflictingRequirement {
  framework: string
  /** What the cited law or standard says. Never this module's tiering. */
  frameworkSays: string
  /** The tier on this module's teaching scale, not a tier set by the framework. */
  moduleTier: SensitivityTier
  /** Why this module assigns `moduleTier`, written as the module's own reasoning. */
  tierRationale: string
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
      'A US hospital stores EHR data for US patients and for patients in the EU, whom it serves through a telehealth service offered to people in the EU. The hospital is assumed to be a HIPAA covered entity. Sample fact for this exercise: it is not established in the EU but offers its services to people who are in the EU, so GDPR Art. 3(2)(a) is met for that processing. Without such an offering, or for EU residents who are only in the US, that trigger would not be met.',
    conflictingRequirements: [
      {
        framework: 'HIPAA / HITECH',
        frameworkSays:
          "ePHI requires Security Rule safeguards; HIPAA's 6-year rule covers required compliance documentation, not patient records, and no cryptographic standard is prescribed.",
        moduleTier: 'high',
        tierRationale:
          "High in this module's sample policy because the asset is patient health data (ePHI). HIPAA does not define the four tiers.",
      },
      {
        framework: 'GDPR Art. 9',
        frameworkSays:
          'Health data is a "special category" (Art. 9(1)): processing is prohibited unless a condition in Art. 9(2) applies, such as explicit consent (9(2)(a)) or the provision of health care (9(2)(h), with the Art. 9(3) conditions), and an Art. 6 lawful basis is also needed. Art. 32 separately requires security appropriate to the risk, "taking into account the state of the art", and names the encryption of personal data as an example.',
        moduleTier: 'high',
        tierRationale:
          "High in this module's sample policy: health data is a special category (Art. 9(1)) and Art. 32 calls for security appropriate to the risk. GDPR does not define the four tiers.",
      },
      {
        framework: 'NIST SP 800-66',
        frameworkSays:
          'This document does not define the four sensitivity tiers. Check NIST SP 800-66 for the requirements that apply to the system.',
        moduleTier: 'high',
        tierRationale:
          "This module's assessment: ePHI warrants NIST security category 3 or higher parameter sets, so its sample policy assigns High.",
      },
    ],
    resolutionRule: 'most-restrictive',
    correctTier: 'high',
    governingFramework: 'GDPR + HIPAA (equal; GDPR adds data subject rights)',
    explanation:
      "Both HIPAA and GDPR land this at High in this module's sample policy, so the resolution rule is not about escalating the tier. They differ in operational duties. For health data, GDPR needs an Art. 6 lawful basis and a separate Art. 9(2) condition for each stated purpose, and it adds purpose-limitation (Art. 5(1)(b)), transparency and data-subject-rights duties. Consent is one possible basis and condition, not a requirement for every use: identify the purpose first, then the basis and condition that fit it (for example Art. 9(2)(h) for the provision of health care, subject to Art. 9(3)). Rights such as erasure and portability apply with conditions and exceptions (Art. 17(3), Art. 20(1)). When frameworks agree on tier but differ on operational requirements, the sample policy applies the most restrictive operational requirement from each, after checking that each framework applies. This is a teaching summary, not legal advice.",
    pqcImplication:
      'ML-KEM-768 (FIPS 203) for key encapsulation and ML-DSA-65 (FIPS 204) for signatures are the NIST security category 3 parameter sets. That they fit HIPAA, GDPR "state of the art" and NIST SP 800-66 guidance is this module\'s assessment, not a determination by those frameworks.',
  },
  {
    id: 'con-02',
    title: 'EU Payment Gateway — Transaction Processing System',
    assetDescription:
      'A payment gateway operating in the EU processes credit card transactions and is classified as a critical ICT service under DORA. The same system handles cardholder data subject to PCI DSS v4.0.',
    conflictingRequirements: [
      {
        framework: 'PCI DSS v4.0',
        frameworkSays:
          'Requirement 3 covers stored account data: a retention and disposal policy (3.2.1), no storage of sensitive authentication data after authorization (3.3.1), and protection of stored data (3.5 to 3.7).',
        moduleTier: 'high',
        tierRationale:
          "High is this module's sample policy tier for stored cardholder data. PCI DSS does not define the four tiers.",
      },
      {
        framework: 'DORA (EU)',
        frameworkSays:
          'ICT systems supporting critical or important functions call for security policies, procedures and tools that aim to keep them resilient, continuous and available.',
        moduleTier: 'critical',
        tierRationale:
          "Critical in this module's reading: the whole gateway is treated as a critical ICT service, not just the cardholder data. DORA does not define the four tiers.",
      },
    ],
    resolutionRule: 'jurisdiction-priority',
    correctTier: 'critical',
    governingFramework: 'DORA (EU)',
    explanation:
      "In this module's reading, the whole payment gateway, not just the cardholder data, is Critical. DORA provides for the designation of third-party ICT providers critical to financial entities after an assessment that takes the specified criteria into account.",
    pqcImplication:
      'ML-KEM-1024 (FIPS 203) and ML-DSA-87 (FIPS 204) are NIST security category 5 parameter sets. This module recommends them for critical ICT services under DORA; we found no parameter set named in the DORA text. Hybrid with X25519+ML-KEM-1024 for transition.',
  },
  {
    id: 'con-03',
    title: 'Defense Contractor Root CA Key',
    assetDescription:
      'A US defense contractor operates a private PKI. The root CA private key is used to sign certificates for classified systems. It is stored in an HSM and subject to both FedRAMP authorization requirements and CMVP FIPS 140-3 validation.',
    conflictingRequirements: [
      {
        framework: 'FedRAMP High',
        frameworkSays:
          'FedRAMP does not define the four sensitivity tiers. Check the FedRAMP baseline that applies to the system for its actual control requirements.',
        moduleTier: 'high',
        tierRationale: 'Module assumption (not drawn from FedRAMP documents): High.',
      },
      {
        framework: 'CMVP / FIPS 140-3',
        frameworkSays:
          'FIPS 140-3 applies to cryptographic modules protecting sensitive but unclassified information; classified systems use modules approved for classified use.',
        moduleTier: 'critical',
        tierRationale:
          "Critical is this module's own tier for a root CA key, not a FIPS 140-3 requirement.",
      },
      {
        framework: 'CNSA 2.0',
        frameworkSays:
          "NSA's CNSA 2.0 FAQ (v2.2, October 2026) quotes CNSSP 15 as requiring CNSA 2.0 algorithms in all new NSS acquisitions by 1 January 2027 and says CNSA 2.0 algorithms are mandated for use by 31 December 2031, unless otherwise noted.",
        moduleTier: 'critical',
        tierRationale:
          "Critical is this module's sample tier for a root CA key that signs for classified systems. The CNSA 2.0 dates concern algorithms, and CNSA 2.0 does not define the four tiers.",
      },
    ],
    resolutionRule: 'asset-type-override',
    correctTier: 'critical',
    governingFramework: 'CNSA 2.0 + FIPS 140-3 validation',
    explanation:
      "Key material (cryptographic keys) always escalates to the highest applicable tier. The asset-type-override rule recognizes that root CA keys are the trust anchor for all downstream certificates — their compromise is catastrophic and irreversible. Even if the data the PKI protects is only High sensitivity, the key material itself must be classified Critical. This module's sample policy does not use the FedRAMP High baseline to set the tier of the key itself.",
    pqcImplication:
      'ML-DSA-87 (FIPS 204) for root CA signing: the CNSA 2.0 FAQ (v2.2) approves validated ML-DSA for all signing use cases, and SLH-DSA (FIPS 205) is not part of CNSA, so it does not fit a root that signs for classified systems. ML-KEM-1024 for key transport ceremonies.',
  },
  {
    id: 'con-04',
    title: 'Open-Source Firmware Signing Key (Supply Chain)',
    assetDescription:
      'A technology company produces open-source firmware for network equipment. The code-signing key is used to sign publicly released firmware images. Sample fact for this exercise: US federal suppliers have started deploying this firmware in National Security Systems.',
    conflictingRequirements: [
      {
        framework: 'NIST SP 800-218 (SSDF)',
        frameworkSays:
          'SP 800-218 is a set of secure software development practices. Check it for what it says about protecting signing keys and release integrity.',
        moduleTier: 'medium',
        tierRationale:
          'Module assumption (not drawn from SP 800-218): Medium for signing public open-source releases.',
      },
      {
        framework: 'CNSA 2.0 (Supply Chain)',
        frameworkSays:
          "When firmware is used in National Security Systems (NSS), signing keys fall under CNSA 2.0, and NSA's CNSA 2.0 advisory (September 2022) anticipates that software and firmware signing will exclusively use CNSA 2.0 by 2030. NSA's October 2026 FAQ (v2.2) gives general dates only (new acquisitions from 1 January 2027, unsupported equipment phased out by 31 December 2030, CNSA 2.0 mandated by 31 December 2031) and says specific deadlines depend on equipment type, so check the current schedule for the equipment class.",
        moduleTier: 'high',
        tierRationale:
          'This module classes this key High because, in this scenario, the firmware is used in National Security Systems. CNSA 2.0 does not define the four tiers.',
      },
    ],
    resolutionRule: 'most-restrictive',
    correctTier: 'high',
    governingFramework: 'CNSA 2.0',
    explanation:
      'The most-restrictive-wins rule applies: This module classes this key High because, in this scenario, the firmware is used in National Security Systems, where CNSA 2.0 applies. Even though the firmware is open-source and the key is "only" signing public releases, the downstream impact on national security systems elevates the classification. A compromised signing key could inject malicious firmware into critical infrastructure.',
    pqcImplication:
      'ML-DSA-87 (FIPS 204) for code signing — CNSA 2.0 specifies ML-DSA-87 for all classification levels, so ML-DSA-65 does not meet it. Hybrid with ECDSA P-384 if a classical signature is kept during transition (NSA does not require hybrid).',
  },
  {
    id: 'con-05',
    title: 'IoT Device with Embedded TLS Private Key',
    assetDescription:
      "A smart energy meter contains an embedded TLS private key provisioned at manufacturing time and used for secure communications with the utility's backend. The device data transmitted (energy readings) is not sensitive, but the key itself is embedded for the device's lifetime (10–15 years).",
    conflictingRequirements: [
      {
        framework: 'ETSI EN 303 645',
        frameworkSays:
          'This standard does not define the four sensitivity tiers. Check ETSI EN 303 645 and the applicable IoT rules for what they actually require.',
        moduleTier: 'low',
        tierRationale:
          'Module assumption (not drawn from ETSI EN 303 645): Low, because the energy readings themselves are not sensitive.',
      },
      {
        framework: 'FIPS 140-3 (Key Material)',
        frameworkSays:
          'FIPS 140-3 sets requirements for cryptographic modules; it does not define the four sensitivity tiers.',
        moduleTier: 'high',
        tierRationale:
          'Module assumption, not a FIPS 140-3 rule: High, because a key embedded for 10 to 15 years stays in service past the assumed CRQC year and cannot easily be rotated.',
      },
      {
        framework: 'NIST SP 800-82 (ICS/OT)',
        frameworkSays:
          'This document does not define the four sensitivity tiers. Check SP 800-82 for its actual guidance.',
        moduleTier: 'high',
        tierRationale:
          'Module assumption (not drawn from SP 800-82): High for authentication keys in critical-infrastructure devices.',
      },
    ],
    resolutionRule: 'asset-type-override',
    correctTier: 'high',
    governingFramework: 'FIPS 140-3 + NIST SP 800-82',
    explanation:
      'The asset-type-override rule elevates key material above the data it protects. The energy readings are Low, but the embedded private key is High because: (1) it is key material, (2) it has a 10–15 year lifetime extending past CRQC arrival, and (3) it cannot be rotated without physical device access. The classification of the key is independent of the sensitivity of the data it encrypts.',
    pqcImplication:
      'ML-KEM-512 (FIPS 203) for key exchange — minimum PQC for device-constrained environments. Consider hardware support requirements (memory, code size and the update path) before specifying.',
  },
  {
    id: 'con-06',
    title: 'Global AI Training Dataset with PII',
    assetDescription:
      'A technology company trains an AI model on a dataset containing user-generated content that includes names, email addresses, and behavioral patterns from users in the EU (GDPR), California (CCPA), and Brazil (LGPD). The same dataset is used across all jurisdictions. Sample facts for this exercise: the company offers its service to people in the EU and Brazil and meets the scope tests of each law; for GDPR the trigger is Art. 3(2), offering services to, or monitoring the behaviour of, people who are in the EU.',
    conflictingRequirements: [
      {
        framework: 'GDPR (EU)',
        frameworkSays:
          'Personal data including behavioral profiling requires lawful basis, data minimization, and security measures appropriate to the risk, which can include encryption. Violations of the basic processing principles and conditions for consent (Articles 5, 6, 7, and 9) can carry fines up to 20 000 000 EUR or, for an undertaking, up to 4% of total worldwide annual turnover of the preceding financial year, whichever is higher.',
        moduleTier: 'high',
        tierRationale:
          "High in this module's sample policy for personal data that includes behavioral profiling, once the stated GDPR scope facts are met. GDPR does not define the four tiers.",
      },
      {
        framework: 'CCPA / CPRA (California)',
        frameworkSays:
          'CCPA/CPRA applies only to businesses that meet its definitions and gives consumers specific rights. Check the statute and its regulations for applicability and for what reasonable security requires.',
        moduleTier: 'medium',
        tierRationale: 'Module assumption: Medium. CCPA/CPRA does not define the four tiers.',
      },
      {
        framework: 'LGPD (Brazil)',
        frameworkSays:
          "This law does not define the four sensitivity tiers. Check LGPD's own scope rules and security provisions rather than assuming they mirror GDPR.",
        moduleTier: 'high',
        tierRationale:
          "Module assumption: High, once the scenario's stated LGPD scope facts are met.",
      },
    ],
    resolutionRule: 'data-subject-location',
    correctTier: 'high',
    governingFramework: 'GDPR + LGPD (most restrictive applicable laws)',
    explanation:
      "The data-subject-location rule is a sample-policy rule: where a law's territorial scope turns on where the data subject is, check that law's scope facts for each group of data subjects. In this scenario the scope facts are stated (for GDPR, Art. 3(2): offering services to people in the EU), so GDPR and LGPD are treated as applying, and the sample policy assigns High to both. The CCPA row is Medium but does not lower the tier for the EU and Brazilian data in the same dataset. Because one dataset serves all groups, the sample policy applies the High standard to the whole dataset instead of splitting it. Without such scope facts, location alone would not settle which law applies.",
    pqcImplication:
      'ML-KEM-768 (FIPS 203) + ML-DSA-65 (FIPS 204) are NIST security category 3 parameter sets; this module assesses them as fitting the GDPR and LGPD "state of the art" wording, which is not a determination by those laws. Encryption at rest and in transit must cover all copies of the training dataset.',
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

  const pqcRecommendation = getPqcRecommendation(
    asset.sensitivityTier,
    asset.assetType,
    asset.complianceFlags
  )
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
