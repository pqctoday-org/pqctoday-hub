// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'confidential-computing',
  whyThisMatters:
    "TEEs and PQC solve different problems — remote attestation, not confidentiality-at-rest — but a compromised TEE root of trust and a broken classical signature fail the same way: silently, until it's too late.",
  learnSections: [
    { id: 'tee-fundamentals', label: 'TEE Fundamentals' },
    { id: 'vendor-architectures', label: 'TEE Vendor Architectures' },
    { id: 'attestation', label: 'Remote Attestation' },
    { id: 'memory-encryption', label: 'Memory Encryption' },
    { id: 'tee-hsm', label: 'TEE-HSM Communication' },
    { id: 'quantum-threats', label: 'Quantum Threats to TEEs' },
  ],
  workshopSteps: [
    { id: 'tee-architecture-explorer', label: 'TEE Architecture Explorer' },
    { id: 'attestation-workshop', label: 'Attestation Workshop' },
    { id: 'encryption-mechanisms', label: 'Encryption Mechanisms' },
    { id: 'tee-hsm-channel', label: 'TEE-HSM Trusted Channel' },
    { id: 'quantum-threat-migration', label: 'Quantum Threat Migration' },
  ],
  startHere: {
    step: 'tee-hsm-channel',
    text: 'Design the TEE-HSM Trusted Channel in step 4: mutual attestation between enclave and HSM, then PQC key provisioning across it.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ConfidentialComputingModule })),
}

export default manifest
