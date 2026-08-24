// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Entropy module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'entropy-randomness',
  version: '1.0.0',
  lastReviewed: '2026-08-23',
  // Added 2026-08-22: relatedStandards asserts a date or version for this document,
  // so nothing could check the claim without it (the prose calls it a draft, which is right — Rev 3 is Initial Public Draft). The list stays short enough
  // that accuracy_spotcheck.py's four-document stride still opens every entry.

  standards: [
    getStandard('NIST-SP-800-131A-Rev3'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'), // Repointed 2026-08-22: this declared the DEPRECATED row `NIST SP 800-90A`,
    // whose superseded_by names this one. A module pointing the accuracy check at a
    // retired row is worse than pointing it nowhere — the check runs, reads a
    // superseded document, and reports success.
    getStandard('NIST-SP-800-90A-R1'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('BSI-AIS-20-31'),
    getStandard('FIPS-180-4'),
    getStandard('NIST-SP-800-22-R1A'),
    getStandard('NIST-SP-800-90B'),
    getStandard('NIST-SP-800-90C'),
    getStandard('RFC 5869'),
  ],

  algorithms: [getAlgorithm('ML-KEM-1024')],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    keyConcepts:
      'Entropy fundamentals: Why entropy quality determines cryptographic strength; historical failures like the 2008 Debian OpenSSL bug (PID-only seeding produced only ~32,768 possible keys). NIST SP 800-90 family: SP 800-90A (DRBG mechanisms), SP 800-90B (entropy source validation), SP 800-90C (RBG constructions combining sources with DRBGs).',
    workshopSummary:
      'Random Byte Generation: Generate and compare random bytes from Web Crypto API and OpenSSL WASM. Entropy Testing: Run simplified SP 800-90B statistical tests on generated random data. ESV Validation Walkthrough: Step through the NIST Entropy Source Validation process (source description, noise model, raw samples, health tests, conditioning). QRNG Exploration: Compare pre-fetched quantum random data (ANU QRNG) with local TRNG output.',
    relatedStandards:
      'NIST SP 800-90A Rev. 1 and the Rev. 2 pre-draft (DRBG Mechanisms). NIST SP 800-90B (Entropy Source Validation). NIST SP 800-90C (RBG Constructions). NIST SP 800-131A Rev. 3 draft (Security Strength Requirements). FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) seed requirements. NIST ESV Program (Entropy Source Validation under CMVP)',
  },
}
