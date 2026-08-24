// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-risk-management',
  contentVersion: 3,
  lm_id: 'LM-034',
  title: 'PQC Risk Management',
  description:
    'Quantify quantum risk, build risk registers, model CRQC timeline scenarios, and generate risk heatmaps from real threat data.',
  whyThisMatters:
    'A CRQC timeline estimate is inherently uncertain — risk registers and heatmaps built from real threat data let an organization set migration priority without waiting for a certainty that will never come.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p3',
  track: 'Executive',
  trackOrder: 0,
  learnSections: [
    { id: 'crqc', label: 'CRQC Timeline Modeling' },
    { id: 'register', label: 'Risk Register' },
    { id: 'heatmap', label: 'Risk Heatmap' },
  ],
  workshopSteps: [
    { id: 'crqc-scenario-planner', label: 'CRQC Scenario Planner' },
    { id: 'risk-register-builder', label: 'Risk Register Builder' },
    { id: 'risk-heatmap', label: 'Risk Heatmap' },
    { id: 'compliance-gap-analysis', label: 'Compliance Gap Analysis' },
  ],
  embeddable: true,
  practiceInSim: true,
  load: () => import('./index').then((m) => ({ default: m.PQCRiskManagementModule })),
}

export default manifest
