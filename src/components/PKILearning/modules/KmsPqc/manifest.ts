// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'kms-pqc',
  contentVersion: 2,
  lm_id: 'LM-016',
  title: 'KMS & PQC Key Management',
  description:
    'PQC key management patterns: envelope encryption with ML-KEM, hybrid key wrapping, multi-provider rotation planning.',
  whyThisMatters:
    "The KMS is where every other system's keys live — get PQC key management wrong at this layer and you've broken envelope encryption for everything downstream, not just one application.",
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 3,
  learnSections: [
    { id: 'key-hierarchy', label: 'PQC Key Hierarchy Design' },
    { id: 'envelope', label: 'ML-KEM Envelope Encrypt' },
    { id: 'hybrid-wrap', label: 'Hybrid Key Wrapping' },
    { id: 'rotation', label: 'Key Rotation Planning' },
    { id: 'kmip', label: 'KMIP Cross-Provider Sync' },
    { id: 'cloud-responsibility', label: 'Cloud Shared Responsibility' },
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
