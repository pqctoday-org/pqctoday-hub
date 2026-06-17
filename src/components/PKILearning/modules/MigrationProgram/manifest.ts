// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'migration-program',
  lm_id: 'LM-039',
  title: 'Migration Program Mgmt',
  description:
    'Build migration roadmaps with real country deadlines, plan stakeholder communications, and track KPIs.',
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p4',
  track: 'Executive',
  trackOrder: 6,
  learnSections: [
    { id: 'roadmap', label: 'Program Overview & 7-Phase Framework' },
    { id: 'deployment', label: 'Critical Success Factors & Workshop' },
  ],
  workshopSteps: [
    { id: 'roadmap-builder', label: 'Roadmap Builder' },
    { id: 'stakeholder-comms', label: 'Stakeholder Comms' },
    { id: 'kpi-tracker', label: 'KPI Tracker' },
    { id: 'deployment-playbook', label: 'Deployment Playbook' },
  ],
  embeddable: true,
  practiceInSim: true,
  load: () => import('./index').then((m) => ({ default: m.MigrationProgramModule })),
}

export default manifest
