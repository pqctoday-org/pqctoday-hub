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
  lastEdited: '2026-08-23',

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
    getStandard('RFC 9180'),
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
  },
}
