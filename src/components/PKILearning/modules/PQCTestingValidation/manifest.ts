// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-testing-validation',
  lm_id: 'LM-014',
  title: 'PQC Network Testing & Validation',
  description:
    'Design and execute testing strategies for post-quantum cryptography deployments. Covers passive crypto discovery, active endpoint scanning, performance benchmarking, interoperability testing, TVLA side-channel assessment, and building a comprehensive PQC test program.',
  duration: '120 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Protocols',
  trackOrder: 0,
  learnSections: [
    { id: 'why-pqc-testing', label: 'Why PQC Testing Is Different' },
    { id: 'passive-vs-active', label: 'Passive Discovery vs Active Scanning' },
    { id: 'performance-testing-method', label: 'PQC Performance Benchmarking Methodology' },
    { id: 'interop-testing', label: 'Interoperability Testing & RFC 9794 Compliance' },
    { id: 'side-channel-tvla', label: 'Side-Channel Testing & TVLA for Lattice Crypto' },
    { id: 'fips-acvp', label: 'FIPS 140-3 & Algorithmic Validation (ACVP)' },
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
