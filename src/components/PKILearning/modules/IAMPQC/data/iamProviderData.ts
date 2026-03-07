// SPDX-License-Identifier: GPL-3.0-only

export type PQCStatus = 'ga' | 'preview' | 'roadmap' | 'planned' | 'none'

export interface IAMVendorStatus {
  id: string
  vendor: string
  product: string
  category: string
  pqcStatus: PQCStatus
  tokenSigning: string
  mfaPqc: string
  apiSecurity: string
  roadmapYear: number | null
  certifications: string[]
  notes: string
  scores: {
    tokenSigning: number // 0-25
    mfa: number // 0-25
    apiSecurity: number // 0-25
    roadmap: number // 0-25
  }
}

export const PQC_STATUS_LABELS: Record<PQCStatus, { label: string; className: string }> = {
  ga: {
    label: 'GA',
    className: 'bg-status-success/10 text-status-success border-status-success/30',
  },
  preview: {
    label: 'Preview',
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  roadmap: {
    label: 'Roadmap',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  planned: {
    label: 'Planned',
    className: 'bg-muted/50 text-muted-foreground border-border',
  },
  none: {
    label: 'No PQC',
    className: 'bg-status-error/10 text-status-error border-status-error/30',
  },
}

export const IAM_VENDORS: IAMVendorStatus[] = [
  {
    id: 'okta',
    vendor: 'Okta',
    product: 'Okta Identity Engine',
    category: 'Cloud IAM',
    pqcStatus: 'preview',
    tokenSigning:
      'ML-DSA token signing pilot launched 2025; opt-in preview for JWT and SAML assertions',
    mfaPqc: 'FIDO2/WebAuthn attestation PQC roadmap 2026; TOTP/HOTP (HMAC) already quantum-safe',
    apiSecurity: 'TLS 1.3 with hybrid ML-KEM planned for 2026 across all API endpoints',
    roadmapYear: 2026,
    certifications: ['FIPS 140-2 validated (crypto modules)', 'SOC 2 Type II', 'ISO 27001'],
    notes:
      'Okta partnered with NIST NCCoE for PQC migration guidance. Preview available in Okta Preview (sandbox) orgs as of Q2 2025.',
    scores: {
      tokenSigning: 18,
      mfa: 14,
      apiSecurity: 15,
      roadmap: 20,
    },
  },
  {
    id: 'microsoft-entra',
    vendor: 'Microsoft',
    product: 'Microsoft Entra ID',
    category: 'Cloud IAM / Directory',
    pqcStatus: 'preview',
    tokenSigning:
      'Entra ID PQC hybrid token signing in preview 2025; ML-DSA-65 for ID tokens and access tokens',
    mfaPqc:
      'Windows Hello PQC attestation planned for TPM 2.0+ devices; FIDO2 PQC authenticator support 2026',
    apiSecurity:
      'MSAL SDK supports hybrid TLS; Azure AD B2C PQC endpoints planned; Graph API TLS upgrade in progress',
    roadmapYear: 2026,
    certifications: [
      'FIPS 140-3 (SymCrypt)',
      'FedRAMP High',
      'ISO 27001',
      'SOC 2 Type II',
      'DoD IL4/5',
    ],
    notes:
      'SymCrypt (Microsoft crypto library) has full ML-KEM and ML-DSA support. Windows Server 2025 includes experimental PKINIT PQC. Entra conditional access PQC policies in public preview.',
    scores: {
      tokenSigning: 20,
      mfa: 18,
      apiSecurity: 20,
      roadmap: 23,
    },
  },
  {
    id: 'ping-federate',
    vendor: 'Ping Identity',
    product: 'PingFederate / PingOne',
    category: 'Enterprise IAM / Federation',
    pqcStatus: 'roadmap',
    tokenSigning:
      'PingOne Advanced Services PQC JWT signing on roadmap for 2026; PingFederate 12.x evaluation underway',
    mfaPqc:
      'PingID MFA — TOTP is quantum-safe; FIDO2 PQC attestation roadmap aligned with FIDO Alliance 2026',
    apiSecurity:
      'PingAccess API gateway PQC TLS planned; PingIntelligence AI anomaly detection upgrade roadmap',
    roadmapYear: 2026,
    certifications: ['FIPS 140-2 (select modules)', 'SOC 2 Type II', 'ISO 27001'],
    notes:
      'Ping Identity (acquired by Thoma Bravo in 2022) merged with ForgeRock in 2023. Combined roadmap consolidating PQC plans across PingFederate, PingOne, and ForgeRock AM. Joint PQC advisory published 2025.',
    scores: {
      tokenSigning: 10,
      mfa: 12,
      apiSecurity: 12,
      roadmap: 16,
    },
  },
  {
    id: 'forgerock',
    vendor: 'Ping Identity (ForgeRock)',
    product: 'ForgeRock Access Management (AM)',
    category: 'Enterprise IAM',
    pqcStatus: 'roadmap',
    tokenSigning:
      'AM 7.x PQC integration via OpenSSL 3.x Java provider; ML-DSA for OAuth2/OIDC tokens under evaluation',
    mfaPqc: 'ForgeRock MFA — TOTP quantum-safe; push notification channel PQC TLS planned',
    apiSecurity:
      'IG (Identity Gateway) PQC TLS via Bouncy Castle PQC; ForgeRock SDK hybrid TLS update planned',
    roadmapYear: 2026,
    certifications: ['FIPS 140-2 (Bouncy Castle FIPS)', 'ISO 27001', 'SOC 2 Type II'],
    notes:
      'ForgeRock now part of Ping Identity. Bouncy Castle FIPS (BC-FJA) includes ML-DSA and ML-KEM. AM 7.x can use BC as crypto provider enabling PQC without major architectural changes.',
    scores: {
      tokenSigning: 12,
      mfa: 10,
      apiSecurity: 14,
      roadmap: 15,
    },
  },
  {
    id: 'sailpoint',
    vendor: 'SailPoint',
    product: 'SailPoint Identity Security Cloud',
    category: 'Identity Governance',
    pqcStatus: 'planned',
    tokenSigning:
      'IGA workflow tokens — PQC awareness roadmap in 2026; token signing via cloud IdP delegation',
    mfaPqc:
      'Delegated to integrated IdP (Okta/Entra); SailPoint-native MFA uses TOTP (quantum-safe)',
    apiSecurity: 'REST API TLS — vendor-managed infrastructure upgrade; no direct PQC timeline',
    roadmapYear: 2027,
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP Moderate'],
    notes:
      'SailPoint focuses on identity governance (IGA) and delegates cryptographic operations to integrated IdPs. PQC impact is primarily on API TLS and workflow integrity; lower direct crypto exposure than authentication-primary vendors.',
    scores: {
      tokenSigning: 6,
      mfa: 10,
      apiSecurity: 8,
      roadmap: 10,
    },
  },
  {
    id: 'cyberark',
    vendor: 'CyberArk',
    product: 'CyberArk PAM / Vault',
    category: 'Privileged Access Management',
    pqcStatus: 'preview',
    tokenSigning:
      'PAM session recording tokens — ML-DSA signing for tamper evidence in 2025 preview',
    mfaPqc:
      'CyberArk Identity MFA — FIDO2 PQC attestation planned; TOTP quantum-safe; PIV card support',
    apiSecurity:
      'Vault TLS — hybrid ML-KEM-768 for API channels in 2025; CyberArk Conjur PQC secrets delivery planned',
    roadmapYear: 2025,
    certifications: ['FIPS 140-2 Level 1-3', 'Common Criteria EAL4+', 'SOC 2 Type II'],
    notes:
      'PAM vaults holding privileged credentials are critical HNDL targets. CyberArk prioritizes vault-to-agent channel security. Conjur (secrets manager) PQC transit encryption under active development.',
    scores: {
      tokenSigning: 16,
      mfa: 16,
      apiSecurity: 20,
      roadmap: 22,
    },
  },
  {
    id: 'hashicorp-vault',
    vendor: 'HashiCorp (IBM)',
    product: 'HashiCorp Vault (Identity)',
    category: 'Secrets Management / IAM',
    pqcStatus: 'preview',
    tokenSigning:
      'Vault ML-DSA token signing for Vault-issued tokens (planned); Transit Secrets Engine PQC signing (roadmap)',
    mfaPqc: 'Vault MFA (TOTP/TOTP-backed) — TOTP quantum-safe; OIDC provider PQC planned 2026',
    apiSecurity:
      'Vault TLS — experimental hybrid ML-KEM via OpenSSL 3.x; Vault Agent TLS PQC in 1.17 target',
    roadmapYear: 2026,
    certifications: ['FIPS 140-2 (Vault FIPS edition)', 'SOC 2 Type II', 'FedRAMP Moderate'],
    notes:
      'HashiCorp Vault Transit Secrets Engine ML-DSA signing planned (roadmap). PKI Secrets Engine PQC certificates planned. Vault OIDC provider (identity broker) PQC migration tracked in GitHub.',
    scores: {
      tokenSigning: 18,
      mfa: 12,
      apiSecurity: 18,
      roadmap: 20,
    },
  },
  {
    id: 'keycloak',
    vendor: 'Red Hat / Community',
    product: 'Keycloak',
    category: 'Open-Source IAM',
    pqcStatus: 'preview',
    tokenSigning:
      'Keycloak 25.x+ ML-DSA JWT signing via OpenSSL 3.x oqsprovider (experimental, community work); OIDC and SAML assertion PQC',
    mfaPqc:
      'FIDO2 WebAuthn PQC authenticator support via Keycloak SPI; TOTP quantum-safe as standard',
    apiSecurity:
      'Undertow (WildFly) TLS — hybrid ML-KEM via JDK 21 provider or BouncyCastle JSSE extension',
    roadmapYear: 2025,
    certifications: ['Common Criteria (RHSSO)', 'FIPS 140-2 (RHSSO with NSS)'],
    notes:
      'Keycloak is open source; PQC integration available via oqsprovider for OpenSSL and BouncyCastle Java. Community PQC SPI for token signing already available. Red Hat SSO (RHSSO) enterprise version targets 2026 GA.',
    scores: {
      tokenSigning: 19,
      mfa: 15,
      apiSecurity: 16,
      roadmap: 18,
    },
  },
]

export const VENDOR_SCORING_DIMENSIONS = [
  {
    id: 'tokenSigning',
    label: 'Token Signing',
    description: 'JWT, SAML, OIDC token signing with ML-DSA',
    maxScore: 25,
  },
  {
    id: 'mfa',
    label: 'MFA / Attestation',
    description: 'FIDO2/WebAuthn PQC attestation and MFA channel security',
    maxScore: 25,
  },
  {
    id: 'apiSecurity',
    label: 'API Security',
    description: 'PQC TLS for API channels and secrets delivery',
    maxScore: 25,
  },
  {
    id: 'roadmap',
    label: 'Roadmap Clarity',
    description: 'Commitment, timelines, and published PQC migration guidance',
    maxScore: 25,
  },
] as const

export type ScoringDimension = (typeof VENDOR_SCORING_DIMENSIONS)[number]['id']
