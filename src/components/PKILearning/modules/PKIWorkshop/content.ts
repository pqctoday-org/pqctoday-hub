// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PKIWorkshop module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pki-workshop',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('RFC 5280'),
    getStandard('RFC 8555'),
    getStandard('RFC 9881'),
    getStandard('RFC 9763'),
    getStandard('FIPS 140-3'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('SLH-DSA-SHA2-128f'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('SLH-DSA-SHA2-192f'),
    getAlgorithm('SLH-DSA-SHA2-192s'),
    getAlgorithm('SLH-DSA-SHA2-256f'),
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
    rsa2048Size: '1.5 KB',
    ecdsaP256Size: '400 bytes',
    mlDsa65Size: '5.7 KB',
    compositeSize: '7.4 KB',
    ecdsaMinSigSize: '72 bytes',
    chainGrowthSize: '4.1 KB',
  },
}
