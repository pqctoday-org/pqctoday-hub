// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-registry',
  contentVersion: 2,
  lm_id: 'LM-062',
  title: 'CycloneDX Cryptography Registry',
  description:
    'One canonical name per cryptographic mechanism — resolve the same algorithm or curve across HSM, certificate, protocol and library notations, and see exactly where PQC families fit.',
  duration: '30 min',
  whyThisMatters:
    'Every discovery tool names the same mechanism differently; the registry is the shared vocabulary that makes a CBOM — or any crypto inventory — queryable across tools.',
  difficulty: 'intermediate',
  frameworkPhase: 'p2',
  track: 'Strategy',
  trackOrder: 5,
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
  embeddable: false,
  practiceInSim: true,
  taxonomy: {
    standards: ['CycloneDX Cryptography Registry'],
  },
  load: () => import('./index').then((m) => ({ default: m.CryptoRegistryModule })),
}

export default manifest
