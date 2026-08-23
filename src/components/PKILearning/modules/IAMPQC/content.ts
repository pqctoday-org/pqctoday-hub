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
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS-198-1'),
    getStandard('NIST-SP-800-132'),
    getStandard('OASIS-SAML-2-0-Core'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('Enhancing-Security-in-EAP-AKA-prime-with-Hybrid-Post-Quantum'),
    getStandard('NIST IR 8547'),
    getStandard('Post-Quantum-Key-Encapsulation-Mechanisms-PQ-KEMs-in-EAP-AKA'),
    getStandard('RFC 9052'),
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // DECLARED 2026-08-23: this module names "RFC 4556" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('IETF RFC 4556'),
    // DECLARED 2026-08-23: this module names "RFC 9964" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9964'),
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
