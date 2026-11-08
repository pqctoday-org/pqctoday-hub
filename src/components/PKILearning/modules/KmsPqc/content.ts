// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the KmsPqc module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import {
  CNSA_2022_PREFERRED_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'kms-pqc',
  version: '1.1.0',
  lastReviewed: '2026-10-27',
  lastEdited: '2026-11-08',

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
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // DECLARED 2026-08-23: this module names SP 800-57 Part 1 for key-management guidance. Cites REVISION 5, which is the
    // Final publication — Rev 6 exists in the catalogue but its own cover page reads
    // "Initial Public Draft" and cited nothing for it.
    getStandard('NIST-SP-800-57-Pt1-R5'),
    // DECLARED 2026-08-23: this module names "SP 800-108" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-108-R1'),
    // DECLARED 2026-08-23: this module names "SP 800-38F" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-38F-Recommendation-for-Block-Cipher-Modes-of-Ope'),
    // round 9 wave 4 (2026-09-19): cited for the figures the accuracy record found unmapped
    getStandard('NSA CNSA 2.0 FAQ'), // pt-envelope-encrypt: January 1, 2027
    getStandard('Chosen-Ciphertext-Attacks-Against-Protocols-Based-on-the-RSA'), // m-kms-pqc: 1998; pt-envelope-encrypt: 1998
    getStandard('Key-encapsulation-mechanisms'), // m-kms-pqc: 1,120 bytes
    // Key exchange with a third-party HSM or KMS (November 2026). Each id backs the sentence of the
    // same name in KmsPqcIntroduction; the AWS, Google and Azure pages are held in the Library.
    getStandard('AWS-KMS-Post-Quantum-Keys'),
    getStandard('AWS-KMS-ML-KEM-Launch-2026-10'),
    getStandard('AWS-KMS-Import-Wrapping-Keys'),
    getStandard('AWS-KMS-API-Decapsulate'),
    getStandard('AWS-KMS-API-Encapsulate'),
    getStandard('AWS-KMS-API-GenerateDataKeyPair'),
    getStandard('AWS-KMS-Hybrid-PQ-TLS'),
    getStandard('AWS-PQ-Readiness-Confidentiality'),
    getStandard('Google-Cloud-KMS-Quantum-Safe-Key-Import'),
    getStandard('Google-Cloud-KMS-Key-Import'),
    getStandard('Google-Cloud-KMS-Release-Notes'),
    getStandard('Azure-Key-Vault-BYOK-Specification'),
    getStandard('Azure-Managed-HSM-BYOK'),
    getStandard('HashiCorp-Vault-Transit-API'),
    // HPKE (RFC 9180) is the wrapping format of Google's quantum-safe import; RFC 10024 names the
    // TLS hybrid groups the lesson separates from the KMS key-wrap combiners.
    getStandard('RFC 9180'),
    getStandard('RFC-10024'),
    // ML-KEM-aware cryptoperiods in the draft revision; Revision 5 stays the final publication.
    getStandard('NIST-SP-800-57-Pt1-R6'),
    // CMVP implementation guidance for ML-KEM and hybrid schemes in the approved mode.
    getStandard('NIST-FIPS140-3-IG-PQC'),
    // Interim PQC key-wrapping around classical HSM operations (v2.1).
    getStandard('AQ-PQC-Migration-Framework-v2.1-2026'),
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
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    {
      // Matches ENTERPRISE_SCENARIO.complianceDeadlines' "CNSA 2.0 (NSA)" row,
      // rendered in both KmsPqcIntroduction and KmsRotationPlanner.
      label: 'CNSA 2.0 required in new NSS acquisitions',
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate quantum-vulnerable public-key crypto (RSA, ECC)',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      // Current FAQ v2.2 general NSS algorithm mandate.
      label: 'CNSA 2.0 algorithms mandated for NSS unless otherwise noted',
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
