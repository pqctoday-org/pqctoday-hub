// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-business-case',
  contentVersion: 4,
  lm_id: 'LM-036',
  title: 'PQC Business Case',
  description:
    'Build ROI models, simulate breach costs, and create board-ready pitch decks for PQC investment.',
  duration: '30 min',
  whyThisMatters:
    'Migration competes with everything else for budget; a quantified harvest-now-decrypt-later case is how PQC wins the funding.',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Executive',
  trackOrder: 2,
  learnSections: [
    { id: 'roi', label: 'Investment & Costs' },
    { id: 'board', label: 'Workshop & Resources' },
  ],
  workshopSteps: [
    { id: 'cost-model-explorer', label: 'Cost Model Explorer' },
    { id: 'roi-calculator', label: 'ROI Calculator' },
    { id: 'breach-simulator', label: 'Breach Scenario Simulator' },
    { id: 'cost-of-inaction', label: 'Cost of Inaction' },
    { id: 'board-pitch', label: 'Board Pitch Builder' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCBusinessCaseModule })),
}

export default manifest
