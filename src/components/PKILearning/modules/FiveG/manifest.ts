// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: '5g-security',
  whyThisMatters:
    "5G's SUCI concealment and 5G-AKA protect subscriber identity at the protocol level — if that concealment breaks under a quantum attack, every subscriber on the network is de-anonymized retroactively, not just future ones.",
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'suci',
    text: 'Enter a 15-digit SUPI, pick Profile A, B or C (PQC), then execute the steps one by one: the subscriber identity is concealed into a SUCI and finally decrypted again by the home network.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.FiveGModule })),
}

export default manifest
