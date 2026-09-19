// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'confidential-computing',
  contentVersion: 4,
  lm_id: 'LM-019',
  title: 'Confidential Computing & TEEs',
  description:
    'Explore TEE architectures (SGX, TDX, CCA, SEV-SNP, Nitro), remote attestation, memory encryption, TEE-HSM integration, and quantum threat analysis.',
  whyThisMatters:
    "TEEs and PQC solve different problems — remote attestation, not confidentiality-at-rest — but a compromised TEE root of trust and a broken classical signature fail the same way: silently, until it's too late.",
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 1,
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
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['ETSI TS 103 744', 'NIST SP 800-227', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ConfidentialComputingModule })),
}

export default manifest
