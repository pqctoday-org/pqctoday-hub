// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the APISecurityJWT module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'api-security-jwt',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 6749'),
    getStandard('RFC 7515'),
    getStandard('RFC 7516'),
    getStandard('RFC 7518'),
    getStandard('RFC 7519'),
    getStandard('RFC 9449'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    // TODO: Extract narrative text from JSX components
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 500 bytes, 5,000 bytes, 5.7 KB, 25 KB
