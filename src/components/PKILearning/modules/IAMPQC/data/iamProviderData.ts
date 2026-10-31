// SPDX-License-Identifier: AGPL-3.0-only
import { getCatalogStatus, type CatalogAvailability } from '@/data/catalogStatus'

export type PQCStatus = 'ga' | 'preview' | 'roadmap' | 'planned' | 'none'

export interface IAMVendorStatus {
  id: string
  vendor: string
  product: string
  category: string
  /**
   * Reference to the product's `software_name` in the central catalog
   * (`pqc_product_catalog_*.csv`). The headline `pqcStatus` is DERIVED from the
   * catalog via `getVendorPqcStatus` — never stored here, so the module cannot
   * drift from the single source of truth. The IAM-specific teaching detail
   * (tokenSigning / mfaPqc / apiSecurity / certifications / notes) stays
   * module-authored — the catalog does not track it.
   */
  catalogName: string
  tokenSigning: string
  mfaPqc: string
  apiSecurity: string
  roadmapYear: number | null
  certifications: string[]
  notes: string
}

// ── Catalog-derived headline status ───────────────────────────────────────────
const AVAIL_TO_PQC: Record<CatalogAvailability, PQCStatus> = {
  available: 'ga',
  partial: 'preview',
  roadmap: 'roadmap',
  none: 'none',
  unverified: 'roadmap',
}

