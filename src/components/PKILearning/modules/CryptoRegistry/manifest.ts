// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'crypto-registry',
  whyThisMatters:
    'Every discovery tool names the same mechanism differently; the registry is the shared vocabulary that makes a CBOM — or any crypto inventory — queryable across tools.',
  learnSections: [
    { id: 'registry-why', label: 'Why a Registry' },
    { id: 'registry-scope', label: "What's Inside" },
    { id: 'registry-pqc', label: 'PQC Coverage' },
    { id: 'registry-independent', label: 'Beyond CBOM' },
    { id: 'registry-practice', label: 'Using It in Practice' },
  ],
  workshopSteps: [
    { id: 'algorithm-normalizer', label: 'Algorithm Name Normalizer' },
    { id: 'curve-lookup', label: 'Curve Identifier Lookup' },
  ],
  startHere: {
    step: 'algorithm-normalizer',
    text: 'Paste a messy identifier such as CKM_ECDSA_SHA256 into the Algorithm Name Normalizer: it resolves the HSM, JWT or scanner name to its one canonical family.',
  },
  // Sim-embeddable since 2026-09-28 (user decision D1): a P2 tree step.
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoRegistryModule })),
}

export default resolveManifest(manifest)
