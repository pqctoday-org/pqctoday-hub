// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'secure-boot-pqc',
  contentVersion: 5,
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'boot-chain-analyzer',
    text: 'Expand any key in the UEFI hierarchy (PK, KEK, db) and press Analyze PQC Requirements: each key gets a risk level, finding and PQC action, plus the db storage impact of ML-DSA-65 certificates.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM', 'SLH-DSA'],
    standards: ['NIST SP 800-161r1', 'FIPS 186-5', 'NIST SP 800-208', 'NSA CNSA 2.0', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SecureBootPQCModule })),
}

export default manifest
