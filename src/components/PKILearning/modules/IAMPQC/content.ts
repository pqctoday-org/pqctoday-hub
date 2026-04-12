// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the IAMPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'iam-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS-198-1'),
    getStandard('NIST-SP-800-132'),
    getStandard('OASIS-SAML-2-0-Core'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate RSA-2048 and 112-bit ECC',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label: 'NIST: disallow all classical public-key crypto',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    keyConcepts:
      'JWT, SAML, OIDC token signing migration to ML-DSA (FIPS 204). Active Directory, LDAP, Kerberos quantum vulnerabilities and HNDL risk scores. IAM vendor roadmaps: Okta, Microsoft Entra, PingFederate, ForgeRock, CyberArk, HashiCorp Vault, Keycloak. Zero trust identity architecture with PQC across five pillars. Harvest Now, Decrypt Later (HNDL) risk for Kerberos tickets, SAML assertions, and JWT refresh tokens',
    workshopSummary:
      'IAM Crypto Inventory — audit 8 components by quantum risk level and migration priority. Token Migration Lab — compare RS256/ES256 vs ML-DSA-44/65/87 signature sizes and header changes. Directory Services Analyzer — AD/LDAP/Azure AD HNDL risk scoring and attack scenario analysis. Vendor Readiness Scorer — score IAM vendors across token signing, MFA, API security, roadmap dimensions. Zero Trust Identity Architect — assign migration years to 5 identity pillars and generate a phased roadmap',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// RFC 7644
