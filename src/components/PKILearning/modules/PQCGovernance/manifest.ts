// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-governance',
  lm_id: 'LM-037',
  title: 'PQC Governance & Policy',
  description:
    'Create RACI matrices, draft PQC policies, and design KPI dashboards for board reporting.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Executive',
  trackOrder: 3,
  learnSections: [
    { id: 'model', label: 'Why Governance, RACI & Policy Hierarchy' },
    { id: 'policy', label: 'Governance Models, Escalation & KPIs' },
    { id: 'kpi', label: 'Resources & Workshop' },
  ],
  workshopSteps: [
    { id: 'raci-builder', label: 'RACI Matrix' },
    { id: 'policy-generator', label: 'Policy Generator' },
    { id: 'kpi-dashboard', label: 'KPI Dashboard' },
    { id: 'escalation-framework', label: 'Escalation Framework' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCGovernanceModule })),
}

export default manifest
