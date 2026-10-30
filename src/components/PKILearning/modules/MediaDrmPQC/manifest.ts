// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'media-drm-pqc',
  contentVersion: 2,
  lm_id: 'LM-077',
  title: 'Media, Entertainment & DRM PQC',
  description:
    'How content protection and content provenance use public-key cryptography, read from the editions themselves: the AACS key ladder, CI Plus broadcast conditional access, the MovieLabs ECP specification, streaming licenses and transport, and C2PA Content Credentials, set against what NIST IR 8547 says about the primitives they use.',
  whyThisMatters:
    'Content-protection and provenance specifications use ECDSA, RSA and Diffie-Hellman for signatures and key exchange, and the editions this module reads do not mention quantum computing. The useful skill is reading each link precisely: which primitive it uses, which NIST table lists that kind of primitive, and who can change or revoke something on it.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 8,
  learnSections: [
    { id: 'threat-model', label: 'Why Content Protection Differs' },
    { id: 'disc-keys', label: 'The AACS Key Ladder' },
    { id: 'broadcast-ci-plus', label: 'Broadcast: CI Plus' },
    { id: 'streaming-transport', label: 'Streaming: Transport and Licenses' },
    { id: 'provenance', label: 'Provenance: C2PA Content Credentials' },
    { id: 'migration-surface', label: 'What a Migration Would Touch' },
  ],
  workshopSteps: [
    { id: 'key-ladder-explorer', label: 'Key Ladder Explorer' },
    { id: 'spec-vs-quantum', label: 'Spec vs Quantum' },
    { id: 'provenance-algorithm-check', label: 'Provenance Algorithm Check' },
  ],
  startHere: {
    step: 'key-ladder-explorer',
    text: 'Open the Key Ladder Explorer, pick AACS or CI Plus, and see which rungs of the ladder use a public-key primitive and which use AES, DES or a hash.',
  },
  // Derived from the algorithm and standard ids this module's content.ts declares,
  // restricted to the ALGORITHM_TAXONOMY / STANDARD_TAXONOMY vocabularies. Re-derive
  // from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'ECDSA', 'ECDH', 'RSA'],
    standards: [
      'FIPS 203',
      'FIPS 204',
      'FIPS 205',
      'NIST IR 8547',
      'NIST SP 800-57',
      'RFC 10024',
      'RFC 3161',
    ],
  },
  load: () => import('./index').then((m) => ({ default: m.MediaDrmPQCModule })),
}

export default manifest
