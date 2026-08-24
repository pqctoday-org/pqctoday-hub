// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the FiveG module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: '5g-security',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    // Repointed 2026-08-10: '3GPP TS 33.501' was deprecated on 2026-07-30
    // because its cached evidence was the 3GPP landing page, not the spec.
    // The Rel-19 row carries the real ETSI PDF — and that PDF's Annex C.3.4.1
    // is what confirms this module's Profile A description.
    getStandard('3GPP TS 33.501 Rel-19'),
    getStandard('3GPP-PQC-Study-2025'),
    getStandard('NIST-CSWP-36A'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('ANSI X9.63'),
    getStandard('NIST SP 800-227'),
    getStandard('NIST SP 800-56A'),
    getStandard('RFC 7748'),
    getStandard('SEC 1'),
    // DECLARED 2026-08-23: this module names "SP 800-56C" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-56C-R2'),
  ],

  algorithms: [getAlgorithm('ML-KEM-768'), getAlgorithm('X25519')],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    keyConcepts:
      'SUCI concealment: encrypts the subscriber permanent identity (SUPI/IMSI) before transmission over the air interface, preventing IMSI catcher surveillance attacks that plagued 2G/3G/4G networks. Profile A (X25519): Curve25519 ECDH key agreement, 32-byte public keys, AES-128-CTR encryption, HMAC-SHA-256 integrity; quantum-vulnerable. Profile B (P-256): NIST secp256r1 ECDH, 65-byte uncompressed public keys, AES-128-CTR encryption, HMAC-SHA-256 integrity; quantum-vulnerable.',
    workshopSummary:
      'Part 1 -- SUCI Deconcealment: Step through the full 11-step SUCI construction and deconcealment process for Profile A (X25519), Profile B (P-256), and Profile C (ML-KEM), with real OpenSSL commands showing key generation, ECDH/KEM operations, KDF derivation, AES encryption, and HMAC computation.',
    relatedStandards:
      '3GPP TS 33.501 (5G security architecture), 3GPP TS 35.206 (MILENAGE algorithm), 3GPP TR 33.938 (3GPP Cryptographic Inventory — an inventory of where ECIES/ECDH/RSA are used today, not a PQC profile). 3GPP TS 23.003 (SUPI/SUCI identifier formats), 3GPP TS 31.102 (USIM application). FIPS 203 (ML-KEM), NIST SP 800-56C (KDF recommendations). RFC 7748 (X25519 Diffie-Hellman), ANSI X9.63 (Key Derivation Function)',
  },
}
