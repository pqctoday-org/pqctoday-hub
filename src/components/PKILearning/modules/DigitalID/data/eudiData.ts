// SPDX-License-Identifier: GPL-3.0-only

// ── Types ────────────────────────────────────────────────────────────────────

export type PqcMigrationPhase = 'phase1-roadmap' | 'phase2-high-risk' | 'phase3-full'

export type TrustLevel = 'low' | 'substantial' | 'high'

export type CredentialFormat = 'mso_mdoc' | 'sd-jwt-vc' | 'both'

// ── EU Member State PID Issuer Status ────────────────────────────────────────

export interface EuMemberState {
  code: string
  name: string
  pidIssuerStatus: 'pilot' | 'large-scale-pilot' | 'in-development' | 'planned'
  largescalePilot: string | null
  pidFormat: CredentialFormat
  pqcMigrationPhase: PqcMigrationPhase
  notes: string
}

export const EU_MEMBER_STATES: EuMemberState[] = [
  {
    code: 'DE',
    name: 'Germany',
    pidIssuerStatus: 'large-scale-pilot',
    largescalePilot: 'POTENTIAL',
    pidFormat: 'mso_mdoc',
    pqcMigrationPhase: 'phase2-high-risk',
    notes: 'BSI TR-02102 mandates hybrid PQC for critical identity infrastructure by 2026',
  },
  {
    code: 'ES',
    name: 'Spain',
    pidIssuerStatus: 'large-scale-pilot',
    largescalePilot: 'DC4EU',
    pidFormat: 'both',
    pqcMigrationPhase: 'phase1-roadmap',
    notes: 'DC4EU pilot covers education diplomas (SD-JWT VC) and government ID (mso_mdoc)',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    pidIssuerStatus: 'large-scale-pilot',
    largescalePilot: 'EWC',
    pidFormat: 'mso_mdoc',
    pqcMigrationPhase: 'phase1-roadmap',
    notes: 'EWC pilot focuses on travel and cross-border identification',
  },
  {
    code: 'NO',
    name: 'Norway',
    pidIssuerStatus: 'large-scale-pilot',
    largescalePilot: 'NOBID',
    pidFormat: 'sd-jwt-vc',
    pqcMigrationPhase: 'phase1-roadmap',
    notes:
      'NOBID covers banking and telecom use cases; EEA member (not EU) participating in pilots',
  },
  {
    code: 'FR',
    name: 'France',
    pidIssuerStatus: 'in-development',
    largescalePilot: null,
    pidFormat: 'both',
    pqcMigrationPhase: 'phase1-roadmap',
    notes: 'ANSSI recommends hybrid PQC schemes; France Identity app being extended for eIDAS 2.0',
  },
  {
    code: 'IT',
    name: 'Italy',
    pidIssuerStatus: 'in-development',
    largescalePilot: null,
    pidFormat: 'mso_mdoc',
    pqcMigrationPhase: 'phase1-roadmap',
    notes: 'IT-Wallet programme extending CIE (Carta di Identità Elettronica) to EUDI compliance',
  },
]

// ── QTSP Registry ─────────────────────────────────────────────────────────────

export interface Qtsp {
  id: string
  name: string
  country: string
  services: string[]
  signatureAlgorithm: string
  pqcRoadmap: 'announced' | 'in-progress' | 'none-public'
  scal: 'SCAL1' | 'SCAL2' | 'both'
  etsiAudit: string
  notes: string
}

