// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Stateful Signatures module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'stateful-signatures',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('FIPS 205'), // SLH-DSA (Step 4 live demo)
    getStandard('RFC 8554'), // LMS/HSS
    getStandard('RFC 8391'), // XMSS/XMSS^MT
    getStandard('NIST SP 800-208'), // Stateful HBS Recommendation,
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 204'),
    getStandard('NSA CNSA 2.0'),
    getStandard('RFC 9858'),
    getStandard('draft-ietf-pquip-hbs-state'),
  ],

  algorithms: [
    getAlgorithm('LMS-SHA256 (H20/W8)'),
    getAlgorithm('XMSS-SHA2_20'),
    getAlgorithm('SLH-DSA-SHA2-128s'), // For comparison
  ],

  deadlines: [
    {
      label: 'New software/firmware should support and prefer CNSA 2.0 algorithms',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    {
      label: 'All deployed NSS must use CNSA 2.0 signatures',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'Full quantum-resistant enforcement for all NSS',
      year: CNSA_2_0.fullEnforcement,
      source: 'CNSA 2.0',
    },
  ],

  narratives: {
    otsWarning:
      'A Winternitz OTS key can sign exactly one message. Reusing a one-time key is a complete break — the private key becomes recoverable from two signatures.',
    merkleExplain:
      'The Merkle tree root is the overall public key. Each leaf contains a one-time signature key pair.',
    stateManagement:
      'State must be persistent, atomic, and never cloned. Hardware Security Modules (HSMs) with non-volatile monotonic counters are the standard approach.',
    lmsVsXmss:
      'LMS is simpler with faster key generation — preferred by NSA CNSA 2.0. XMSS has stronger security proofs with forward security — preferred by BSI Germany.',
    w4Size: '2.5 KB',
    w8Size: '1.7 KB',
  },
}
