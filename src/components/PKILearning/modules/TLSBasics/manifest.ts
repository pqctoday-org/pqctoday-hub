// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'tls-basics',
  lm_id: 'LM-008',
  title: 'TLS Basics',
  description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 5,
  learnSections: [
    { id: 'handshake', label: 'TLS 1.3 Handshake Deep Dive' },
    { id: 'certificates', label: 'Certificate Chains & Trust Anchors' },
    { id: 'ciphers', label: 'Cipher Suites & Key Exchange' },
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
    standards: ['RFC 9180', 'X.509'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.TLSBasicsModule })),
}

export default manifest
