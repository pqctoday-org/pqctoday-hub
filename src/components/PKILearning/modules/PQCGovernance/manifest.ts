// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-governance',
  whyThisMatters:
    "Without a policy naming owners, deadlines, and exceptions, migration stalls as everyone's job and no one's.",
  learnSections: [
    { id: 'model', label: 'Governance & RACI' },
    { id: 'policy', label: 'Escalation & KPIs' },
    { id: 'kpi', label: 'Resources & Workshop' },
  ],
  workshopSteps: [
    { id: 'raci-builder', label: 'RACI Matrix' },
    { id: 'policy-generator', label: 'Policy Generator' },
    { id: 'kpi-dashboard', label: 'KPI Dashboard' },
    { id: 'escalation-framework', label: 'Escalation Framework' },
  ],
  startHere: {
    step: 'raci-builder',
    text: 'Fill the RACI Matrix for the ten migration activities across six roles: one Accountable per row, and the tool flags a row that has two.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCGovernanceModule })),
}

export default manifest
