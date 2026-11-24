// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'secrets-management-pqc',
  whyThisMatters:
    'Rotation, retention and cryptographic protection solve different problems. Assess which captured data could remain valuable, whether its key establishment is quantum-vulnerable, and how long changing the protecting systems will take.',
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SecretsManagementPQCModule })),
}

export default resolveManifest(manifest)
