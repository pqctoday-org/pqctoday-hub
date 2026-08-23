// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'secrets-management-pqc',
  contentVersion: 2,
  lm_id: 'LM-022',
  title: 'Secrets Management & PQC',
  description:
    'Master PQC migration for secrets managers: classify secrets by HNDL risk, simulate Vault transit with ML-KEM, design rotation policies, and integrate PQC-safe secrets into Kubernetes and CI/CD pipelines.',
  whyThisMatters:
    "A secret stored in Vault today with a 5-year rotation policy needs a PQC migration plan now, not when the rotation comes due — harvest-now-decrypt-later risk doesn't wait for your rotation schedule.",
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SecretsManagementPQCModule })),
}

export default manifest
