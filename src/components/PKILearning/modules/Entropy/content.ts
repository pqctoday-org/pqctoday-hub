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
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('NIST SP 800-90'),
    getStandard('NIST SP 800-90A'),
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
      'NIST SP 800-90A Rev. 1 and Rev. 2 (DRBG Mechanisms). NIST SP 800-90B (Entropy Source Validation). NIST SP 800-90C (RBG Constructions). NIST SP 800-131A Rev. 3 (Security Strength Requirements). FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) seed requirements. NIST ESV Program (Entropy Source Validation under CMVP)',
  },
}
