// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'qkd',
  contentVersion: 4,
  lm_id: 'LM-017',
  title: 'Quantum Key Distribution',
  description:
    'Explore QKD fundamentals: BB84 protocol, classical post-processing, hybrid key derivation, global deployments, protocol integration, and HSM key derivation.',
  whyThisMatters:
    "QKD offers information-theoretic security guarantees PQC algorithms can't — but it needs dedicated hardware and has real deployment limits, which is exactly why understanding both, not choosing one, is the realistic path forward.",
  duration: '100 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 4,
  learnSections: [
    { id: 'bb84', label: 'BB84 Protocol' },
    { id: 'integration', label: 'QKD Protocol Integration' },
    { id: 'hsm-derivation', label: 'HSM QKD Key Derivation' },
    { id: 'deployment', label: 'QKD Global Deployments' },
  ],
  workshopSteps: [
    { id: 'bb84-simulator', label: 'BB84 Protocol' },
    { id: 'post-processing', label: 'Post-Processing' },
    { id: 'deployment-explorer', label: 'Global Deployments' },
    { id: 'protocol-integration', label: 'Protocol Integration' },
    { id: 'hsm-derivation', label: 'HSM Key Derivation' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QKDModule })),
}

export default manifest
