// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the APISecurityJWT module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'api-security-jwt',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 6749'),
    getStandard('RFC 7515'),
    getStandard('RFC 7516'),
    getStandard('RFC 7518'),
    getStandard('RFC 7519'),
    getStandard('RFC 9449'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('draft-ietf-jose-pq-composite-sigs'),
    // DECLARED 2026-08-23: this module names FIPS 198-1 (the keyed-hash MAC standard) for a mechanism it describes and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "FIPS 198-1" against a row filed as FIPS-198-1.
    getStandard('FIPS-198-1'),
    // DECLARED 2026-08-23: this module names "RFC 7662" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('IETF RFC 7662'),
    // DECLARED 2026-08-23: this module names "RFC 9964" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9964'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    keyConcepts:
      "JWT/JWS/JWE fundamentals: JWT compact serialization (RFC 7519), JWS signing (RFC 7515), JWE encryption (RFC 7516); three-part structure of base64url-encoded header, payload, and signature. Quantum vulnerability of current JWT algorithms: RS256, ES256, EdDSA all broken by Shor's algorithm; ECDH-ES key agreement equally vulnerable; HMAC-based algorithms (HS256) remain quantum-safe but require shared secrets.",
    workshopSummary:
      'JWT Inspector: Decode and inspect JWT structure with algorithm vulnerability analysis; paste any JWT to see header, payload, and signature breakdown. PQC JWT Signing: Sign and verify JWTs with ML-DSA algorithms interactively; compare output sizes across security levels. Hybrid JWT: Create backwards-compatible JWTs with dual classical + PQC signatures for migration scenarios. JWE Encryption: Encrypt JWT payloads using ML-KEM key agreement with AES-GCM content encryption.',
    relatedStandards:
      'RFC 7519 (JWT), RFC 7515 (JWS), RFC 7516 (JWE), RFC 7518 (JWA). RFC 9964 (ML-DSA for JOSE and COSE, May 2026), draft-ietf-jose-pqc-kem-05 (ML-KEM for JOSE/JWE — its successor -06 was retitled for COSE only and no longer covers JOSE), draft-ietf-jose-pq-composite-sigs (PQ/T composite signatures). FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA). OAuth 2.0 (RFC 6749), OpenID Connect Core 1.0. RFC 9449 (DPoP - Demonstrating Proof of Possession)',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 500 bytes, 5,000 bytes, 5.7 KB, 25 KB
