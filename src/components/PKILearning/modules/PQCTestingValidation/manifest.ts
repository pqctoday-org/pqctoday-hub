// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-testing-validation',
  contentVersion: 3,
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCTestingValidationModule })),
}

export default manifest
