// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-candidates',
  contentVersion: 6,
  lm_id: 'LM-053',
  title: 'PQC Candidates & Lifecycle',
  description:
    'How NIST evaluates new post-quantum mechanisms, the nine third-round signature on-ramp candidates (NIST IR 8610, May 2026) across four math families, and the worldwide parallel tracks (KpqC, CACR, ISO/IEC).',
  duration: '55 min',
  whyThisMatters:
    "ML-KEM, ML-DSA, and SLH-DSA are the algorithms you'll actually deploy; choosing the wrong one means migrating twice.",
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 3,
  learnSections: [
    { id: 'rolling-process', label: 'Rolling Standardisation' },
    { id: 'validation', label: 'Candidate Validation' },
    { id: 'families', label: 'Four Math Families' },
    { id: 'worldwide', label: 'Worldwide Processes' },
    { id: 'whats-next', label: "What's Coming Next" },
  ],
  workshopSteps: [
    { id: 'lifecycle', label: 'Standardisation Lifecycle' },
    { id: 'family-math', label: 'Family Math Explainer' },
    { id: 'comparator', label: 'Candidate Comparator' },
    { id: 'cryptanalysis', label: 'Cryptanalysis Timeline' },
    { id: 'future-rounds', label: 'Future Rounds Forecaster' },
    { id: 'worldwide-map', label: 'Worldwide Standardisation Map' },
  ],
  startHere: {
    step: 'comparator',
    text: 'Sort and filter the nine candidates for one use case in the Candidate Comparator: it tells ML-KEM-768 apart from Classic McEliece by what each is for, not by name.',
  },
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'Falcon', 'HQC'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCCandidatesModule })),
}

export default manifest
