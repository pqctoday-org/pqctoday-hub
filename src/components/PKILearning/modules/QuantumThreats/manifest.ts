// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'quantum-threats',
  contentVersion: 3,
  lm_id: 'LM-002',
  title: 'Quantum Threats',
  description:
    "Understand how Shor's and Grover's algorithms break cryptography, CRQC timelines, and HNDL/HNFL attack mechanics.",
  duration: '40 min',
  whyThisMatters:
    'Knowing exactly which algorithms Shor and Grover break — and which survive — is what separates a real risk assessment from vendor hype.',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 2,
  learnSections: [
    { id: 'crqc', label: 'CRQC Timeline & HNDL' },
    { id: 'hndl', label: 'HNDL Risk Prioritization' },
    { id: 'security-levels', label: 'PQ Security Levels' },
  ],
  workshopSteps: [
    { id: 'security-levels', label: 'Security Level Degradation' },
    { id: 'vulnerability-matrix', label: 'Vulnerability Matrix' },
    { id: 'key-size-analyzer', label: 'Key Size Analyzer' },
    { id: 'hndl-timeline', label: 'HNDL Timeline' },
    { id: 'hnfl-timeline', label: 'HNFL Risk Calculator' },
    { id: 'crqc-trajectory', label: 'Trajectory to Q-Day' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QuantumThreatsModule })),
}

export default manifest
