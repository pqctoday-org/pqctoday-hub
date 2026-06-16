// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-risk-management',
  lm_id: 'LM-034',
  title: 'PQC Risk Management',
  description:
    'Quantify quantum risk, build risk registers, model CRQC timeline scenarios, and generate risk heatmaps from real threat data.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p3',
  track: 'Executive',
  trackOrder: 0,
  learnSections: [
    { id: 'crqc', label: 'CRQC Timeline Modeling' },
    { id: 'register', label: 'Risk Register & Quantification' },
    { id: 'heatmap', label: 'Risk Heatmap & Prioritization' },
  ],
  workshopSteps: [
    { id: 'crqc-scenario-planner', label: 'CRQC Scenario Planner' },
    { id: 'risk-register-builder', label: 'Risk Register Builder' },
    { id: 'risk-heatmap', label: 'Risk Heatmap' },
    { id: 'compliance-gap-analysis', label: 'Compliance Gap Analysis' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCRiskManagementModule })),
}

export default manifest
