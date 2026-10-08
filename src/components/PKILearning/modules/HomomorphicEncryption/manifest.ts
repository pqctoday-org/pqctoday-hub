// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'homomorphic-encryption',
  contentVersion: 2,
  lm_id: 'LM-076',
  title: 'Homomorphic Encryption (FHE) & HSM Key Custody',
  description:
    'Compute on encrypted data without trusting the hardware: the four ISO/IEC 28033 draft schemes, FHE keys and who runs each operation, FHE against the quantum threat, and how an HSM can hold the FHE secret key without becoming a decryption oracle.',
  whyThisMatters:
    'FHE needs no trusted hardware, but its keys still need a custodian: the secret key is small and precious, the public keys are huge, and an HSM that decrypts on request becomes an oracle that leaks the key.',
  duration: '45 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 2,
  learnSections: [
    { id: 'fhe-fundamentals', label: 'FHE vs TEEs & the ISO/IEC 28033 Schemes' },
    { id: 'fhe-keys-operations', label: 'Keys, Operations & AES Data' },
    { id: 'fhe-quantum', label: 'FHE Against the Quantum Threat' },
    { id: 'fhe-hsm-custody', label: 'The HSM as FHE Key Custodian' },
    { id: 'fhe-implementations', label: 'Open-Source Implementations' },
  ],
  workshopSteps: [{ id: 'fhe-hsm-flows', label: 'FHE + HSM Flows' }],
  startHere: {
    step: 'fhe-hsm-flows',
    text: 'Open the first scenario in the FHE + HSM Flows step: the data owner makes its FHE key in an HSM, encrypts locally, lets a third party compute on ciphertexts, then asks the HSM to decrypt under policy.',
  },
  // Derived from the algorithm and standard ids content.ts declares, restricted to
  // the researcher-filter vocabulary (moduleEnrichment). The FHE schemes and
  // ISO/IEC 28033 are not in that vocabulary.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['FIPS 203', 'FIPS 204'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.HomomorphicEncryptionModule })),
}

export default manifest
