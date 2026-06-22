// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-business-case',
  lm_id: 'LM-036',
  title: 'PQC Business Case',
  description:
    'Build ROI models, simulate breach costs, and create board-ready pitch decks for PQC investment.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Executive',
  trackOrder: 2,
  learnSections: [
    { id: 'roi', label: 'Why PQC Investment & Cost Categories' },
    { id: 'board', label: 'Workshop & Resources' },
  ],
  workshopSteps: [
    { id: 'roi-calculator', label: 'ROI Calculator' },
    { id: 'breach-simulator', label: 'Breach Scenario Simulator' },
    { id: 'board-pitch', label: 'Board Pitch Builder' },
    { id: 'cost-of-inaction', label: 'Cost of Inaction' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCBusinessCaseModule })),
}

export default manifest
