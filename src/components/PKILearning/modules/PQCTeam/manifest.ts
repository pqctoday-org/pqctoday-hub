// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-team',
  lm_id: 'LM-056',
  title: 'Building Your PQC Team',
  description:
    'Staff the migration: core roles, a federated Crypto Champion network, Build-Borrow-Buy decisions, and a 1-per-500 team-sizing calculator.',
  duration: '20 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Executive',
  trackOrder: 7,
  learnSections: [
    { id: 'roles', label: 'Core Roles & the Crypto Champion Network' },
    { id: 'build-borrow-buy', label: 'Build-Borrow-Buy & Team Sizing' },
  ],
  workshopSteps: [{ id: 'team-sizing', label: 'Team Sizing Calculator' }],
  load: () => import('./index').then((m) => ({ default: m.PQCTeamModule })),
}

export default manifest
