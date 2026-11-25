// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'cloud-pqc',
  whyThisMatters:
    'Cloud providers manage underlying hardware, but customers still control TLS policies, origin legs, KMS key specs, BYOK wrapping paths, and SaaS federation boundaries — misreading that split causes silent downgrades or false compliance claims.',
  learnSections: [
    { id: 'shared-responsibility', label: 'Shared Responsibility & Assets' },
    { id: 'edge-and-tls', label: 'Edge, CDN & Origin TLS' },
    { id: 'kms-byok-storage', label: 'Cloud KMS, BYOK & Storage' },
    { id: 'saas-and-governance', label: 'SaaS, Federation & Evidence' },
  ],
  workshopSteps: [
    { id: 'estate-mapper', label: 'Cloud Estate Mapper' },
    { id: 'provider-capabilities', label: 'Provider Capability Matrix' },
    { id: 'edge-tls-kms-plan', label: 'Edge TLS & KMS Cutover Lab' },
    { id: 'saas-boundary-check', label: 'SaaS Boundary Checklist' },
  ],
  startHere: {
    step: 'estate-mapper',
    text: 'Map a multi-cloud workload in the Cloud Estate Mapper to separate customer-controlled crypto surfaces from provider-managed layers and distinguish cloud services from protected assets.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CloudPqcModule })),
}

export default manifest
