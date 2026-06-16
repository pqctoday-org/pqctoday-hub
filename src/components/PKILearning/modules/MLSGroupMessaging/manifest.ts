// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'mls-group-messaging',
  lm_id: 'LM-054',
  title: 'MLS — Group Messaging',
  description:
    'Messaging Layer Security (RFC 9420) with TreeKEM, HPKE, and a PKCS#11-backed openmls provider. Scales group key agreement to thousands while keeping signature keys in the HSM.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 8,
  learnSections: [
    { id: 'mls-overview', label: 'TreeKEM, HPKE, Key Schedule (RFC 9420)' },
    { id: 'pq-mls', label: 'PQ ciphersuites & openmls_pqctoday_crypto provider' },
  ],
  workshopSteps: [
    { id: 'treekem', label: 'TreeKEM Ratchet Tree Visualizer' },
    { id: 'provider-arch', label: 'OpenMLS ↔ PKCS#11 Provider Architecture' },
  ],
  playgroundTool: 'mls-group-messaging',
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['JOSE'] },
  load: () => import('./index').then((m) => ({ default: m.MLSGroupMessagingModule })),
}

export default manifest
