// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'secure-boot-pqc',
  whyThisMatters:
    "Secure Boot is the root of the whole chain of trust — a quantum-broken PK/KEK/db hierarchy doesn't just compromise one signature, it compromises every attestation built on top of it.",
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
    { id: 'boot-verify-latency', label: 'Boot Verify Latency' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'boot-chain-analyzer',
    text: 'Expand any key in the UEFI hierarchy (PK, KEK, db) and press Analyze PQC Requirements: each key gets a risk level, finding and PQC action, plus the db storage impact of ML-DSA-65 certificates.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SecureBootPQCModule })),
}

export default manifest
