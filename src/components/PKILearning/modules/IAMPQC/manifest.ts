// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'iam-pqc',
  whyThisMatters:
    'Public-key signatures in JWTs, SAML assertions, and OIDC tokens may eventually need post-quantum algorithms; HMAC-signed tokens use symmetric cryptography and have a different quantum risk. Track vendor support by feature: Microsoft now targets a full quantum-safe Entra authentication transition by 2033, while token-signing algorithm availability remains a separate implementation question.',
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.IAMPQCModule })),
}

export default resolveManifest(manifest)
