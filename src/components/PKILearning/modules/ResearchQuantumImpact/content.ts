// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the ResearchQuantumImpact module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'research-quantum-impact',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-10-16',

  // ORDER MATTERS — the accuracy spot-check samples this list by even stride and
  // reads only four. Sampled at 0,1,3,4: SP 800-208 (stateful hash-based signatures) and SP 800-90A
  // (DRBGs) are this module's distinctive subjects, and IR 8547 carries the
  // long-retention transition claims.
  standards: [
    getStandard('NIST SP 800-208'),
    // Repointed 2026-08-22: this declared the DEPRECATED row `NIST SP 800-90A`,
    // whose superseded_by names this one. A module pointing the accuracy check at a
    // retired row is worse than pointing it nowhere — the check runs, reads a
    // superseded document, and reports success.
    getStandard('NIST-SP-800-90A-R1'),
    getStandard('FIPS 203'),
    getStandard('NIST IR 8547'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NIST IR 8105'),
    getStandard('NIST IR 8309'),
    getStandard('NIST IR 8413'),
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // DECLARED 2026-08-23: this module names "SP 800-227" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST SP 800-227'),
    // DECLARED 2026-08-23: this module names "SP 800-90B" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-90B'),
    // DECLARED 2026-08-23: this module names "SP 800-90C" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-90C'),
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
      'Long-Lived Research Data Exposure (HNDL) — participant-linked genomic and biomedical data can need confidentiality for decades. On CRQC timing, the Global Risk Institute\'s Quantum Threat Timeline Report 2025 (a survey of 26 experts) finds a "very significant chance" of a CRQC within 10 years, with the experts divided, and within 15 years "a clear majority considers a CRQC at least as likely as not". Long-term signatures need a lifecycle (trusted timestamps, evidence records, certificate and revocation preservation, re-timestamping), not a single algorithm choice...',
    workshopSummary:
      'The workshop has 4 steps: Why It Matters (six research threat areas, each with a severity, timeframe and example scenario), What to Learn (eight skill gaps linked to related modules, grouped into four knowledge domains), How to Act (a phased immediate / 30-day / 90-day / 6-month action plan with quick wins and KPI targets), and a nine-item Research Readiness self-assessment that produces a weighted exposure score.',
    relatedStandards:
      'FIPS 203 (ML-KEM — Module-Lattice-Based Key-Encapsulation Mechanism). FIPS 204 (ML-DSA — Module-Lattice-Based Digital Signature Standard). FIPS 205 (SLH-DSA — Stateless Hash-Based Digital Signature Standard). NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes — LMS and XMSS). NIST SP 800-90A Rev. 1 (Recommendation for Random Number Generation Using DRBGs).',
  },
}
