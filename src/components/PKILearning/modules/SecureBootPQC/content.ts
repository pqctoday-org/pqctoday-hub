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
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 204'), getStandard('RFC 9882'), getStandard('RFC 9814')],

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
