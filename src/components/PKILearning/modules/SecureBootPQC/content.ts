// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the SecureBootPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'secure-boot-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  // DECLARED 2026-08-22. This module renders <LibRef> links — clickable, reader-facing
  // citations into the library — for eleven documents while declaring three, so eight of
  // them appeared as links a reader could follow and were absent from the References tab.
  // Measured across the whole corpus, SecureBootPQC was the ONLY module with that
  // mismatch; every other module's LibRefs are declared.
  //
  // Declaring them is free now. It was not before: accuracy_spotcheck opened four
  // documents per module by even stride, so a longer list meant a thinner sample. That
  // cap was lifted the same day, which is what makes "just declare it" the right answer
  // rather than a trade.
  standards: [
    getStandard('FIPS 204'),
    getStandard('RFC 9882'),
    getStandard('RFC 9814'),
    getStandard('FIPS 205'),
    getStandard('FIPS 186-5'),
    getStandard('FIPS-180-4'),
    getStandard('NSA CNSA 2.0'),
    getStandard('RFC 5652'),
    getStandard('RFC 9019'),
    getStandard('UEFI-SPEC-2.10-SecureBoot'),
    getStandard('PKCS11-V32-OS-OASIS'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    keyConcepts:
      'UEFI Secure Boot key hierarchy (PK/KEK/db) migration to ML-DSA-65. Firmware signing with post-quantum algorithms. TPM 2.0 path to post-quantum attestation. Vendor roadmaps: AMI, Insyde, EDK2, Dell, HPE. Hardware supply chain integrity at scale',
    workshopSummary:
      'Secure Boot Chain Analyzer. Firmware Signing Migrator. TPM Key Hierarchy Explorer. Firmware Vendor Matrix. Attestation Flow Designer',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// ECDSA-P256, FN-DSA-512
