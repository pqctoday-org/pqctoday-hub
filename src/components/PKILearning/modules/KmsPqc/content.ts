// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the KmsPqc module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'kms-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-227'), // hybrid combiner + KEM recommendations, cited throughout
    // PKCS#11 v3.2 adds the C_EncapsulateKey/C_DecapsulateKey mechanisms the live
    // HSM demo (EnvelopeEncryptionDemo) calls for the ML-KEM envelope flow.
    getStandard('PKCS11-V32-OS-OASIS'),
    // Governs the HKDF salt/derivation step (cited "SP 800-56C Rev 2 §4.1") that
    // turns the ML-KEM shared secret into a wrapping key.
    getStandard('NIST-SP-800-56C-R2'),
    // AES-GCM wrap mechanism option, cited with IV/tag guidance (§5.2.1.1, §8).
    getStandard('NIST-SP-800-38D'),
    // AES-KW — default DEK wrap mechanism in the envelope encryption demo.
    getStandard('RFC 3394'),
    // AES-KWP — alternate wrap mechanism for non-block-aligned key lengths.
    getStandard('IETF RFC 5649'),
    // HKDF — derives the wrapping key from the KEM shared secret and combines
    // classical + PQC secrets in the hybrid combiner modes.
    getStandard('RFC 5869'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('CSA-PQC-Guide-2025'),
    getStandard('KMIP-V2-1-OASIS'),
    getStandard('NIST IR 8547'),
    getStandard('NIST-SP-800-210-General-Access-Control-Guidance-for-Cloud-Sy'),
    getStandard('RFC 8017'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('SLH-DSA-SHA2-192s'),
    getAlgorithm('SLH-DSA-SHA2-256s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    {
      // Matches ENTERPRISE_SCENARIO.complianceDeadlines' "CNSA 2.0 (NSA)" row,
      // rendered in both KmsPqcIntroduction and KmsRotationPlanner.
      label: 'CNSA 2.0 new NSS acquisitions & OS support required',
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate RSA-2048 and 112-bit ECC',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      // "CNSA 2.0 exclusively PQC by 2033" — KmsPqcIntroduction Phase 3 and the
      // Exercise 5 "observe" text both call out this milestone explicitly.
      label: 'CNSA 2.0 web, cloud & operating systems exclusively PQC',
      year: CNSA_2_0.networkingExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'NIST: disallow all classical public-key crypto',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    primaryHybridCombiner: 'X25519MLKEM768',
    mlKemPrivateKeySize: '2,400 bytes',
    hybridCertOverhead: '2,017 bytes',
  },
}
