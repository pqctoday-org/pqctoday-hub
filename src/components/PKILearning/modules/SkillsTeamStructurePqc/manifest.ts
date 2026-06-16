// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'skills-team-structure',
  lm_id: 'LM-059',
  title: 'Skills & Team Structure',
  description:
    'Size and staff the PQC migration program: convert your cryptographic estate into an FTE estimate with the 1-FTE-per-500-instances heuristic, build a federated Crypto Champion roster, and track each champion’s readiness commitments.',
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Executive',
  trackOrder: 8,
  learnSections: [
    { id: 'team-sizing', label: 'Team Sizing: 1-FTE-per-500-Instances Heuristic' },
    { id: 'crypto-champions', label: 'Crypto Champion Roster & Readiness Commitments' },
  ],
  workshopSteps: [
    { id: 'team-sizing', label: 'Team Sizing Calculator' },
    { id: 'crypto-champions', label: 'Crypto Champion Roster' },
  ],
  load: () => import('./index').then((m) => ({ default: m.SkillsTeamStructureModule })),
}

export default manifest
