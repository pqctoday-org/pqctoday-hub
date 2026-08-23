// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-agility',
  contentVersion: 3,
  lm_id: 'LM-007',
  title: 'Crypto Agility',
  description:
    'Design crypto-agile architectures: abstraction layers, CBOM scanning, and the 7-phase migration framework.',
  duration: '40 min',
  whyThisMatters:
    'The one certainty is that algorithms will change again; agility is what lets you swap them without re-architecting every system.',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Strategy',
  trackOrder: 3,
  learnSections: [
    { id: 'abstraction', label: 'Crypto Abstraction Layers' },
    { id: 'cbom', label: 'CBOM' },
    { id: 'migration', label: '7-Phase Migration' },
  ],
  workshopSteps: [
    { id: 'abstraction-layer', label: 'Abstraction Layer' },
    { id: 'cbom-scanner', label: 'CBOM Scanner' },
    { id: 'migration-planning', label: 'Migration Planning' },
    { id: 'agility-assessment', label: 'Agility Readiness Assessment' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoAgilityModule })),
}

export default manifest
