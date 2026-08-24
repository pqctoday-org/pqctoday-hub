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
  lastEdited: '2026-08-23',

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
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('RFC 5754'),
    getStandard('draft-ietf-lamps-pq-composite-sigs-19'),
    // DECLARED 2026-08-23: this module names SP 800-208 as the stateful hash-based signature standard and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "SP 800-208" against a row filed as NIST SP 800-208.
    getStandard('NIST SP 800-208'),
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
