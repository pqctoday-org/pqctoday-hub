// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'crypto-agility',
  whyThisMatters:
    'The one certainty is that algorithms will change again; agility is what lets you swap them without re-architecting every system.',
  learnSections: [
    { id: 'abstraction', label: 'Crypto Abstraction Layers' },
    { id: 'cbom', label: 'CBOM' },
    { id: 'migration', label: '7-Phase Migration' },
    { id: 'systems-security-engineering', label: 'Systems Security Engineering' },
  ],
  workshopSteps: [
    { id: 'abstraction-layer', label: 'Abstraction Layer' },
    { id: 'cbom-scanner', label: 'CBOM Scanner' },
    { id: 'migration-planning', label: 'Migration Planning' },
    { id: 'agility-assessment', label: 'Agility Readiness Assessment' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'abstraction-layer',
    text: 'Toggle between the RSA-2048, ML-KEM-768 and X25519MLKEM768 backends in the Abstraction Layer demo: the call sites never change while the backend config flips to quantum-safe, and the key-size line shows what still has to change around them.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoAgilityModule })),
}

export default resolveManifest(manifest)
