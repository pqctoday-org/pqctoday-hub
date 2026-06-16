// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'compliance-strategy',
  lm_id: 'LM-035',
  title: 'Compliance & Regulatory Strategy',
  description:
    'Map multi-jurisdiction requirements, build audit checklists, and construct compliance timelines from live framework data.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Executive',
  trackOrder: 1,
  learnSections: [
    { id: 'frameworks', label: 'Compliance Landscape & Key Frameworks' },
    { id: 'jurisdiction', label: 'Compliance vs Risk Approach & Major Deadlines' },
    { id: 'audit', label: 'Country Deadlines, Dependencies & Workshop' },
  ],
  workshopSteps: [
    { id: 'jurisdiction-mapper', label: 'Jurisdiction Mapper' },
    { id: 'audit-readiness', label: 'Audit Readiness' },
    { id: 'compliance-timeline', label: 'Compliance Timeline' },
    { id: 'regulatory-gap-assessment', label: 'Regulatory Gap Assessment' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ComplianceStrategyModule })),
}

export default manifest
