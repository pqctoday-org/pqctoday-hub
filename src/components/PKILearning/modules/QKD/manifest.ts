// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'qkd',
  whyThisMatters:
    "QKD offers information-theoretic security guarantees PQC algorithms can't — but it needs dedicated hardware and has real deployment limits, which is exactly why understanding both, not choosing one, is the realistic path forward.",
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'bb84-simulator',
    text: "Choose a qubit count, switch Eve on or off, and press Start Protocol: the qubit grid fills with Alice's, Bob's and Eve's bases, and the sifted key and QBER show whether the eavesdropper was detected.",
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QKDModule })),
}

export default manifest
