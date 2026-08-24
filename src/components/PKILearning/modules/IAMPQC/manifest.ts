// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'iam-pqc',
  contentVersion: 2,
  lm_id: 'LM-028',
  title: 'Identity & Access Management with PQC',
  description:
    'Migrate enterprise IAM systems to quantum-safe cryptography. Covers JWT/SAML token signing with ML-DSA, OIDC and OAuth 2.0 PQC migration, Active Directory and LDAP vulnerabilities, vendor roadmaps (Okta, Microsoft Entra, PingFederate, ForgeRock), and PQC-aware zero trust identity architecture.',
  whyThisMatters:
    'Identity is the perimeter now — every JWT, SAML assertion, and OIDC token your IAM stack signs is a target, and Okta, Entra, PingFederate, and ForgeRock are all on different PQC timelines you have to track.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 1,
  learnSections: [
    { id: 'iam-crypto-foundations', label: 'IAM Crypto: Tokens & MFA' },
    { id: 'token-migration', label: 'JWT SAML OIDC Signing' },
    {
      id: 'directory-services',
      label: 'Directory Kerberos Threat',
    },
    { id: 'vendor-roadmaps', label: 'IAM Vendor Roadmaps' },
    { id: 'zero-trust-identity', label: 'PQC Zero Trust Identity' },
    { id: 'federation-eap', label: 'Identity Federation & EAP' },
  ],
  workshopSteps: [
    { id: 'iam-crypto-inventory', label: 'IAM Crypto Inventory' },
    { id: 'token-migration-lab', label: 'Token Migration Lab' },
    { id: 'directory-services', label: 'Directory Services Analyzer' },
    { id: 'vendor-readiness', label: 'Vendor Readiness Scorer' },
    { id: 'zero-trust-identity', label: 'Zero Trust Identity Architect' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.IAMPQCModule })),
}

export default manifest
