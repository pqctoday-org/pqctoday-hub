// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-agility',
  contentVersion: 5,
  lm_id: 'LM-007',
  title: 'Crypto Agility',
  description:
    'Design crypto-agile architectures: abstraction layers, CBOM scanning, and the 7-phase migration framework.',
  duration: '40 min',
  whyThisMatters:
    'The one certainty is that algorithms will change again; agility is what lets you swap them without re-architecting every system.',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Strategy',
  trackOrder: 3,
  learnSections: [
    { id: 'abstraction', label: 'Crypto Abstraction Layers' },
    { id: 'cbom', label: 'CBOM' },
    { id: 'migration', label: '7-Phase Migration' },
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
    text: 'Toggle between the RSA-2048, ML-KEM-768 and X25519MLKEM768 backends in the Abstraction Layer demo: the application code never changes while the backend config flips to quantum-safe.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['RFC 9370', 'FIPS 186-5', 'RFC 9846', 'NIST SP 800-208', 'NIST SP 800-227'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoAgilityModule })),
}

export default manifest
