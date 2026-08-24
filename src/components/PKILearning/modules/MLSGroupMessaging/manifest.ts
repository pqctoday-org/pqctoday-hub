// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'mls-group-messaging',
  contentVersion: 2,
  lm_id: 'LM-054',
  title: 'MLS — Group Messaging',
  description:
    'Messaging Layer Security (RFC 9420) with TreeKEM, HPKE, and a PKCS#11-backed openmls provider. Scales group key agreement to thousands while keeping signature keys in the HSM.',
  whyThisMatters:
    "Group messaging at Signal's pairwise-ratchet scale breaks down past roughly 100 members — MLS's TreeKEM is what makes forward secrecy and post-compromise security reach a group of thousands, and PQ MLS ciphersuites are already in IETF Working Group Last Call.",
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 8,
  learnSections: [
    { id: 'mls-overview', label: 'TreeKEM & HPKE (RFC 9420)' },
    { id: 'pq-mls', label: 'PQ Ciphersuites & Crypto' },
  ],
  workshopSteps: [
    { id: 'treekem', label: 'TreeKEM Ratchet Tree Visualizer' },
    { id: 'provider-arch', label: 'OpenMLS ↔ PKCS#11 Provider Architecture' },
  ],
  playgroundTool: 'mls-group-messaging',
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['JOSE'] },
  // reduced 5-tab set (no Exercises) — matches the original render
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'visual', label: 'Visual' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'references', label: 'References' },
    { value: 'tools', label: 'Tools & Products' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.MLSGroupMessagingModule })),
}

export default manifest
