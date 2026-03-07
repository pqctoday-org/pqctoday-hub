// SPDX-License-Identifier: GPL-3.0-only

export type SupportStatus = 'supported' | 'experimental' | 'planned' | 'unavailable'

export interface PQCSupportCell {
  apiId: string
  algorithmId: string
  status: SupportStatus
  version: string
  notes: string
  codeSnippet?: string
}

export interface RoadmapEvent {
  apiId: string
  date: string
  event: string
  algorithms: string[]
}

export const PQC_ALGORITHMS = [
  { id: 'ml-kem', label: 'ML-KEM', family: 'KEM', fips: 'FIPS 203' },
  { id: 'ml-dsa', label: 'ML-DSA', family: 'Signature', fips: 'FIPS 204' },
  { id: 'slh-dsa', label: 'SLH-DSA', family: 'Signature', fips: 'FIPS 205' },
  { id: 'fn-dsa', label: 'FN-DSA (Falcon)', family: 'Signature', fips: 'Draft' },
  { id: 'lms-xmss', label: 'LMS/XMSS', family: 'Hash-based Sig', fips: 'SP 800-208' },
  { id: 'hqc', label: 'HQC', family: 'KEM', fips: 'Round 4' },
  { id: 'mceliece', label: 'Classic McEliece', family: 'KEM', fips: 'Round 4' },
] as const

export const SUPPORT_STATUS_COLORS: Record<SupportStatus, string> = {
  supported: 'bg-status-success/20 text-status-success border-status-success/50',
  experimental: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  planned: 'bg-status-info/20 text-status-info border-status-info/50',
  unavailable: 'bg-muted/50 text-muted-foreground border-border',
}

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  supported: 'Supported',
  experimental: 'Experimental',
  planned: 'Planned',
  unavailable: 'N/A',
}

