// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the TLSBasics module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'tls-basics',
  version: '1.1.0',
  lastReviewed: '2026-07-08',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    // RFC 9846 (July 2026) is the current TLS 1.3 specification — its header reads
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446". In-module prose still cites
    // RFC 8446 sections where it discusses the original, which stays accurate.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('NIST SP 800-227'),
    getStandard('draft-sheffer-tls-pqc-continuity'),
  ],

  algorithms: [
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    mtuSize: '1,500 bytes',
    mlDsa65Size: '3,309 bytes',
    ecdsaSigSize: '72 bytes',
    mtcProofSize: '~736 bytes (typical; scales 384B-1024B with subtree size)',
    ctStandard: 'RFC 9162',
  },
}
