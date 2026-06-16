// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'secrets-management-pqc',
  lm_id: 'LM-022',
  title: 'Secrets Management & PQC',
  description:
    'Master PQC migration for secrets managers: classify secrets by HNDL risk, simulate Vault transit with ML-KEM, design rotation policies, and integrate PQC-safe secrets into Kubernetes and CI/CD pipelines.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 0,
  learnSections: [
    { id: 'secrets-vs-keys', label: 'Secrets vs Keys: What Needs PQC Protection' },
    { id: 'hndl-risk', label: 'HNDL Risk for Secrets in Transit and at Rest' },
    { id: 'automated-rotation', label: 'Automated Rotation with PQC Keys' },
    { id: 'provider-roadmaps', label: 'AWS / Azure / GCP / Vault PQC Roadmaps' },
    { id: 'kubernetes-cicd', label: 'Kubernetes, CI/CD, and Zero-Trust Secrets' },
  ],
  workshopSteps: [
    { id: 'secrets-architecture-mapper', label: 'Architecture Mapper' },
    { id: 'vault-pqc-simulator', label: 'Vault Transit Simulator' },
    { id: 'rotation-policy-designer', label: 'Rotation Policy Designer' },
    { id: 'cloud-secrets-comparator', label: 'Cloud Provider Comparator' },
    { id: 'pipeline-integration-lab', label: 'Pipeline Integration Lab' },
  ],
  load: () => import('./index').then((m) => ({ default: m.SecretsManagementPQCModule })),
}

export default manifest
