// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'pqc-testing-validation',
  whyThisMatters:
    "An algorithm that passes NIST's test vectors can still fail in your actual deployment — passive discovery, endpoint scanning, and interoperability testing catch the gap between 'PQC-capable' and 'PQC-working'.",
  learnSections: [
    { id: 'why-pqc-testing', label: 'PQC Testing Differences' },
    { id: 'passive-vs-active', label: 'Passive vs Active Scan' },
    { id: 'performance-testing-method', label: 'Performance Benchmarking' },
    { id: 'interop-testing', label: 'Interoperability & RFC' },
    { id: 'side-channel-tvla', label: 'TVLA Side-Channel Testing' },
    { id: 'fips-acvp', label: 'FIPS 140-3 & ACVP Testing' },
    { id: 'system-integration', label: 'System Integration' },
    { id: 'static-analysis-discovery', label: 'Static Analysis in Discovery' },
  ],
  // The whole module is network and operations testing, except two parts a certification
  // engineer needs: side-channel (TVLA) assessment and FIPS 140-3 / ACVP testing. The
  // certification path keeps only those; the other path is the whole module.
  learnPaths: [
    {
      id: 'network-practitioner',
      label: 'Network practitioner',
      entrySection: 'why-pqc-testing',
      duration: '130 min',
      audience: 'Security and operations teams testing PQC in a live estate',
      sections: [
        'why-pqc-testing',
        'passive-vs-active',
        'performance-testing-method',
        'interop-testing',
        'side-channel-tvla',
        'fips-acvp',
        'system-integration',
        'static-analysis-discovery',
      ],
    },
    {
      id: 'certification-engineer',
      label: 'Certification engineer',
      entrySection: 'side-channel-tvla',
      duration: '40 min',
      audience: 'Accredited-lab testers and module vendors preparing validation evidence',
      sections: ['side-channel-tvla', 'fips-acvp'],
    },
  ],
  offPathSections: 'mark',
  workshopSteps: [
    {
      id: 'passive-discovery-lab',
      label: 'Passive Crypto Discovery Lab',
      paths: ['network-practitioner'],
    },
    {
      id: 'active-pqc-scanner',
      label: 'Active PQC Server Scanner',
      paths: ['network-practitioner'],
    },
    {
      id: 'performance-benchmark-designer',
      label: 'Performance Benchmark Designer',
      paths: ['network-practitioner'],
    },
    {
      id: 'interop-test-matrix',
      label: 'Interoperability Test Matrix',
      paths: ['network-practitioner'],
    },
    {
      id: 'tvla-leakage-analyzer',
      label: 'TVLA Leakage Analyzer',
      paths: ['network-practitioner', 'certification-engineer'],
    },
    {
      id: 'test-strategy-builder',
      label: 'Test Strategy Builder',
      paths: ['network-practitioner'],
    },
    {
      id: 'acvp-validator',
      label: 'ACVP Workflow & Validation Tests',
      paths: ['network-practitioner', 'certification-engineer'],
    },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'passive-discovery-lab',
    text: 'Pick a network segment in the Passive Crypto Discovery Lab and classify each captured TLS, SSH or IKEv2 flow as Quantum-Safe, Hybrid PQC, Vulnerable or Unknown, then reveal the answer.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCTestingValidationModule })),
}

export default resolveManifest(manifest)
