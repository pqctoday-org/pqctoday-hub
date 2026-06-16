// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'qkd',
  lm_id: 'LM-017',
  title: 'Quantum Key Distribution',
  description:
    'Explore QKD fundamentals: BB84 protocol, classical post-processing, hybrid key derivation, global deployments, protocol integration, and HSM key derivation.',
  duration: '100 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 4,
  learnSections: [
    { id: 'bb84', label: 'BB84 Protocol & Quantum Channel' },
    { id: 'integration', label: 'QKD + Classical Protocol Integration' },
    { id: 'hsm-derivation', label: 'HSM Key Derivation from QKD' },
    { id: 'deployment', label: 'Global QKD Deployments & Infrastructure' },
  ],
  workshopSteps: [
    { id: 'bb84-simulator', label: 'BB84 Protocol' },
    { id: 'post-processing', label: 'Post-Processing' },
    { id: 'deployment-explorer', label: 'Global Deployments' },
    { id: 'protocol-integration', label: 'Protocol Integration' },
    { id: 'hsm-derivation', label: 'HSM Key Derivation' },
  ],
  load: () => import('./index').then((m) => ({ default: m.QKDModule })),
}

export default manifest
