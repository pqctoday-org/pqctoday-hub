// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-algorithms',
  contentVersion: 1,
  lm_id: 'LM-088',
  title: 'The PQC Algorithms: How They Work and How to Choose',
  description:
    'How the standardised post-quantum algorithms work, read from the standards and guidance documents one sentence at a time: ML-KEM and ML-DSA in full, hash-based signatures in brief, and what named standards bodies say about choosing between them. The workshop runs ML-KEM and ML-DSA in the browser and compares sizes.',
  whyThisMatters:
    'Each new algorithm is defined in one document and used under others. This lesson shows each statement with the document, edition and place it comes from, so that a choice of algorithm can be traced to its source.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 3,
  learnSections: [
    { id: 'two-jobs-new-tools', label: 'Two jobs, new tools' },
    { id: 'the-families-at-a-glance', label: 'The families at a glance' },
    { id: 'ml-kem-fips-203', label: 'ML-KEM (FIPS 203)' },
    { id: 'ml-dsa-fips-204', label: 'ML-DSA (FIPS 204)' },
    { id: 'hash-based-signatures-in-brief', label: 'Hash-based signatures in brief' },
    {
      id: 'how-standards-bodies-map-use-cases-to-algorithms',
      label: 'How standards bodies map use cases to algorithms',
    },
    {
      id: 'common-pitfalls-noted-in-the-standards',
      label: 'Implementation considerations',
    },
  ],
  workshopSteps: [
    { id: 'ml-kem-round-trip', label: 'ML-KEM Round Trip' },
    { id: 'ml-dsa-sign-verify', label: 'ML-DSA Sign and Verify' },
    { id: 'size-comparator', label: 'Size Comparator' },
  ],
  startHere: {
    step: 'ml-kem-round-trip',
    text: 'Open ML-KEM Round Trip, generate a key pair, encapsulate and decapsulate, then change one byte of the ciphertext and decapsulate again.',
  },
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS/XMSS', 'HQC', 'Falcon', 'RSA', 'ECDSA'],
    standards: [
      'FIPS 203',
      'FIPS 204',
      'FIPS 205',
      'NIST SP 800-208',
      'NIST SP 800-227',
      'NIST IR 8547',
      'NSA CNSA 2.0',
      'RFC 10024',
    ],
  },
  load: () => import('./index').then((m) => ({ default: m.PQCAlgorithmsModule })),
}

export default manifest
