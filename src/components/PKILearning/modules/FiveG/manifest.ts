// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: '5g-security',
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
  learnSections: [
    { id: 'suci', label: 'SUCI Identity Protection' },
    { id: 'aka', label: '5G-AKA Authentication' },
    { id: 'provisioning', label: 'SIM Key Provisioning' },
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
