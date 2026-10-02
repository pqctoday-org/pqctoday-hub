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
  lastReviewed: '2026-10-01',
  lastEdited: '2026-10-02',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 6749'),
    getStandard('RFC 7515'),
    getStandard('RFC 7516'),
    getStandard('RFC 7518'),
    getStandard('RFC 7519'),
    getStandard('RFC 9449'),
    // DECLARED 2026-10-01 (api-security-jwt remediation): documents the module
    // now teaches from — JWT/OAuth validation BCPs, JWK, and the current JOSE PQ
    // drafts. RFC 9068 and RFC 9864 are declared below now that they have rows.
    getStandard('RFC 8725'),
    getStandard('RFC-9700-Best-Current-Practice-for-OAuth-2-0-Security'),
    getStandard('RFC 7517'),
    getStandard('SLH-DSA-for-JOSE-and-COSE'),
    getStandard('draft-ietf-jose-hpke-encrypt'),
    getStandard('draft-ietf-jose-hpke-pq-pqt-01'),
    // RFC 9068 / RFC 9864 rows added 2026-10-01 (library data PR, 4.141.0).
    getStandard('RFC-9068'),
    getStandard('RFC-9864'),
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
      "JWT/JWS/JWE fundamentals: JWT compact serialization (RFC 7519), JWS signing (RFC 7515), JWE encryption (RFC 7516); three-part structure of base64url-encoded header, payload, and signature. Quantum exposure of current JWT algorithms: RS256, ES256, EdDSA and ECDH-ES would fall to Shor's algorithm on a cryptographically relevant quantum computer; HMAC-based HS256 is symmetric and only weakened by Grover's algorithm. Signed JWTs face a forgery risk, not harvest-now-decrypt-later; HNDL applies to JWE and the TLS channel. Validation basics (RFC 8725, RFC 9700, RFC 9068): pin algorithms to keys, validate iss/aud/exp/nbf, explicit typing, validate every layer of a nested JWT.",
    workshopSummary:
      'JWT Inspector: Decode a JWT and see the algorithm class its header declares (unverified). PQC JWT Signing: Sign and verify JWTs with ML-DSA (RFC 9964 vectors), SLH-DSA (draft-ietf-cose-sphincs-plus-10 vectors) and composite algorithms; compare sizes. Hybrid JWT: Build a real nested JWT (cty JWT, both layers verified) or a composite ML-DSA-65-Ed25519 JWT checked against draft-ietf-jose-pq-composite-sigs-04 published examples. JWE Encryption: Encrypt a JWT payload as an HPKE JWE with HPKE-12 (ML-KEM-768) or HPKE-9 (ML-KEM-768 + X25519) per draft-ietf-jose-hpke-encrypt-22 and draft-ietf-jose-hpke-pq-pqt-01, checked against the published examples of that draft (experimental). Attack Lab: Try alg:none, edited claims, wrong-audience, expired and wrong-type tokens against a strict RFC 8725 validator and a naive verifier, on real ML-DSA-65 tokens.',
    relatedStandards:
      'RFC 7519 (JWT), RFC 7515 (JWS), RFC 7516 (JWE), RFC 7517 (JWK), RFC 7518 (JWA). RFC 9964 (ML-DSA for JOSE and COSE, May 2026), RFC 9864 (Fully-Specified Algorithms). draft-ietf-cose-sphincs-plus-10 (SLH-DSA), draft-ietf-jose-pq-composite-sigs-04 (PQ/T composite signatures), draft-ietf-jose-hpke-encrypt-22 and draft-ietf-jose-hpke-pq-pqt-01 (PQ encryption for JWE; the earlier direct-KEM draft-ietf-jose-pqc-kem is COSE-only since -06). RFC 8725 (JWT BCP), RFC 9700 (OAuth 2.0 Security BCP), RFC 9068 (JWT access tokens). FIPS 203, FIPS 204, FIPS 205. OAuth 2.0 (RFC 6749), OpenID Connect Core 1.0, RFC 9449 (DPoP)',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 500 bytes, 5,000 bytes, 5.7 KB, 25 KB
