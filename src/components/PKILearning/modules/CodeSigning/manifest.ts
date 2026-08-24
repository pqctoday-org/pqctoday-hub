// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'code-signing',
  contentVersion: 2,
  lm_id: 'LM-029',
  title: 'Code Signing',
  description:
    'Protect software distribution — from classical code signing to post-quantum ML-DSA package integrity, Sigstore keyless signing, and secure boot firmware verification.',
  whyThisMatters:
    "A forged signature on a software update is a supply-chain compromise at scale — code signing is one of the few PQC migrations where the attacker doesn't need to break today's crypto, just tomorrow's.",
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 4,
  learnSections: [
    { id: 'classical', label: 'Classical vs PQC Signing' },
    { id: 'packages', label: 'Package Signing RPM/APT' },
    { id: 'sigstore', label: 'Sigstore Keyless Signing' },
    { id: 'secure-boot', label: 'Secure Boot Trust Chains' },
  ],
  workshopSteps: [
    { id: 'binary-signing', label: 'Binary Signing' },
    { id: 'cert-chain', label: 'Certificate Chain' },
    { id: 'package-signing', label: 'Package Signing' },
    { id: 'sigstore-flow', label: 'Sigstore Flow' },
    { id: 'secure-boot', label: 'Secure Boot Chain' },
  ],
  playgroundTool: 'firmware-signing',
  taxonomy: { algorithms: ['ML-DSA', 'LMS/XMSS'], standards: ['FIPS 204', 'NIST SP 800-208'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CodeSigningModule })),
}

export default manifest
