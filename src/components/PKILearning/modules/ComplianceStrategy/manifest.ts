// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'compliance-strategy',
  whyThisMatters:
    "PQC deadlines (CNSA 2.0, EO 14412, the EU PQC roadmap) sit beside general cyber-resilience duties (NIS2, DORA) that reach the same systems — a strategy built from live framework data, not last year's summary, is the difference between meeting a deadline and discovering it too late.",
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ComplianceStrategyModule })),
}

export default manifest
