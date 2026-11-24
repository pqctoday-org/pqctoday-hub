// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'tls-basics',
  whyThisMatters:
    "TLS protects nearly all web traffic; the 1.3 handshake is the prerequisite for every hybrid-PQC rollout you'll plan.",
  // The legacy bespoke 'downgrade' tab is folded into the standard `visual` slot
  // (P3.1) so the tab *values* are catalog-standard; the label keeps its name.
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'visual', label: 'Downgrade Attack' },
    { value: 'exercises', label: 'Exercises' },
    { value: 'references', label: 'References' },
    { value: 'tools', label: 'Tools & Products' },
  ],
  learnSections: [
    { id: 'handshake', label: 'TLS 1.3 Handshake' },
    { id: 'certificates', label: 'PQC Certificate Chains' },
    { id: 'ciphers', label: 'Cipher Suites' },
    { id: 'pqc-tls', label: 'PQC in TLS & Hybrid Modes' },
  ],
  workshopSteps: [
    { id: 'simulate', label: 'TLS Handshake Simulation' },
    { id: 'config', label: 'Configure TLS Parameters' },
    { id: 'comparison', label: 'Cipher Suite Comparison' },
    { id: 'hsm-demo', label: 'HSM-Backed TLS Server' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'simulate',
    text: 'Set the client and server panels — identity certificates and key exchange groups — then press Start Full Interaction: the handshake runs and a summary plus the negotiated results appear below.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.TLSBasicsModule })),
}

export default resolveManifest(manifest)
