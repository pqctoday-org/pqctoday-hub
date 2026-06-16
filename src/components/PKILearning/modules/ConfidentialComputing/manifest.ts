// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'confidential-computing',
  lm_id: 'LM-019',
  title: 'Confidential Computing & TEEs',
  description:
    'Explore TEE architectures (SGX, TDX, CCA, SEV-SNP, Nitro), remote attestation, memory encryption, TEE-HSM integration, and quantum threat analysis.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 1,
  learnSections: [
    { id: 'tee-fundamentals', label: 'TEE Fundamentals & Threat Model' },
    { id: 'vendor-architectures', label: 'Vendor Architectures (SGX, TDX, CCA, SEV-SNP, Nitro)' },
    { id: 'attestation', label: 'Remote Attestation & Trust Chains' },
    { id: 'memory-encryption', label: 'Memory Encryption & Data-in-Use Protection' },
    { id: 'tee-hsm', label: 'TEE-HSM Trusted Communication' },
    { id: 'quantum-threats', label: 'Quantum Threats to Confidential Computing' },
  ],
  workshopSteps: [
    { id: 'tee-architecture-explorer', label: 'TEE Architecture Explorer' },
    { id: 'attestation-workshop', label: 'Attestation Workshop' },
    { id: 'encryption-mechanisms', label: 'Encryption Mechanisms' },
    { id: 'tee-hsm-channel', label: 'TEE-HSM Trusted Channel' },
    { id: 'quantum-threat-migration', label: 'Quantum Threat Migration' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ConfidentialComputingModule })),
}

export default manifest
