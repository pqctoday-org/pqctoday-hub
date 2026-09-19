// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'compliance-strategy',
  contentVersion: 5,
  lm_id: 'LM-035',
  title: 'Compliance & Regulatory Strategy',
  description:
    'Map multi-jurisdiction requirements, build audit checklists, and construct compliance timelines from live framework data.',
  whyThisMatters:
    "Regulatory deadlines (CNSA 2.0, NIS2, DORA) are already law in some jurisdictions and proposed in others — a strategy built from live framework data, not last year's summary, is the difference between meeting a deadline and discovering it too late.",
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Executive',
  trackOrder: 1,
  learnSections: [
    { id: 'frameworks', label: 'Compliance Landscape' },
    { id: 'jurisdiction', label: 'Compliance vs Risk' },
    { id: 'audit', label: 'Deadlines & Dependencies' },
  ],
  workshopSteps: [
    { id: 'jurisdiction-mapper', label: 'Jurisdiction Mapper' },
    { id: 'audit-readiness', label: 'Audit Readiness' },
    { id: 'compliance-timeline', label: 'Compliance Timeline' },
    { id: 'regulatory-gap-assessment', label: 'Regulatory Gap Assessment' },
  ],
  startHere: {
    step: 'compliance-timeline',
    text: 'Overlay your migration milestones on the framework deadlines in the Compliance Timeline: the gap between dates you chose and dates you did not is the plan.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: [
      'ETSI TS 103 744',
      'NIST SP 800-161r1',
      'EO 14306',
      'NIST SP 800-90B',
      'OMB M-23-02',
    ],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ComplianceStrategyModule })),
}

export default manifest
