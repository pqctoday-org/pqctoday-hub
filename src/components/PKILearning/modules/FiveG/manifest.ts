// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: '5g-security',
  lm_id: 'LM-046',
  title: '5G Security',
  description: 'Explore 3GPP security architecture: SUCI Deconcealment, 5G-AKA, & Provisioning.',
  duration: '60 min',
  difficulty: 'advanced',
  workInProgress: true,
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 6,
  learnSections: [
    { id: 'suci', label: 'SUCI & Subscriber Identity Protection' },
    { id: 'aka', label: '5G-AKA Authentication Protocol' },
    { id: 'provisioning', label: 'SIM Key Provisioning & Supply Chain' },
  ],
  workshopSteps: [
    { id: 'suci', label: 'SUCI Deconcealment' },
    { id: 'auth', label: '5G-AKA Authentication' },
    { id: 'provisioning', label: 'SIM Key Provisioning' },
  ],
  playgroundTool: 'suci-flow',
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['X.509'] },
  load: () => import('./index').then((m) => ({ default: m.FiveGModule })),
}

export default manifest
