// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'iam-pqc',
  contentVersion: 19,
  lm_id: 'LM-028',
  title: 'Identity & Access Management with PQC',
  description:
    'Migrate enterprise IAM systems to quantum-safe cryptography. Covers JWT/SAML token signing with ML-DSA, OIDC and OAuth 2.0 PQC migration, Active Directory and LDAP vulnerabilities, vendor roadmaps (Okta, Microsoft Entra, PingFederate, ForgeRock), and PQC-aware zero trust identity architecture.',
  whyThisMatters:
    'Public-key signatures in JWTs, SAML assertions, and OIDC tokens may eventually need post-quantum algorithms; HMAC-signed tokens use symmetric cryptography and have a different quantum risk. Track vendor support by feature: Microsoft now targets a full quantum-safe Entra authentication transition by 2033, while token-signing algorithm availability remains a separate implementation question.',
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
    { id: 'identity-proxy', label: 'Identity Proxy' },
  ],
  startHere: {
    step: 'token-migration-lab',
    text: 'Migrate a SAML or JWT signature to ML-DSA in the Token Migration step: the signature sizes and header changes are compared on the same token.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['FIPS 140-3', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.IAMPQCModule })),
}

export default manifest
