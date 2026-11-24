// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'pqc-business-case',
  whyThisMatters:
    'Migration competes with everything else for budget; a quantified harvest-now-decrypt-later case is how PQC wins the funding.',
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'cost-model-explorer',
    text: 'Set systems in scope, IT budget, complexity and planning horizon with the sliders in the Cost Model Explorer: five costing methods price the same migration and the spread between them is shown.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCBusinessCaseModule })),
}

export default resolveManifest(manifest)
