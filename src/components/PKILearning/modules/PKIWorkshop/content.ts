// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PKIWorkshop module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pki-workshop',
  version: '1.1.0',
  lastReviewed: '2026-08-23',

  standards: [
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('RFC 5280'),
    getStandard('RFC-6960'),
    getStandard('IETF RFC 8555'),
    getStandard('RFC 9881'),
    getStandard('RFC-9763'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NIST IR 8547'),
    getStandard('RFC 8017'),
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
    {
      label: 'CNSA 2.0 large PKI systems exclusive',
      year: CNSA_2_0.networkingExclusive,
      source: 'CNSA 2.0',
    },
  ],

  narratives: {
    rsa2048Size: '1.0 KB',
    ecdsaP256Size: '648 bytes',
    mlDsa65Size: '5.6 KB',
    ecdsaMinSigSize: '72 bytes',
    chainGrowthSize: '4.1 KB',
  },
}
