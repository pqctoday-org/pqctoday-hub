// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'homomorphic-encryption',
  contentVersion: 9,
  lm_id: 'LM-076',
  title: 'Homomorphic Encryption (FHE)',
  description:
    'Learn what computing on encrypted data can and cannot protect, choose among BFV, BGV, CKKS and TFHE, reason about noise, depth and precision, and optionally follow the advanced HSM custody and assurance path.',
  whyThisMatters:
    'FHE can keep inputs and results encrypted while an evaluator computes, but it does not by itself provide result integrity, hide every form of metadata, or make decryption authorization safe. Scheme choice, parameters and key custody determine whether the design meets its real threat model.',
  duration: '105 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 2,
  learnSections: [
    { id: 'fhe-fundamentals', label: 'What FHE Is & What It Promises' },
    { id: 'fhe-schemes', label: 'Schemes, Data Types & Noisy Results' },
    { id: 'fhe-use-cases', label: 'Where FHE Is Used' },
    { id: 'fhe-cost', label: 'The Cost & How It Is Being Reduced' },
    { id: 'fhe-keys-operations', label: 'Keys, Operations & AES Data' },
    { id: 'fhe-quantum', label: 'FHE Against the Quantum Threat' },
    { id: 'fhe-standards', label: 'Standards & Compliance' },
    { id: 'fhe-implementations', label: 'Open-Source Implementations' },
    { id: 'fhe-hsm-custody', label: 'Advanced: HSM Custody & Assurance' },
  ],
  learnPaths: [
    {
      id: 'fhe-foundations',
      label: 'FHE foundations',
      entrySection: 'fhe-fundamentals',
      duration: '60 min',
      audience: 'Anyone evaluating, designing, implementing or operating an FHE workload',
      sections: [
        'fhe-fundamentals',
        'fhe-schemes',
        'fhe-use-cases',
        'fhe-cost',
        'fhe-keys-operations',
        'fhe-quantum',
        'fhe-standards',
        'fhe-implementations',
      ],
    },
    {
      id: 'hsm-custody',
      label: 'Advanced HSM custody',
      entrySection: 'fhe-fundamentals',
      duration: '105 min',
      audience:
        'Developers, architects, researchers, certification engineers and operators who need custody and assurance detail',
      personas: ['developer', 'architect', 'researcher', 'cert-engineer', 'ops'],
      sections: [
        'fhe-fundamentals',
        'fhe-schemes',
        'fhe-use-cases',
        'fhe-cost',
        'fhe-keys-operations',
        'fhe-quantum',
        'fhe-standards',
        'fhe-implementations',
        'fhe-hsm-custody',
      ],
    },
  ],
  offPathSections: 'hide',
  workshopSteps: [
    { id: 'fhe-concepts', label: 'FHE concepts lab' },
    { id: 'fhe-hsm-flows', label: 'Advanced HSM custody lab', paths: ['hsm-custody'] },
  ],
  referencePaths: {
    'IACR-ePrint-2024-116': ['hsm-custody'],
    'IACR-ePrint-2025-699': ['hsm-custody'],
  },
  // The catalogue currently has no reviewed FHE product records. Do not show
  // the generic empty Tools & Products tab or imply that a related Playground
  // tool exists; maintained open-source implementations live in Learn and
  // their pinned primary sources live in References.
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'visual', label: 'Visual' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'exercises', label: 'Exercises' },
    { value: 'references', label: 'References' },
  ],
  startHere: {
    step: 'fhe-concepts',
    text: 'Start with the noise budget: apply additions and multiplications, watch CKKS levels and TFHE noise change, and explain when bootstrapping is required.',
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
