// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Hybrid Cryptography module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, ANSSI_TIMELINE } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'hybrid-crypto',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-09-01',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 9794'), // Hybrid terminology
    getStandard('RFC 9881'), // ML-DSA OIDs in X.509
    getStandard('RFC-9909'), // SLH-DSA profile in X.509
    getStandard('RFC-9935'), // ML-KEM OIDs in X.509 — backs the pure-KEM cert format
    getStandard('RFC 9802'), // LMS/XMSS OIDs
    getStandard('NIST SP 800-227'), // KEM recommendations
    getStandard('draft-ietf-lamps-pq-composite-sigs-19'), // Composite ML-DSA
    getStandard('draft-ietf-lamps-pq-composite-kem-19'), // Composite ML-KEM
    getStandard('RFC-9763'), // Related Certificates
    getStandard('draft-bonnell-lamps-chameleon-certs-07'), // Chameleon Certificates,
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 186-5'),
    getStandard('FIPS 205'),
    getStandard('FIPS 206'),
    getStandard('NIST SP 800-56A'),
    getStandard('RFC 5869'),
    getStandard('RFC 8017'),
    getStandard('RFC 9180'), // HPKE base spec — see the HPKE section + Step 7 workshop
    getStandard('draft-ietf-hpke-pq'), // PQ/PQ-T hybrid HPKE KEM IDs (MLKEM768-X25519/P256, MLKEM1024-P384)
    getStandard('draft-ietf-cose-hpke'), // HPKE use case: COSE
    getStandard('draft-ietf-jose-hpke-encrypt'), // HPKE use case: JOSE
    getStandard('draft-ietf-pquip-hybrid-signature-spectrums'),
    getStandard('draft-sheffer-tls-pqc-continuity'),
    // DECLARED 2026-08-23: this module labels a hashing mechanism it describes as conforming to FIPS 180-4
    // (the Secure Hash Standard) and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 180-4" against a row filed as FIPS-180-4.
    getStandard('FIPS-180-4'),
    // DECLARED 2026-08-23: this module names "RFC 5480" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('IETF RFC 5480'),
    // DECLARED 2026-08-23: this module names "RFC 8032" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-8032'),
    // DECLARED 2026-08-23: this module names "RFC 8410" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-8410'),
    // DECLARED 2026-08-23: this module names "RFC 9846" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    // DECLARED 2026-08-23: this module names "SP 800-56C" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-56C-R2'),
    // DECLARED 2026-08-23: this module names "SP 800-90A" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-90A-R1'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('X25519'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'NSA mandates PQC adoption for national security systems',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'ANSSI migration plan target',
      year: ANSSI_TIMELINE.migrationPlanTarget,
      source: 'ANSSI',
    },
  ],

  narratives: {
    hybridRationale:
      'Hybrid cryptography solves the dilemma of PQC being newer (less cryptanalysis) while the HNDL threat is real now. If either the classical or PQC component is broken, the other still provides security.',
    anssiMandate:
      'ANSSI requires hybrid mode for all PQC deployments. Exception: hash-based signatures (SLH-DSA, LMS, XMSS) leveraging functions like SHA-3 may be used standalone due to their conservative security assumptions.',
    nistRecommendation:
      'NIST SP 800-227 recommends hybrid key exchange during the transition period to maintain backward compatibility while adding quantum resistance.',
    certFormatExplain:
      'Eight certificate approaches are covered here — six that carry signatures, plus two that carry KEM (encryption) keys. Signature formats: Pure PQC (ML-DSA, RFC 9881), Pure PQC (SLH-DSA, RFC 9909), Composite (single OID, both-must-verify), Alt-Sig/Catalyst (PQC in X.509 extensions, ITU-T X.509 (2019) §9.8), Related Certificates (paired certs with a binding hash, RFC 9763), and Chameleon (delta extension — an expired individual draft, taught as a design study). KEM formats: Pure PQC KEM (ML-KEM, RFC 9935) and Composite KEM (single OID over ML-KEM plus a classical KEM). Only Alt-Sig, Related Certificates and Chameleon remain verifiable by a validator that does not understand PQC; composite is not backward compatible.',
    compositeSigSize: '~3,379 bytes',
    altSigSize: '2,017 bytes',
    relatedStandards:
      "FIPS 206 (FN-DSA), cited above as a future pure-PQC signature format, is still a NIST draft as of 2026 — this hub's citation is deprecated until NIST publishes the final text.",
    hpkeDefinition:
      "HPKE (RFC 9180) is a public-key encryption scheme built from three swappable components — a KEM, a KDF, and an AEAD — combined through a standard KeySchedule so any KEM/KDF/AEAD triple, plus one of four modes (Base, PSK, Auth, AuthPSK), yields an interoperable construction. It is not itself a hybrid-vs-classical choice: RFC 9180's own KEM registry is all-classical (DHKEM over P-256/P-384/P-521/X25519/X448). The PQC angle comes from draft-ietf-hpke-pq, which registers PQ and PQ/T hybrid KEM IDs (pure ML-KEM, and MLKEM768-X25519 / MLKEM768-P256 / MLKEM1024-P384 hybrids) that plug into the exact same KeySchedule and Seal/Open — still an Internet-Draft, not yet an RFC.",
    hpkeUseCases:
      'MLS (RFC 9420) uses HPKE for its TreeKEM path updates. TLS 1.3 Encrypted Client Hello (ECH) uses it to encrypt the ClientHello. draft-ietf-jose-hpke-encrypt and draft-ietf-cose-hpke extend it to JOSE/COSE, so it can wrap a JWT or CWT payload the same way. All four share one property: a KEM has no way for the sender to supply a chosen shared secret (unlike ECDH) — HPKE always encapsulates a fresh, sender-unpredictable one.',
    hpkeAuthLimitation:
      'RFC 9180\'s Auth and AuthPSK modes require the KEM to expose AuthEncap/AuthDecap. Every classical DHKEM in RFC 9180 supports this; draft-ietf-hpke-pq\'s ML-KEM and PQ/T hybrid KEM entries mark the Auth column "no" — so Auth/AuthPSK stay classical-only until a future KEM adds it.',
    hpkeNoNativeMechanism:
      'PKCS#11 v3.2 has no CKM_HPKE mechanism (checked against the canonical v3.2 header — no HPKE entry exists at all). A real HSM deployment of HPKE composes it from mechanisms the spec does define: CKM_ECDH1_DERIVE / CKM_ML_KEM for the KEM leg, CKM_HKDF_DERIVE plus C_Sign(CKM_SHA*_HMAC) for LabeledExtract/LabeledExpand, and CKM_AES_GCM / CKM_CHACHA20_POLY1305 for Seal/Open. The Step 7 workshop below does exactly that, cross-checked byte-for-byte against RFC 9180 Appendix A.',
  },
}
