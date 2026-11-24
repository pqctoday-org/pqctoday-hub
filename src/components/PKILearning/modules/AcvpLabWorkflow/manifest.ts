// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'acvp-lab-workflow',
  whyThisMatters:
    'A passing test is only evidence for the exact operation, parameters, build and source it was run against. Laboratories, vendors and buyers who blur a public reference sample, an ACVTS-issued vector set and a validation certificate make claims no evidence supports.',
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AcvpLabWorkflowModule })),
}

export default resolveManifest(manifest)
