// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'compliance-strategy',
  contentVersion: 3,
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
  embeddable: true,
  practiceInSim: true,
  load: () => import('./index').then((m) => ({ default: m.ComplianceStrategyModule })),
}

export default manifest
