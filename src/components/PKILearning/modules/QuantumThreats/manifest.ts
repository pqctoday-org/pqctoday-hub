// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'quantum-threats',
  lm_id: 'LM-002',
  title: 'Quantum Threats',
  description:
    "Understand how Shor's and Grover's algorithms break cryptography, CRQC timelines, and HNDL/HNFL attack mechanics.",
  duration: '40 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 2,
  learnSections: [
    { id: 'crqc', label: 'CRQC Timeline & Harvest Now Decrypt Later' },
    { id: 'hndl', label: 'HNDL/HNFL Risk Windows & Prioritization' },
    { id: 'security-levels', label: 'Post-Quantum Security Levels' },
  ],
  workshopSteps: [
    { id: 'security-levels', label: 'Security Level Degradation' },
    { id: 'vulnerability-matrix', label: 'Vulnerability Matrix' },
    { id: 'key-size-analyzer', label: 'Key Size Analyzer' },
    { id: 'hndl-timeline', label: 'HNDL Timeline' },
    { id: 'hnfl-timeline', label: 'HNFL Risk Calculator' },
  ],
  load: () => import('./index').then((m) => ({ default: m.QuantumThreatsModule })),
}

export default manifest
