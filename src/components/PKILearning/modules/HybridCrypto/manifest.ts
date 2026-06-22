// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'hybrid-crypto',
  lm_id: 'LM-006',
  title: 'Hybrid Cryptography',
  description:
    'Combine classical and PQC algorithms: hybrid KEMs, composite signatures, and side-by-side certificate comparison.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Strategy',
  trackOrder: 2,
  learnSections: [
    { id: 'why-hybrid', label: 'Why Hybrid Cryptography?' },
    { id: 'cert-formats', label: 'Hybrid Certificate Formats' },
    { id: 'kem', label: 'Hybrid KEM Construction' },
    { id: 'composite', label: 'Hybrid Signature Spectrum' },
  ],
  workshopSteps: [
    { id: 'key-generation', label: 'Key Generation' },
    { id: 'encrypt-sign', label: 'Encrypt & Sign' },
    { id: 'ca-setup', label: 'CA Setup' },
    { id: 'hybrid-formats', label: 'Hybrid Formats' },
    { id: 'inspect-compare', label: 'Inspect & Compare' },
  ],
  playgroundTool: 'hybrid-certs',
  taxonomy: { algorithms: ['ML-KEM', 'X25519', 'ECDH'], standards: ['RFC 9180'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.HybridCryptoModule })),
}

export default manifest
