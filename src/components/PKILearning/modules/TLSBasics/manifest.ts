// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'tls-basics',
  contentVersion: 2,
  lm_id: 'LM-008',
  title: 'TLS Basics',
  description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
  duration: '40 min',
  whyThisMatters:
    "TLS protects nearly all web traffic; the 1.3 handshake is the prerequisite for every hybrid-PQC rollout you'll plan.",
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 5,
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
    { id: 'certificates', label: 'Certificate Trust Chains' },
    { id: 'ciphers', label: 'Cipher Suites' },
    { id: 'pqc-tls', label: 'PQC in TLS & Hybrid Modes' },
  ],
  workshopSteps: [
    { id: 'simulate', label: 'TLS Handshake Simulation' },
    { id: 'config', label: 'Configure TLS Parameters' },
    { id: 'comparison', label: 'Cipher Suite Comparison' },
    { id: 'hsm-demo', label: 'HSM-Backed TLS Server' },
  ],
  playgroundTool: 'tls-simulator',
  taxonomy: {
    algorithms: ['ML-KEM', 'X25519', 'ECDSA', 'ML-DSA'],
    // RFC 8446 is TLS 1.3 — the module's core standard. (Previously listed RFC 9180,
    // which is HPKE and not covered by this handshake/certificate/cipher-suite module.)
    standards: ['RFC 8446', 'X.509'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.TLSBasicsModule })),
}

export default manifest
