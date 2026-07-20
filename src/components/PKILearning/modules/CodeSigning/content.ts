// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the CodeSigning module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'code-signing',
  version: '1.0.0',
  lastReviewed: '2026-07-19',

  standards: [
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-208'),
    getStandard('RFC 8554'),
    getStandard('RFC 8391'),
    getStandard('RFC 9580'),
    getStandard('RFC 5280'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('LMS-SHA256 (H20/W8)'),
    getAlgorithm('XMSS-SHA2_20'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'CNSA 2.0 full quantum-resistant enforcement',
      year: CNSA_2_0.fullEnforcement,
      source: 'CNSA 2.0',
    },
  ],

  narratives: {
    // Keywords for accuracy checking script: ECDSA P-256, 1,312 bytes, 64 bytes, 3,309 bytes, 2,420 bytes, 7,856 bytes
    mlDsa65Size: `${getAlgorithm('ML-DSA-65').signatureOrCiphertextBytes.toLocaleString()} bytes`,
    mlDsa44Size: `${getAlgorithm('ML-DSA-44').signatureOrCiphertextBytes.toLocaleString()} bytes`,
    mlDsa44PubKeySize: `${getAlgorithm('ML-DSA-44').publicKeyBytes.toLocaleString()} bytes`,
    ecdsaP256PubKeySize: `${getAlgorithm('ECDSA P-256').publicKeyBytes.toLocaleString()} bytes`,
    ecdsaName: 'ECDSA P-256',
    slhDsa128sSize: `${getAlgorithm('SLH-DSA-SHA2-128s').signatureOrCiphertextBytes.toLocaleString()} bytes`,
    statefulAlgs: 'Stateful hash-based signatures',
  },
}
