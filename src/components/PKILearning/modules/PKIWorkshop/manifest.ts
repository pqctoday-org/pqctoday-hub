// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pki-workshop',
  contentVersion: 2,
  lm_id: 'LM-020',
  title: 'PKI',
  description:
    'Learn PKI fundamentals, build certificate chains hands-on, and explore PQC migration.',
  whyThisMatters:
    "PKI is the trust infrastructure everything else in this curriculum assumes exists — certificate chains, revocation, and CA hierarchies are what make 'this key belongs to this identity' a claim anyone can verify.",
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 5,
  learnSections: [
    { id: 'fundamentals', label: 'PKI Fundamentals' },
    { id: 'cert-structure', label: 'Certificate Structure' },
    { id: 'ca-hierarchy', label: 'CA Hierarchies' },
    { id: 'lifecycle', label: 'Certificate Lifecycle' },
    { id: 'pqc-pki', label: 'PQC PKI Migration Path' },
  ],
  workshopSteps: [
    { id: 'csr', label: 'Certificate Signing Request' },
    { id: 'root-ca', label: 'Root CA Setup' },
    { id: 'sign', label: 'Certificate Signing' },
    { id: 'parse', label: 'Certificate Parsing' },
    { id: 'revoke', label: 'Certificate Revocation' },
    { id: 'mtc', label: 'Merkle Tree Certificates' },
  ],
  playgroundTool: 'pki-workshop',
  taxonomy: { algorithms: ['ML-DSA', 'ECDSA', 'RSA'], standards: ['X.509', 'FIPS 204'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PKIWorkshop })),
}

export default manifest
