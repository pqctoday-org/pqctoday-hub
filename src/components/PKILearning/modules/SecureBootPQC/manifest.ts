// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'secure-boot-pqc',
  lm_id: 'LM-018',
  title: 'Secure Boot & Firmware PQC',
  description:
    'Migrate UEFI Secure Boot and firmware signing to quantum-safe cryptography. Covers the PK/KEK/db key hierarchy, TPM 2.0 attestation, ML-DSA firmware signing, DICE hardware roots of trust, and firmware vendor PQC roadmaps.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 0,
  learnSections: [
    {
      id: 'secure-boot-fundamentals',
      label: 'UEFI Secure Boot: PK, KEK, db, and dbx Key Hierarchy',
    },
    { id: 'firmware-signing', label: 'Firmware Signing and PQC Migration' },
    { id: 'tpm-attestation', label: 'TPM 2.0 and Measured Boot Attestation' },
    { id: 'vendor-roadmaps', label: 'UEFI and Firmware Vendor PQC Roadmaps' },
  ],
  workshopSteps: [
    { id: 'boot-chain-analyzer', label: 'Secure Boot Chain Analyzer' },
    { id: 'firmware-signing', label: 'Firmware Signing Migrator' },
    { id: 'tpm-hierarchy', label: 'TPM Key Hierarchy Explorer' },
    { id: 'vendor-matrix', label: 'Firmware Vendor Matrix' },
    { id: 'attestation-designer', label: 'Attestation Flow Designer' },
  ],
  load: () => import('./index').then((m) => ({ default: m.SecureBootPQCModule })),
}

export default manifest
