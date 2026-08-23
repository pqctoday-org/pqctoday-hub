// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: '5g-security',
  contentVersion: 3,
  lm_id: 'LM-046',
  title: '5G Security',
  description: 'Explore 3GPP security architecture: SUCI Deconcealment, 5G-AKA, & Provisioning.',
  whyThisMatters:
    "5G's SUCI concealment and 5G-AKA protect subscriber identity at the protocol level — if that concealment breaks under a quantum attack, every subscriber on the network is de-anonymized retroactively, not just future ones.",
  duration: '60 min',
  difficulty: 'advanced',
  workInProgress: true,
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 6,
  // learnSections CORRECTED 2026-07-30 to describe this module's actual
  // learn tab. The previous ids read like the module's workshop steps and
  // did not correspond to any rendered heading — which made the table of
  // contents, section progress and deep links all wrong together.
  learnSections: [
    { id: 'what-is-5g-security', label: 'What is 5G Security?' },
    { id: 'three-pillars', label: 'The Three Pillars of 5G Security' },
    { id: 'suci', label: 'SUCI Protection Schemes' },
    { id: 'aka', label: '5G-AKA Authentication' },
    { id: 'provisioning', label: 'SIM Provisioning & Supply Chain' },
    { id: 'quantum-threat', label: 'Post-Quantum Threat to 5G' },
  ],
  workshopSteps: [
    { id: 'suci', label: 'SUCI Deconcealment' },
    { id: 'auth', label: '5G-AKA Authentication' },
    { id: 'provisioning', label: 'SIM Key Provisioning' },
  ],
  playgroundTool: 'suci-flow',
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['X.509'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.FiveGModule })),
}

export default manifest
