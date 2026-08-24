// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'cbom',
  contentVersion: 3,
  lm_id: 'LM-060',
  title: 'Cryptography Bill of Materials (CBOM)',
  description:
    'Choose a CBOM format, discover all your cryptography — including the crypto nobody tracks — give each key its identity and provenance, and make the inventory machine-verifiable.',
  duration: '60 min',
  whyThisMatters:
    "You can't migrate crypto you can't see; a Cryptography Bill of Materials is the inventory every later phase depends on.",
  difficulty: 'intermediate',
  frameworkPhase: 'p2',
  track: 'Strategy',
  trackOrder: 6,
  learnSections: [
    { id: 'cbom-why', label: 'Why a CBOM' },
    { id: 'cbom-formats', label: 'CycloneDX vs SPDX' },
    { id: 'cbom-discovery', label: 'Layered Crypto Discovery' },
    { id: 'cbom-context', label: 'Key Identity & Provenance' },
    { id: 'cbom-codify', label: 'Codifying Crypto' },
    { id: 'cbom-verify', label: 'Machine-Verifiable CBOM' },
  ],
  workshopSteps: [
    { id: 'source-coverage-mapper', label: 'Source Coverage Mapper' },
    { id: 'format-chooser', label: 'Format Chooser' },
    { id: 'cbom-verify', label: 'Policy-as-Code Verify' },
    { id: 'key-correlator', label: 'Key Correlator' },
  ],
  embeddable: true,
  practiceInSim: true,
  taxonomy: {
    standards: ['CycloneDX / ECMA-424', 'SPDX / ISO 5962', 'NIST SP 1800-38'],
  },
  load: () => import('./index').then((m) => ({ default: m.CbomModule })),
}

export default manifest
