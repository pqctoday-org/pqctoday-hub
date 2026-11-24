// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'migration-program',
  whyThisMatters:
    'Discovery, prioritization, rollout, validation: this is the operating model that turns a PQC mandate into shipped systems.',
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.MigrationProgramModule })),
}

export default resolveManifest(manifest)