export const QTSP_REGISTRY: Qtsp[] = [
  {
    id: 'digicert-eu',
    name: 'DigiCert (EU)',
    country: 'LU',
    services: ['QES', 'QEAA', 'eSignature'],
    signatureAlgorithm: 'ECDSA P-256 / RSA-PSS-2048',
    pqcRoadmap: 'announced',
    scal: 'both',
    etsiAudit: 'ETSI EN 319 411-1 NCP+',
    notes: 'Part of X9 Financial PKI initiative; ML-DSA roadmap announced for 2027',
  },
  {
    id: 'd-trust',
    name: 'D-Trust (Bundesdruckerei)',
    country: 'DE',
    services: ['QES', 'QEAA'],
    signatureAlgorithm: 'ECDSA P-256',
    pqcRoadmap: 'in-progress',
    scal: 'SCAL2',
    etsiAudit: 'ETSI EN 319 411-2 QCP-l-qscd',
    notes: 'BSI-certified HSM for SCAL2; actively testing ML-DSA-65 for QES signing keys',
  },
  {
    id: 'infocert',
    name: 'InfoCert (Italy)',
    country: 'IT',
    services: ['QES', 'eSignature', 'timestamp'],
    signatureAlgorithm: 'RSA-PSS-2048',
    pqcRoadmap: 'none-public',
    scal: 'both',
    etsiAudit: 'ETSI EN 319 411-1 NCP',
    notes: 'Italy National Trusted List entry; QES used for Italian government forms',
  },
  {
    id: 'asseco-ds',
    name: 'Asseco Data Systems',
    country: 'PL',
    services: ['QES', 'QEAA', 'eDelivery'],
    signatureAlgorithm: 'ECDSA P-256 / RSA-PSS-2048',
    pqcRoadmap: 'none-public',
    scal: 'both',
    etsiAudit: 'ETSI EN 319 411-2 QCP-l',
    notes: 'Largest QTSP in Central-Eastern Europe; DC4EU pilot participant',
  },
]

// ── Credential Format Comparison ──────────────────────────────────────────────

export interface CredentialFormatSpec {
  id: CredentialFormat
  name: string
  encoding: string
  standard: string
  optimizedFor: string
  disclosureMethod: string
  proofType: string
  pqcMigrationPath: string
}

export const CREDENTIAL_FORMATS: CredentialFormatSpec[] = [
  {
    id: 'mso_mdoc',
    name: 'mso_mdoc (ISO 18013-5)',
    encoding: 'CBOR (binary)',
    standard: 'ISO/IEC 18013-5:2021',
    optimizedFor: 'Proximity (NFC, BLE, QR code)',
    disclosureMethod: 'Selective disclosure via MSO (Mobile Security Object) namespaces',
    proofType: 'ECDSA signature over MSO; device key binding',
    pqcMigrationPath: 'Replace ECDSA with ML-DSA-44 in MSO signature and device key binding',
  },
  {
    id: 'sd-jwt-vc',
    name: 'SD-JWT VC (RFC 9901)',
    encoding: 'JSON (text, Base64url)',
    standard: 'RFC 9901 + SD-JWT (IETF draft)',
    optimizedFor: 'Remote / online services (API, browser)',
    disclosureMethod: 'Salted SHA-256 hash disclosures; holder reveals only requested claims',
    proofType: 'JWT signature (ECDSA ES256 or RS256); key binding JWT for holder proof',
    pqcMigrationPath:
      'Replace ES256 with ML-DSA-44 JOSE algorithm ID; update JWKS endpoints at issuer and QTSP',
  },
]

// ── PQC Migration Phase Descriptions ─────────────────────────────────────────

export interface PqcPhaseInfo {
  id: PqcMigrationPhase
  label: string
  deadline: string
  description: string
  affectedActors: string[]
}

export const PQC_MIGRATION_PHASES: PqcPhaseInfo[] = [
  {
    id: 'phase1-roadmap',
    label: 'Phase 1 — National Roadmaps',
    deadline: 'December 2026',
    description:
      'All EU member states publish their national PQC migration roadmaps for digital identity systems. Wallet providers and PID issuers assess crypto inventory and begin hybrid testing.',
    affectedActors: [
      'National PID Issuers',
      'EUDI Wallet Providers',
      'National Trust List operators',
    ],
  },
  {
    id: 'phase2-high-risk',
    label: 'Phase 2 — High-Risk Migration',
    deadline: 'December 2030',
    description:
      'High-risk entities (PID issuers, QTSPs, critical relying parties in banking and healthcare) complete PQC or hybrid migration. New credential issuances use PQC-capable algorithms.',
    affectedActors: [
      'PID Issuers',
      'QTSPs',
      'Banks (eIDAS Relying Parties)',
      'Healthcare providers',
    ],
  },
  {
    id: 'phase3-full',
    label: 'Phase 3 — Full PQC Transition',
    deadline: 'December 2035',
    description:
      'All EUDI Wallet actors complete migration. Legacy ECDSA credential formats are sunset. All new wallets ship with quantum-safe device keys by default.',
    affectedActors: ['All EUDI Wallet actors', 'All Relying Parties', 'All Attestation Issuers'],
  },
]
