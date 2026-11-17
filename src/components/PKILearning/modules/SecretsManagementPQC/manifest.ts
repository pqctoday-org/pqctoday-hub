// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'secrets-management-pqc',
  contentVersion: 19,
  lm_id: 'LM-022',
  title: 'Secrets Management & PQC',
  description:
    'Evaluate PQC migration for secrets managers: classify exposure, compare Vault transit operations with an executable application-side ML-KEM envelope, design rotation policies, and assess Kubernetes and CI/CD integration capabilities.',
  whyThisMatters:
    'Rotation, retention and cryptographic protection solve different problems. Assess which captured data could remain valuable, whether its key establishment is quantum-vulnerable, and how long changing the protecting systems will take.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 0,
  learnSections: [
    { id: 'secrets-vs-keys', label: 'Secrets vs Keys' },
    { id: 'hndl-risk', label: 'HNDL Transit & At Rest' },
    { id: 'automated-rotation', label: 'Automated PQC Rotation' },
    { id: 'provider-roadmaps', label: 'Cloud Provider Roadmaps' },
    { id: 'kubernetes-cicd', label: 'Kubernetes & Zero-Trust' },
  ],
  workshopSteps: [
    { id: 'secrets-architecture-mapper', label: 'Architecture Mapper' },
    { id: 'vault-pqc-simulator', label: 'Vault Transit Simulator' },
    { id: 'rotation-policy-designer', label: 'Rotation Policy Designer' },
    { id: 'cloud-secrets-comparator', label: 'Cloud Provider Comparator' },
    { id: 'pipeline-integration-lab', label: 'Pipeline Integration Lab' },
  ],
  startHere: {
    step: 'rotation-policy-designer',
    text: 'Design a PQC-aware rotation policy in step 3: each secret type gets a recommended TTL based on its risk level and HNDL exposure.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['RFC 9180', 'NIST SP 800-57', 'NIST SP 800-227', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SecretsManagementPQCModule })),
}

export default manifest
