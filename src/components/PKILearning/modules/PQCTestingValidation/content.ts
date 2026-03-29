// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PQCTestingValidation module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'p-q-c-testing-validation',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 186-5'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 9794'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    // TODO: Extract narrative text from JSX components
  },
}
