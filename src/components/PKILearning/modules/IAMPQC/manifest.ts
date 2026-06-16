// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'iam-pqc',
  lm_id: 'LM-028',
  title: 'Identity & Access Management with PQC',
  description:
    'Migrate enterprise IAM systems to quantum-safe cryptography. Covers JWT/SAML token signing with ML-DSA, OIDC and OAuth 2.0 PQC migration, Active Directory and LDAP vulnerabilities, vendor roadmaps (Okta, Microsoft Entra, PingFederate, ForgeRock), and PQC-aware zero trust identity architecture.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 1,
  learnSections: [
    { id: 'iam-crypto-foundations', label: 'Crypto in IAM: Tokens, Certificates, MFA' },
    { id: 'token-migration', label: 'JWT, SAML, and OIDC Token Signing with ML-DSA' },
    {
      id: 'directory-services',
      label: 'Active Directory, LDAP, and Kerberos Under Quantum Threat',
    },
    { id: 'vendor-roadmaps', label: 'Okta, Entra, PingFederate, ForgeRock Migration Paths' },
    { id: 'zero-trust-identity', label: 'PQC-Aware Zero Trust Identity Architecture' },
  ],
  workshopSteps: [
    { id: 'iam-crypto-inventory', label: 'IAM Crypto Inventory' },
    { id: 'token-migration-lab', label: 'Token Migration Lab' },
    { id: 'directory-services', label: 'Directory Services Analyzer' },
    { id: 'vendor-readiness', label: 'Vendor Readiness Scorer' },
    { id: 'zero-trust-identity', label: 'Zero Trust Identity Architect' },
  ],
  load: () => import('./index').then((m) => ({ default: m.IAMPQCModule })),
}

export default manifest
