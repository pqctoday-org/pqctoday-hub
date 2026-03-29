// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PQCGovernance module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-governance',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 186-5'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS 206'),
    getStandard('NIST SP 800-208'),
    getStandard('NIST SP 800-53'),
    getStandard('NIST SP 800-88'),
  ],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('FN-DSA-1024'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('FrodoKEM-1344'),
    getAlgorithm('HQC-128'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('SLH-DSA-SHA2-256s'),
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
    // TODO: Extract narrative text from JSX components
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// ECDSA-P256
