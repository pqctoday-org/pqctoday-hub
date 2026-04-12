// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the ResearchQuantumImpact module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'research-quantum-impact',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-208'),
    getStandard('NIST SP 800-90'),
  ],

  algorithms: [
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHAKE-256s'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'The Researcher Quantum Impact module addresses the unique cryptographic challenges faced by academic researchers, data scientists, and interdisciplinary scientists whose work involves long-lived sensitive datasets, collaborative data sharing, federated infrastructure, and emerging PQC research directions.',
    keyConcepts:
      'Long-Lived Research Data Exposure (HNDL) — genomic and biomedical data has confidentiality lifetimes of 75+ years (patient privacy, research embargoes, competitive advantage); clinical trial data under FDA 21 CFR Part 11 must be preserved for 15+ years post-study; 20-year grant archives with proprietary pre-publication findings; any data encrypted today with RSA-2048 or ECDH and stored for 10+ years is an HNDL target — a CRQC arriving in 2030–2035 can retroactively decrypt it; data classifica...',
    workshopSummary:
      'The workshop has 3 interactive steps: Threat Impact Explorer — six-panel research-context briefing: HNDL exposure calculator for research data (input: data type + confidentiality lifetime → output: HNDL risk tier and recommended algorithm), academic publishing integrity analysis (DOI signature lifetime vs.',
    relatedStandards:
      'FIPS 203 (ML-KEM — Module-Lattice-Based Key-Encapsulation Mechanism). FIPS 204 (ML-DSA — Module-Lattice-Based Digital Signature Standard). FIPS 205 (SLH-DSA — Stateless Hash-Based Digital Signature Standard). NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes — LMS and XMSS). NIST SP 800-90A Rev. 1 (Recommendation for Random Number Generation Using DRBGs).',
  },
}
