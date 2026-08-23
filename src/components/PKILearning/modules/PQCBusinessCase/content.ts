// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PQCBusinessCase module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-business-case',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  standards: [
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    // DECLARED 2026-08-23: this module states the EO 14412 deadlines to a reader
    // (key establishment 2030, digital signatures 2031) and cited no document for
    // them. audit_module_undeclared_citations.py could not see it — the row's
    // reference_id is EO-2026-06-22-Securing-the-Nation and the module writes
    // "Executive Order 14412", so the literal-id match never fired.
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('Cyentia IRIS 2025'),
    getStandard('FIPS-140-3'),
    getStandard('NIST CSWP 39'),
  ],

  algorithms: [
    // No algorithm references detected — add manually if needed
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      "The PQC Business Case module helps CISOs and executives build a compelling financial justification for post-quantum cryptography migration. It covers ROI calculation with weighted cost dimensions, breach scenario simulation comparing classical vs. quantum-enabled breach costs, and a structured board pitch builder that produces exportable executive presentations. All workshops integrate live data from the app's migration catalog, compliance frameworks, and assessment engine.",
    keyConcepts:
      'PQC Migration Cost Categories — four dimensions: migration costs (infrastructure layer upgrades), breach avoidance (quantum-enabled attack prevention), compliance penalties (regulatory fine avoidance), and operational/competitive advantages. ROI Calculation — weighted scorecard across 5 dimensions: migration cost by infrastructure (25%), breach avoidance savings (30%), compliance penalty avoidance (20%), operational efficiency (15%), competitive advantage (10%).',
    workshopSummary:
      'The workshop has 3 interactive steps: ROI Calculator — interactive scorecard with 5 weighted dimensions, auto-scored from migration catalog data; shows estimated migration cost, annual benefit, payback period, and 3-year ROI percentage. Breach Scenario Simulator — adjustable sliders for data records, regulatory fines, and HNDL years; compares classical vs. quantum breach costs with industry-specific baselines; generates key findings and cost-of-inaction analysis.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). Ponemon Institute Cost of a Data Breach methodology. FAIR (Factor Analysis of Information Risk)',
  },
}
