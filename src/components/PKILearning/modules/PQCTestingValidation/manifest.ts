// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-testing-validation',
  contentVersion: 7,
  lm_id: 'LM-014',
  title: 'PQC Network Testing & Validation',
  description:
    'Design and execute testing strategies for post-quantum cryptography deployments. Covers passive crypto discovery, active endpoint scanning, performance benchmarking, interoperability testing, TVLA side-channel assessment, and building a comprehensive PQC test program.',
  whyThisMatters:
    "An algorithm that passes NIST's test vectors can still fail in your actual deployment — passive discovery, endpoint scanning, and interoperability testing catch the gap between 'PQC-capable' and 'PQC-working'.",
  duration: '120 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Protocols',
  trackOrder: 0,
  learnSections: [
    { id: 'why-pqc-testing', label: 'PQC Testing Differences' },
    { id: 'passive-vs-active', label: 'Passive vs Active Scan' },
    { id: 'performance-testing-method', label: 'Performance Benchmarking' },
    { id: 'interop-testing', label: 'Interoperability & RFC' },
    { id: 'side-channel-tvla', label: 'TVLA Side-Channel Testing' },
    { id: 'fips-acvp', label: 'FIPS ACVP Validation' },
  ],
  workshopSteps: [
    { id: 'passive-discovery-lab', label: 'Passive Crypto Discovery Lab' },
    { id: 'active-pqc-scanner', label: 'Active PQC Server Scanner' },
    { id: 'performance-benchmark-designer', label: 'Performance Benchmark Designer' },
    { id: 'interop-test-matrix', label: 'Interoperability Test Matrix' },
    { id: 'tvla-leakage-analyzer', label: 'TVLA Leakage Analyzer' },
    { id: 'test-strategy-builder', label: 'Test Strategy Builder' },
    { id: 'acvp-validator', label: 'NIST ACVP Validation' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'passive-discovery-lab',
    text: 'Pick a network segment in the Passive Crypto Discovery Lab and classify each captured TLS, SSH or IKEv2 flow as Quantum-Safe, Hybrid PQC, Vulnerable or Unknown, then reveal the answer.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['RFC 9794', 'FIPS 186-5', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCTestingValidationModule })),
}

export default manifest
