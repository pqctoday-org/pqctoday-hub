// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'migration-program',
  contentVersion: 6,
  lm_id: 'LM-039',
  title: 'Migration Program Mgmt',
  description:
    'Build migration roadmaps with real country deadlines, plan stakeholder communications, and track KPIs.',
  duration: '30 min',
  whyThisMatters:
    'Discovery, prioritization, rollout, validation: this is the operating model that turns a PQC mandate into shipped systems.',
  difficulty: 'intermediate',
  frameworkPhase: 'p4',
  track: 'Executive',
  trackOrder: 6,
  learnSections: [
    { id: 'roadmap', label: 'Program Overview' },
    { id: 'deployment', label: 'Critical Success Factors' },
  ],
  workshopSteps: [
    { id: 'roadmap-builder', label: 'Roadmap Builder' },
    { id: 'stakeholder-comms', label: 'Stakeholder Comms' },
    { id: 'kpi-tracker', label: 'KPI Tracker' },
    { id: 'deployment-playbook', label: 'Deployment Playbook' },
  ],
  startHere: {
    step: 'roadmap-builder',
    text: 'Build the roadmap in step 1: your milestones on the two technical tracks and the governance spine, overlaid on the regulatory deadlines you do not control.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['RSA'],
    standards: ['EO 14306', 'OMB M-23-02', 'NIST CSWP 39', 'NSA CNSA 2.0', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.MigrationProgramModule })),
}

export default manifest
