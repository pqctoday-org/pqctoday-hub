// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'secure-boot-pqc',
  contentVersion: 2,
  lm_id: 'LM-018',
  title: 'Secure Boot & Firmware PQC',
  description:
    'Migrate UEFI Secure Boot and firmware signing to quantum-safe cryptography. Covers the PK/KEK/db key hierarchy, TPM 2.0 attestation, ML-DSA firmware signing, DICE hardware roots of trust, and firmware vendor PQC roadmaps.',
  whyThisMatters:
    "Secure Boot is the root of the whole chain of trust — a quantum-broken PK/KEK/db hierarchy doesn't just compromise one signature, it compromises every attestation built on top of it.",
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 0,
  learnSections: [
    {
      id: 'secure-boot-fundamentals',
      label: 'UEFI Key Hierarchy',
    },
    { id: 'firmware-signing', label: 'Firmware PQC Migration' },
    { id: 'tpm-attestation', label: 'TPM 2.0 Attestation' },
    { id: 'vendor-roadmaps', label: 'Firmware Vendor Roadmaps' },
  ],
  workshopSteps: [
    { id: 'boot-chain-analyzer', label: 'Secure Boot Chain Analyzer' },
    { id: 'firmware-signing', label: 'Firmware Signing Migrator' },
    { id: 'tpm-hierarchy', label: 'TPM Key Hierarchy Explorer' },
    { id: 'vendor-matrix', label: 'Firmware Vendor Matrix' },
    { id: 'attestation-designer', label: 'Attestation Flow Designer' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SecureBootPQCModule })),
}

export default manifest
