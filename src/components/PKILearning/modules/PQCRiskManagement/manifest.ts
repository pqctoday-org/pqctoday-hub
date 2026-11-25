// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-risk-management',
  whyThisMatters:
    'A CRQC arrival year is an uncertain planning assumption. A risk register and relative heatmap can compare documented scenarios; neither predicts arrival nor supplies measured threat probabilities.',
  learnSections: [
    { id: 'crqc', label: 'Why PQC Risk Management' },
    { id: 'register', label: 'Key Concepts' },
    { id: 'heatmap', label: 'Executive Perspective' },
  ],
  workshopSteps: [
    { id: 'crqc-scenario-planner', label: 'CRQC Scenario Planner' },
    { id: 'risk-register-builder', label: 'Risk Register Builder' },
    { id: 'risk-heatmap', label: 'Risk Heatmap' },
    { id: 'compliance-gap-analysis', label: 'Compliance Gap Analysis' },
  ],
  startHere: {
    step: 'risk-register-builder',
    text: 'Write one HNDL risk in the Risk Register Builder — asset, likelihood, impact, owner — then carry it into the heatmap in step 3 to assign its treatment.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCRiskManagementModule })),
}

export default manifest
