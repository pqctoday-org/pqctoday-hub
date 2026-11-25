// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'mls-group-messaging',
  whyThisMatters:
    "MLS's TreeKEM provides forward secrecy and, conditionally, post-compromise security (once a committed fresh leaf key replaces the compromised one) for groups from two to thousands, and the draft PQ MLS cipher suites (draft-ietf-mls-pq-ciphersuites-07) have been sent to the IESG with a request for publication.",
  learnSections: [
    { id: 'mls-overview', label: 'TreeKEM & HPKE (RFC 9420)' },
    { id: 'pq-mls', label: 'PQ Ciphersuites & Crypto' },
  ],
  workshopSteps: [
    { id: 'treekem', label: 'TreeKEM Ratchet Tree Visualizer' },
    { id: 'provider-arch', label: 'OpenMLS ↔ PKCS#11 Provider Architecture' },
  ],
  startHere: {
    step: 'treekem',
    text: 'Alice and Bob start the group in the TreeKEM visualizer; add a third member and see which nodes on the direct path have to re-key.',
  },
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
