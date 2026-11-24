// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'media-drm-pqc',
  whyThisMatters:
    'Content-protection and provenance specifications use ECDSA, RSA and Diffie-Hellman for signatures and key exchange, and the editions this module reads do not mention quantum computing. The useful skill is reading each link precisely: which primitive it uses, which NIST table lists that kind of primitive, and who can change or revoke something on it.',
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
  load: () => import('./index').then((m) => ({ default: m.MediaDrmPQCModule })),
}

export default resolveManifest(manifest)
