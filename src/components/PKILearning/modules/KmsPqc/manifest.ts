// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'kms-pqc',
  lm_id: 'LM-016',
  title: 'KMS & PQC Key Management',
  description:
    'PQC key management patterns: envelope encryption with ML-KEM, hybrid key wrapping, multi-provider rotation planning.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 3,
  learnSections: [
    { id: 'key-hierarchy', label: 'PQC Key Hierarchy Design' },
    { id: 'envelope', label: 'ML-KEM Envelope Encryption' },
    { id: 'hybrid-wrap', label: 'Hybrid Key Wrapping Patterns' },
    { id: 'rotation', label: 'Key Rotation Planning' },
    { id: 'kmip', label: 'KMIP Protocol & Cross-Provider Sync' },
  ],
  workshopSteps: [
    { id: 'key-hierarchy', label: 'Key Hierarchy' },
    { id: 'envelope-encryption', label: 'Envelope Encryption' },
    { id: 'hybrid-wrapping', label: 'Hybrid Wrapping' },
    { id: 'rotation-planner', label: 'Rotation Planner' },
    { id: 'kmip-explorer', label: 'KMIP Protocol Explorer' },
  ],
  playgroundTool: 'envelope-encrypt',
  taxonomy: { algorithms: ['ML-KEM'], standards: ['FIPS 203'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.KmsPqcModule })),
}

export default manifest
