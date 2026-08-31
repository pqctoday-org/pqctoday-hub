// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-101',
  contentVersion: 4,
  lm_id: 'LM-001',
  title: 'PQC 101',
  description:
    'Start here! A beginner-friendly introduction to the quantum threat and post-quantum cryptography.',
  duration: '10 min',
  whyThisMatters:
    'The quantum threat isn\'t hypothetical: "harvest now, decrypt later" means data you send today can be unlocked the day a quantum computer arrives. This is the ground floor.',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 1,
  learnSections: [
    { id: 'quantum-threat', label: 'Quantum Threat' },
    { id: 'algorithms', label: 'PQC Algorithms' },
    { id: 'timeline', label: 'Global Migration Timeline' },
    { id: 'readiness', label: 'Organizational Readiness' },
    { id: 'next-steps', label: 'Your Next Steps' },
  ],
  workshopSteps: [
    { id: 'algorithm-families', label: 'Algorithm Families' },
    { id: 'algorithm-comparison', label: 'Algorithm Comparison' },
    { id: 'key-generation', label: 'Key Generation' },
    { id: 'signature-demo', label: 'Signature Demo' },
  ],
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.Module1 })),
}

export default manifest
