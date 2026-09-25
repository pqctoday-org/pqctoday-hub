// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'acvp-lab-workflow',
  contentVersion: 1,
  lm_id: 'LM-065',
  title: 'ACVP Lab Workflow: From Vector Set to Evidence',
  description:
    'How algorithm validation testing actually runs: CAVP versus CMVP, capability registration and vector sets, the prompt → response → disposition → validation lifecycle, ACVP test types, deterministic versus randomized algorithms, the limits of a PKCS#11 test adapter, negative testing, and how to state a result at exactly the evidence level it reached. Draft — awaiting validation-lab practitioner review.',
  whyThisMatters:
    'A passing test is only evidence for the exact operation, parameters, build and source it was run against. Laboratories, vendors and buyers who blur a public reference sample, an ACVTS-issued vector set and a validation certificate make claims no evidence supports.',
  duration: '90 min',
  difficulty: 'advanced',
  // Draft (ACVP validation remediation plan 2026-09-24, WS-I): must be reviewed
  // by a validation-lab practitioner before it is called a lab training
  // resource. See data/reviewStatus.ts for what flips when that happens.
  workInProgress: true,
  frameworkPhase: 'p6',
  track: 'Protocols',
  trackOrder: 10,
  learnSections: [
    { id: 'algorithm-vs-module', label: 'Algorithm vs Module Validation' },
    { id: 'capability-registration', label: 'Capability Registration & Vector Sets' },
    { id: 'prompt-response-lifecycle', label: 'Prompt → Response → Validation' },
    { id: 'test-types', label: 'AFT, VAL, MCT & Test Types' },
    { id: 'deterministic-randomized', label: 'Deterministic vs Randomized' },
    { id: 'pkcs11-adapter-boundaries', label: 'PKCS#11 Adapter Boundaries' },
    { id: 'negative-testing', label: 'Negative & Failure Testing' },
    { id: 'evidence-provenance', label: 'Evidence Provenance' },
    { id: 'cross-implementation-limits', label: 'Cross-Implementation Limits' },
    { id: 'contributing-tests', label: 'Contributing a Source-Backed Test' },
  ],
  workshopSteps: [
    { id: 'evidence-classifier', label: 'Evidence Classifier' },
    { id: 'vector-set-anatomy', label: 'Vector Set Anatomy' },
    { id: 'response-artifact-lab', label: 'Response Artifact Lab' },
  ],
  startHere: {
    step: 'evidence-classifier',
    text: 'Classify ten real-world test-log observations into the evidence classes, then see the highest claim each one supports and the overclaim it tempts you into.',
  },
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
    standards: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'FIPS 140-3', 'PKCS#11'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AcvpLabWorkflowModule })),
}

export default manifest
