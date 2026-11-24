// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'quantum-threats',
  whyThisMatters:
    'Understanding which cryptographic operations depend on quantum-vulnerable math—and the limits of current resource estimates—supports better migration planning.',
  learnSections: [
    { id: 'crqc', label: 'CRQC Timeline & HNDL' },
    { id: 'hndl', label: 'HNDL Risk Prioritization' },
    { id: 'security-levels', label: 'Harvest Now, Forge Later' },
  ],
  workshopSteps: [
    { id: 'security-levels', label: 'Security Level Degradation' },
    { id: 'vulnerability-matrix', label: 'Vulnerability Matrix' },
    { id: 'key-size-analyzer', label: 'Key Size Analyzer' },
    { id: 'hndl-timeline', label: 'HNDL Timeline' },
    { id: 'hnfl-timeline', label: 'HNFL Risk Calculator' },
    { id: 'crqc-trajectory', label: 'Trajectory to Q-Day' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'security-levels',
    text: 'Pick an algorithm in Security Level Degradation: its classical and quantum security bits are drawn as two bars, with a CRQC-vulnerable, weakened or no known efficient attack verdict and the model-specific quantum resource estimates.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QuantumThreatsModule })),
}

export default resolveManifest(manifest)
