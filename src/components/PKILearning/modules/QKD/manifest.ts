// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'qkd',
  contentVersion: 7,
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'bb84-simulator',
    text: "Choose a qubit count, switch Eve on or off, and press Start Protocol: the qubit grid fills with Alice's, Bob's and Eve's bases, and the sifted key and QBER show whether the eavesdropper was detected.",
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM'],
    standards: ['RFC 9846', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QKDModule })),
}

export default manifest
