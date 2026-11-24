// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'stateful-signatures',
  whyThisMatters:
    'LMS/XMSS require tracking signing state correctly, forever — reuse a one-time key by accident and forgery becomes feasible, so the key must be treated as compromised and retired.',
  learnSections: [
    { id: 'lms', label: 'Stateful Sigs Overview' },
    { id: 'xmss', label: 'LMS/HSS & XMSS/XMSS^MT' },
    { id: 'state', label: 'The State Problem' },
  ],
  workshopSteps: [
    { id: 'lms-keygen', label: 'LMS Key Generation' },
    { id: 'xmss-keygen', label: 'XMSS Key Generation' },
    { id: 'state-management', label: 'State Management' },
    { id: 'slh-dsa-live', label: 'SLH-DSA Live Demo' },
    { id: 'threshold-signing', label: 'Threshold Signing' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'lms-keygen',
    text: 'Pick an LMS parameter set in LMS Key Generation: the Merkle tree structure, key sizes and signing capacity for that tree height are drawn, and with Live WASM mode on you can generate the key and sign.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.StatefulSignaturesModule })),
}

export default resolveManifest(manifest)