export const PQC_SUPPORT_MATRIX: PQCSupportCell[] = [
  // JCA/JCE (via Bouncy Castle provider)
  {
    apiId: 'jca-jce',
    algorithmId: 'ml-kem',
    status: 'supported',
    version: 'BC 1.78+',
    notes: 'Via Bouncy Castle JCA provider',
    codeSnippet: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-KEM-768", "BC");',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'ml-dsa',
    status: 'supported',
    version: 'BC 1.78+',
    notes: 'Via Bouncy Castle JCA provider',
    codeSnippet: 'Signature sig = Signature.getInstance("ML-DSA-65", "BC");',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'slh-dsa',
    status: 'supported',
    version: 'BC 1.78+',
    notes: 'All 12 parameter sets via BC',
    codeSnippet: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("SLH-DSA-SHA2-128s", "BC");',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'fn-dsa',
    status: 'supported',
    version: 'BC 1.77+',
    notes: 'FN-DSA-512/1024 via BC',
    codeSnippet: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("FN-DSA-512", "BC");',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'lms-xmss',
    status: 'supported',
    version: 'BC 1.68+',
    notes: 'Stateful signatures — requires state management',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'hqc',
    status: 'supported',
    version: 'BC 1.78+',
    notes: 'Via Bouncy Castle',
  },
  {
    apiId: 'jca-jce',
    algorithmId: 'mceliece',
    status: 'supported',
    version: 'BC 1.72+',
    notes: 'Via Bouncy Castle',
  },

  // OpenSSL
  {
    apiId: 'openssl',
    algorithmId: 'ml-kem',
    status: 'supported',
    version: '3.5+ oqsprovider',
    notes: 'Via oqsprovider (liboqs)',
    codeSnippet:
      'EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-KEM-768", "provider=oqsprovider");',
  },
  {
    apiId: 'openssl',
    algorithmId: 'ml-dsa',
    status: 'supported',
    version: '3.5+ oqsprovider',
    notes: 'Via oqsprovider (liboqs)',
    codeSnippet:
      'EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", "provider=oqsprovider");',
  },
  {
    apiId: 'openssl',
    algorithmId: 'slh-dsa',
    status: 'supported',
    version: '3.5+ oqsprovider',
    notes: 'Via oqsprovider',
  },
  {
    apiId: 'openssl',
    algorithmId: 'fn-dsa',
    status: 'supported',
    version: '3.5+ oqsprovider',
    notes: 'Via oqsprovider',
  },
  {
    apiId: 'openssl',
    algorithmId: 'lms-xmss',
    status: 'unavailable',
    version: '-',
    notes: 'Not in oqsprovider; use standalone implementations',
  },
  {
    apiId: 'openssl',
    algorithmId: 'hqc',
    status: 'supported',
    version: '3.5+ oqsprovider',
    notes: 'Via oqsprovider',
  },
  {
    apiId: 'openssl',
    algorithmId: 'mceliece',
    status: 'supported',
    version: '3.5+ oqsprovider',
    notes: 'Via oqsprovider — very large keys',
  },

  // PKCS#11
  {
    apiId: 'pkcs11',
    algorithmId: 'ml-kem',
    status: 'supported',
    version: 'v3.2',
    notes: 'CKM_ML_KEM_KEY_PAIR_GEN, C_EncapsulateKey/C_DecapsulateKey',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'ml-dsa',
    status: 'supported',
    version: 'v3.2',
    notes: 'CKM_ML_DSA, CKM_HASH_ML_DSA_*',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'slh-dsa',
    status: 'supported',
    version: 'v3.2',
    notes: 'CKM_SLH_DSA, CKM_HASH_SLH_DSA_*, all 12 parameter sets',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'fn-dsa',
    status: 'planned',
    version: 'v3.3+',
    notes: 'Not yet in PKCS#11 standard — expected in future revision',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'lms-xmss',
    status: 'supported',
    version: 'v3.1',
    notes: 'CKM_HSS_KEY_PAIR_GEN — stateful, requires state object',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'hqc',
    status: 'planned',
    version: 'v3.3+',
    notes: 'Awaiting NIST standardization',
  },
  {
    apiId: 'pkcs11',
    algorithmId: 'mceliece',
    status: 'unavailable',
    version: '-',
    notes: 'Key sizes too large for most HSM tokens',
  },

  // KSP / CNG
  {
    apiId: 'ksp-cng',
    algorithmId: 'ml-kem',
    status: 'planned',
    version: 'TBD',
    notes: 'Microsoft has announced PQC roadmap — no public timeline',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'ml-dsa',
    status: 'planned',
    version: 'TBD',
    notes: 'SymCrypt has experimental ML-DSA',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'slh-dsa',
    status: 'planned',
    version: 'TBD',
    notes: 'Expected in future Windows update',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'fn-dsa',
    status: 'unavailable',
    version: '-',
    notes: 'No announced plans',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'lms-xmss',
    status: 'unavailable',
    version: '-',
    notes: 'No announced plans',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'hqc',
    status: 'unavailable',
    version: '-',
    notes: 'No announced plans',
  },
  {
    apiId: 'ksp-cng',
    algorithmId: 'mceliece',
    status: 'unavailable',
    version: '-',
    notes: 'No announced plans',
  },

  // Bouncy Castle
  {
    apiId: 'bouncy-castle',
    algorithmId: 'ml-kem',
    status: 'supported',
    version: '1.78+',
    notes: 'ML-KEM-512/768/1024',
    codeSnippet:
      'MLKEMKeyPairGenerator gen = new MLKEMKeyPairGenerator();\ngen.init(new MLKEMKeyGenerationParameters(random, MLKEMParameters.ml_kem_768));',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'ml-dsa',
    status: 'supported',
    version: '1.78+',
    notes: 'ML-DSA-44/65/87',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'slh-dsa',
    status: 'supported',
    version: '1.78+',
    notes: 'All 12 SLH-DSA parameter sets',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'fn-dsa',
    status: 'supported',
    version: '1.77+',
    notes: 'FN-DSA-512/1024 (Falcon)',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'lms-xmss',
    status: 'supported',
    version: '1.68+',
    notes: 'Full LMS/HSS and XMSS/XMSS^MT',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'hqc',
    status: 'supported',
    version: '1.78+',
    notes: 'HQC-128/192/256',
  },
  {
    apiId: 'bouncy-castle',
    algorithmId: 'mceliece',
    status: 'supported',
    version: '1.72+',
    notes: 'Classic McEliece — all parameter sets',
  },

  // JCProv (Thales)
  {
    apiId: 'jcprov',
    algorithmId: 'ml-kem',
    status: 'supported',
    version: 'Luna 7.x FW',
    notes: 'Depends on HSM firmware version',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'ml-dsa',
    status: 'supported',
    version: 'Luna 7.x FW',
    notes: 'Depends on HSM firmware version',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'slh-dsa',
    status: 'experimental',
    version: 'Luna 8.x FW',
    notes: 'Firmware update required',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'fn-dsa',
    status: 'unavailable',
    version: '-',
    notes: 'Not yet supported in Luna firmware',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'lms-xmss',
    status: 'supported',
    version: 'Luna 7.x FW',
    notes: 'Stateful — HSM manages state counter',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'hqc',
    status: 'unavailable',
    version: '-',
    notes: 'Not in Luna firmware',
  },
  {
    apiId: 'jcprov',
    algorithmId: 'mceliece',
    status: 'unavailable',
    version: '-',
    notes: 'Key sizes exceed HSM capacity',
  },
]

export const ROADMAP_EVENTS: RoadmapEvent[] = [
  {
    apiId: 'bouncy-castle',
    date: '2022-Q3',
    event: 'CRYSTALS-Kyber/Dilithium support added',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
  {
    apiId: 'openssl',
    date: '2023-Q1',
    event: 'oqsprovider 0.5 for OpenSSL 3.x',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'bouncy-castle',
    date: '2024-Q2',
    event: 'Updated to FIPS 203/204/205 final names',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'pkcs11',
    date: '2024-Q3',
    event: 'PKCS#11 v3.2 published with PQC mechanisms',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa'],
  },
  {
    apiId: 'openssl',
    date: '2025-Q1',
    event: 'oqsprovider 1.0 stable release',
    algorithms: ['ml-kem', 'ml-dsa', 'slh-dsa', 'fn-dsa'],
  },
  {
    apiId: 'ksp-cng',
    date: '2025-Q2',
    event: 'SymCrypt experimental ML-KEM',
    algorithms: ['ml-kem'],
  },
  {
    apiId: 'ksp-cng',
    date: '2026-H2',
    event: 'Windows CNG PQC (projected)',
    algorithms: ['ml-kem', 'ml-dsa'],
  },
]

export const ALGORITHM_FAMILY_FILTER_OPTIONS = [
  { id: 'All', label: 'All Families' },
  { id: 'KEM', label: 'KEM' },
  { id: 'Signature', label: 'Signature' },
  { id: 'Hash-based Sig', label: 'Hash-based Sig' },
]

export const READINESS_FILTER_OPTIONS = [
  { id: 'All', label: 'All Status' },
  { id: 'supported', label: 'Supported' },
  { id: 'experimental', label: 'Experimental' },
  { id: 'planned', label: 'Planned' },
]
