// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the MediaDrmPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'media-drm-pqc',
  version: '1.0.0',
  // lastReviewed is left unset: it is written together with the module's review record.
  lastEdited: '2026-10-29',

  standards: [
    getStandard('MovieLabs-ECP-v1-4'),
    getStandard('AACS-Introduction-and-Common-Cryptographic-Elements-Book-Rev'),
    getStandard('CI-Plus-Spec-v1.3.2'),
    getStandard('A-First-Look-at-Digital-Rights-Management-Systems-for-Secure'),
    getStandard('Content-Credentials-C2PA-Technical-Specification-Version-2-4'),
    getStandard('RFC-10024'),
    getStandard('Cloudflare-PQ-Internet-2025'),
    getStandard('RFC-9964'),
    getStandard('SLH-DSA-for-JOSE-and-COSE'),
    getStandard('RFC-3161-Internet-X-509-Public-Key-Infrastructure-Time-Stamp'),
    getStandard('NIST IR 8547'),
    getStandard('NIST-SP-800-57-Pt1-R5'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDH P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    // None. NIST IR 8547's 2030 and 2035 dates are NIST's schedule for NIST standards and
    // guidelines. None of the editions read in this module states a deadline.
  ],

  narratives: {
    overview:
      'Intermediate module on how content protection and content provenance use public-key cryptography. It reads four editions as they are written (the AACS common cryptographic elements book, Revision 0.953; CI Plus v1.3.2; the MovieLabs ECP specification, Version 1.4; the C2PA Technical Specification, Version 2.4), a 2023 paper on three streaming DRM systems, and RFC 10024 for hybrid key agreement in TLS 1.3, and sets the primitives they use against NIST IR 8547.',
    keyConcepts:
      'A compromised device is part of the threat model, so the question is asked link by link. In AACS the key tree and Media Key are built from AES-128, while the signatures use ECDSA and the Bus Key is derived from exchanged elliptic-curve points. In CI Plus the authentication signatures are RSASSA-PSS with SHA-1 and 2048-bit RSA, key negotiation is Diffie-Hellman with 2048-bit public values, and the scrambler is DES-56 or AES-128. C2PA 2.4 allows ECDSA, RSASSA-PSS and EdDSA (Ed25519) for new signatures and lists no post-quantum algorithm. The text of each edition does not mention quantum computing; that is a statement about a document, not about anyone’s plans.',
    workshopSummary:
      'Key Ladder Explorer: walk the AACS or CI Plus ladder and see which rungs use a public-key primitive of a kind NIST IR 8547 lists. Spec vs Quantum: compare what four editions specify and what their text says about quantum computing. Provenance Algorithm Check: test candidate signature algorithms against the C2PA 2.4 allowed list and see the COSE documents and trust-chain pieces a post-quantum signature would touch.',
    relatedStandards:
      'NIST IR 8547 (October 2026) deprecates quantum-vulnerable public-key cryptography after 2030 and disallows it under NIST standards and guidelines after 2035; those dates are NIST’s schedule, and the media documents read here state no deadline of their own. FIPS 203, 204 and 205 were published on 13 August 2024. RFC 10024 (Standards Track, August 2026) defines three hybrid key agreement mechanisms for TLS 1.3. RFC 9964 (May 2026) specifies COSE serializations for ML-DSA; the matching SLH-DSA document is an Internet-Draft.',
  },
}
