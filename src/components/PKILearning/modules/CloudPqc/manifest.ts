// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'cloud-pqc',
  contentVersion: 1,
  lm_id: 'LM-080',
  title: 'Cloud-Native & SaaS PQC Migration',
  description:
    'Map customer-controlled vs. provider-managed cryptography across AWS, Azure, GCP, and SaaS: hybrid edge/origin TLS, cloud KMS/BYOK boundaries, cutover failure modes, and vendor evidence scoping.',
  whyThisMatters:
    'Cloud providers manage underlying hardware, but customers still control TLS policies, origin legs, KMS key specs, BYOK wrapping paths, and SaaS federation boundaries — misreading that split causes silent downgrades or false compliance claims.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Software Infrastructure',
  trackOrder: 9,
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
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'X25519'],
    standards: [
      'FIPS 203',
      'FIPS 204',
      'FIPS 205',
      'NIST IR 8547',
      'RFC 10024',
      'RFC 9846',
      'OMB M-26-15',
      'FIPS 140-3',
      'RFC 9180',
    ],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CloudPqcModule })),
}

export default manifest
