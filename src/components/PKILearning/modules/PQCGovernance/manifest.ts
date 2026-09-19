// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-governance',
  contentVersion: 7,
  lm_id: 'LM-037',
  title: 'PQC Governance & Policy',
  description:
    'Create RACI matrices, draft PQC policies, and design KPI dashboards for board reporting.',
  duration: '30 min',
  whyThisMatters:
    "Without a policy naming owners, deadlines, and exceptions, migration stalls as everyone's job and no one's.",
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Executive',
  trackOrder: 3,
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
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['Falcon', 'HQC', 'ML-DSA', 'ML-KEM', 'SLH-DSA'],
    standards: ['NIST SP 800-53', 'OMB M-23-02', 'NIST CSWP 39', 'FIPS 186-5', 'NIST SP 800-208'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCGovernanceModule })),
}

export default manifest
