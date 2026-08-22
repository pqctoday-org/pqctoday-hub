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
  lastReviewed: '2026-08-22',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 8446'),
    getStandard('NIST SP 800-227'),
    getStandard('draft-sheffer-tls-pqc-continuity'),
    // DECLARED 2026-08-22. narratives.mtcProofSize states 736 bytes typical and a
    // 384-1024 B range; all three figures come from this draft's sizing discussion
    // (§6.4): 12 hashes / 384 B for standalone subtrees of ~2,500 certificates,
    // 23 hashes / 736 B for landmark-relative subtrees of ~4,400,000, and "32
    // hashes, or 1024 bytes, is sufficient for subtrees of up to 2^32". The numbers
    // were right; nothing in the module said where they came from.
    getStandard('draft-ietf-plants-merkle-tree-certs'),
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