/** Headline PQC status for an IAM vendor, derived live from the central catalog. */
export function getVendorPqcStatus(v: IAMVendorStatus): PQCStatus {
  const status = getCatalogStatus(v.catalogName)
  return status ? AVAIL_TO_PQC[status.availability] : 'roadmap'
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
    catalogName: 'Okta Workforce Identity',
    tokenSigning:
      'Our product catalogue records no post-quantum token signing for Okta Workforce Identity; we found no published Okta date or pilot.',
    mfaPqc:
      'TOTP/HOTP use HMAC, a symmetric construction; we found no published Okta date for post-quantum FIDO2/WebAuthn attestation.',
    apiSecurity: 'We found no published Okta date for hybrid ML-KEM on its API endpoints.',
    roadmapYear: null,
    certifications: ['FIPS 140-2 validated (crypto modules)', 'SOC 2 Type II', 'ISO 27001'],
    notes: 'Our product catalogue records no post-quantum support for Okta Workforce Identity.',
  },
  {
    id: 'microsoft-entra',
    vendor: 'Microsoft',
    product: 'Microsoft Entra ID',
    category: 'Cloud IAM / Directory',
    catalogName: 'Microsoft Entra ID',
    tokenSigning:
      "We found no published Microsoft date or design for post-quantum Entra ID token signing. Microsoft's quantum safe program roadmap names Microsoft Entra authentication among the first services to be protected.",
    mfaPqc:
      'We found no published Microsoft date for post-quantum Windows Hello attestation or FIDO2 authenticators.',
    apiSecurity:
      'We found no published Microsoft statement of post-quantum TLS for the MSAL SDK, Azure AD B2C or Microsoft Graph.',
    roadmapYear: null,
    certifications: [
      'FIPS 140-3 (SymCrypt)',
      'FedRAMP High',
      'ISO 27001',
      'SOC 2 Type II',
      'DoD IL4/5',
    ],
    notes:
      "SymCrypt, Microsoft's primary cryptographic library across Windows, Azure and Microsoft 365, has integrated ML-KEM and ML-DSA. Microsoft's roadmap says they are available through CNG to Windows Insiders and Linux customers, with additional capabilities coming over the next five years.",
  },
  {
    id: 'ping-federate',
    vendor: 'Ping Identity',
    product: 'PingFederate / PingOne',
    category: 'Enterprise IAM / Federation',
    catalogName: 'Ping Identity PingFederate',
    tokenSigning:
      'Our product catalogue records no post-quantum support for PingFederate; we found no published Ping Identity date for post-quantum JWT signing.',
    mfaPqc:
      'PingID MFA — TOTP uses HMAC, a symmetric construction; we found no published Ping Identity date for post-quantum FIDO2 attestation.',
    apiSecurity: 'We found no published Ping Identity date for post-quantum TLS in PingAccess.',
    roadmapYear: null,
    certifications: ['FIPS 140-2 (select modules)', 'SOC 2 Type II', 'ISO 27001'],
    notes: 'Ping Identity (acquired by Thoma Bravo in 2022) merged with ForgeRock in 2023.',
  },
  {
    id: 'forgerock',
    vendor: 'Ping Identity (ForgeRock)',
    product: 'ForgeRock Access Management (AM)',
    category: 'Enterprise IAM',
    catalogName: 'ForgeRock Access Management (AM)',
    tokenSigning:
      'Our product catalogue records no post-quantum support for ForgeRock Access Management (now PingAM); we found no published date for ML-DSA OAuth2/OIDC token signing.',
    mfaPqc:
      'ForgeRock MFA — TOTP uses HMAC, a symmetric construction; we found no published date for post-quantum push notification channels.',
    apiSecurity:
      'We found no published date for post-quantum TLS in Identity Gateway or the ForgeRock SDK.',
    roadmapYear: null,
    certifications: ['FIPS 140-2 (Bouncy Castle FIPS)', 'ISO 27001', 'SOC 2 Type II'],
    notes: 'ForgeRock is now part of Ping Identity.',
  },
  {
    id: 'sailpoint',
    vendor: 'SailPoint',
    product: 'SailPoint Identity Security Cloud',
    category: 'Identity Governance',
    catalogName: 'SailPoint Identity Security Cloud',
    tokenSigning:
      'IGA workflow tokens — token signing via cloud IdP delegation; we found no published SailPoint PQC date.',
    mfaPqc:
      'Delegated to integrated IdP (Okta/Entra); SailPoint-native MFA uses TOTP (quantum-safe)',
    apiSecurity: 'REST API TLS — vendor-managed infrastructure upgrade; no direct PQC timeline',
    roadmapYear: null,
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP Moderate'],
    notes:
      'SailPoint focuses on identity governance (IGA) and delegates cryptographic operations to integrated IdPs. PQC impact is primarily on API TLS and workflow integrity.',
  },
  {
    id: 'cyberark',
    vendor: 'CyberArk',
    product: 'CyberArk PAM / Vault',
    category: 'Privileged Access Management',
    catalogName: 'CyberArk Conjur',
    tokenSigning:
      'PAM session recording tokens — tamper-evidence signing; we found no published CyberArk date for ML-DSA signing',
    mfaPqc:
      'CyberArk Identity MFA — TOTP uses HMAC, a symmetric construction; PIV card support; we found no published CyberArk date for post-quantum FIDO2 attestation.',
    apiSecurity:
      'We found no published CyberArk date for hybrid ML-KEM on Vault API channels or for post-quantum Conjur secrets delivery.',
    roadmapYear: null,
    certifications: [
      'FIPS 140-3 Level 1: CyberArk Cryptographic Module #5205 and CyberArk Cryptographic Module for Java #5122 (software modules; earlier certificates #4949, #4693, #4377 are Historical; CMVP, checked 2026-09-24)',
      'Common Criteria: PAM v14 components certified against the NIAP Application Software PP v1.4 (NSCIB, 2024; PP-based, no EAL)',
      'SOC 2 Type II',
    ],
    notes: 'PAM vaults holding privileged credentials are critical HNDL targets.',
  },
  {
    id: 'hashicorp-vault',
    vendor: 'HashiCorp (IBM)',
    product: 'HashiCorp Vault (Identity)',
    category: 'Secrets Management / IAM',
    catalogName: 'HashiCorp Vault',
    tokenSigning:
      'Our product catalogue records experimental ML-DSA and SLH-DSA signature support in the Transit secrets engine of Vault Enterprise 2.0.0+ (ML-DSA sign/verify since 1.19); the Community edition has no PQC.',
    mfaPqc:
      'Vault MFA (TOTP/TOTP-backed) — TOTP uses HMAC, a symmetric construction; we found no published HashiCorp date for a post-quantum OIDC provider.',
    apiSecurity:
      'We found no published HashiCorp statement of hybrid ML-KEM for Vault TLS or Vault Agent.',
    roadmapYear: null,
    certifications: ['FIPS 140-2 (Vault FIPS edition)', 'SOC 2 Type II', 'FedRAMP Moderate'],
    notes:
      'Our product catalogue records ML-DSA signing in the Transit secrets engine of Vault Enterprise as experimental. We found no published HashiCorp date for PQC certificates in the PKI secrets engine or for a post-quantum OIDC provider.',
  },
  {
    id: 'keycloak',
    vendor: 'Red Hat / Community',
    product: 'Keycloak',
    category: 'Open-Source IAM',
    catalogName: 'Keycloak',
    tokenSigning:
      'Our product catalogue records Keycloak PQC readiness as planned (feature issue #43690, milestone 27.0); we found no released post-quantum JWT signing.',
    mfaPqc:
      'TOTP uses HMAC, a symmetric construction; we found no published Keycloak statement of post-quantum FIDO2/WebAuthn authenticator support.',
    apiSecurity:
      "Undertow (WildFly) TLS — hybrid ML-KEM via the JDK's own TLS stack (JDK 27, Oracle JDK 25.0.5) or the BouncyCastle JSSE extension",
    roadmapYear: null,
    certifications: ['Common Criteria (RHSSO)', 'FIPS 140-2 (RHSSO with NSS)'],
    notes:
      "Keycloak is open source. Our product catalogue records PQC readiness as planned (feature issue #43690, milestone 27.0): the issue aims to review Keycloak's cryptography and provide PQC-safe algorithms where applicable, and PQC is not intended to be the default.",
  },
]
