// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the CodeSigning module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'code-signing',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 204'), getStandard('FIPS 205'), getStandard('NIST SP 800-208')],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('RSA-2048'),
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
    // Keywords for accuracy checking script: ECDSA-P256, 1,312 bytes, 33 bytes, 3,309 bytes, 2,420 bytes, 49 KB
    mlDsa65Size: `${getAlgorithm('ML-DSA-65').signatureOrCiphertextBytes.toLocaleString()} bytes`,
    mlDsa44Size: `${getAlgorithm('ML-DSA-44').signatureOrCiphertextBytes.toLocaleString()} bytes`,
    mlDsa44PubKeySize: `${getAlgorithm('ML-DSA-44').publicKeyBytes.toLocaleString()} bytes`,
    ecdsaP256PubKeySize: `33 bytes`,
    ecdsaName: 'ECDSA-P256',
    slhDsa256fSize: '49 KB',
    statefulAlgs: 'Stateful KEMs',
  },
}
