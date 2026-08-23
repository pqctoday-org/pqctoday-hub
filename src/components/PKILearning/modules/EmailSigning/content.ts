// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the EmailSigning module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'email-signing',
  version: '1.0.0',
  lastReviewed: '2026-08-22',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 5083'),
    getStandard('RFC 5652'),
    getStandard('RFC 8551'),
    getStandard('RFC 9629'),
    getStandard('RFC 9690'),
    getStandard('RFC 9708'),
    getStandard('RFC 9882'),
    getStandard('RFC-9935'),
    getStandard('RFC-9936'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    classicalSigAlg: 'ECDSA-P256',
    kemCtSize: '1,088 bytes',
  },
}
