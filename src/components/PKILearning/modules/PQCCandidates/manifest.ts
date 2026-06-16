// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-candidates',
  lm_id: 'LM-053',
  title: 'PQC Candidates & Lifecycle',
  description:
    'How NIST evaluates new post-quantum mechanisms, the nine third-round signature on-ramp candidates across four math families, and the worldwide parallel tracks (KpqC, CACR, ISO/IEC).',
  duration: '55 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 3,
  learnSections: [
    { id: 'rolling-process', label: 'Standardisation is a Rolling Process' },
    { id: 'validation', label: 'How Candidates Are Validated' },
    { id: 'families', label: 'Four Math Families on the Table' },
    { id: 'worldwide', label: 'Worldwide Parallel Processes' },
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
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'Falcon', 'HQC'] },
  load: () => import('./index').then((m) => ({ default: m.PQCCandidatesModule })),
}

export default manifest
