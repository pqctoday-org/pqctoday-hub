// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the DigitalID module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'digital-id',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 203'), getStandard('FIPS 204'), getStandard('FIPS 205')],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('FN-DSA-512'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    classicalOidcSize: '300 bytes',
    pqcOidcSize: '4.7 KB',
    mlDsa65SigSize: '3,309 bytes',
    mlDsa65PubKeySize: '1,952 bytes',
    fnDsa512SigSize: '666 bytes',
  },
}
