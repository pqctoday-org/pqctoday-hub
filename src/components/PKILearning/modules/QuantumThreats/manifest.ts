// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'quantum-threats',
  contentVersion: 30,
  lm_id: 'LM-002',
  title: 'Quantum Threats',
  description:
    "Understand how Shor's algorithm threatens factoring and discrete-log cryptography, how quantum search affects symmetric-key margins, and how HNDL/HNFL risks are modeled.",
  duration: '40 min',
  whyThisMatters:
    'Understanding which cryptographic operations depend on quantum-vulnerable math—and the limits of current resource estimates—supports better migration planning.',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 2,
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
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['Falcon', 'HQC', 'ML-DSA', 'ML-KEM'],
    standards: ['NSM-10', 'FIPS 186-5', 'NSA CNSA 2.0', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QuantumThreatsModule })),
}

export default manifest
