// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'software-supply-chain-pqc',
  whyThisMatters:
    'A software update is trusted because of a signature, and the documents that govern signing differ: some specify post-quantum signatures, some are drafts, one registry marks them experimental, and some editions are silent. The useful skill is reading each link from its own document and knowing which role, threshold and verifier a change would have to go through.',
  learnSections: [
    { id: 'chain', label: 'The Chain, One Control per Link' },
    { id: 'status', label: 'Status Map: Signature Links' },
    { id: 'updates', label: 'Update Frameworks: TUF and Uptane' },
    { id: 'provenance', label: 'Provenance and Attestation' },
    { id: 'transition', label: 'Changing an Algorithm After Shipping' },
  ],
  workshopSteps: [
    { id: 'roles-and-thresholds', label: 'Roles and Thresholds' },
    { id: 'provenance-chain-check', label: 'Provenance Chain Check' },
    { id: 'transition-planner', label: 'Transition Planner' },
  ],
  startHere: {
    step: 'roles-and-thresholds',
    text: 'Open Roles and Thresholds, choose how many keys each update role has and how many an attacker holds, and see which roles the attacker can sign for on their own.',
  },
  load: () => import('./index').then((m) => ({ default: m.SoftwareSupplyChainPQCModule })),
}

export default resolveManifest(manifest)
