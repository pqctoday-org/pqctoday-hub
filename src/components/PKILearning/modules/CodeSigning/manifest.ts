// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'code-signing',
  whyThisMatters:
    "A forged signature on a software update is a supply-chain compromise at scale — code signing is one of the few PQC migrations where the attacker doesn't need to break today's crypto, just tomorrow's.",
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'binary-signing',
    text: 'Pick ML-DSA-44, 65 or 87 in Binary Signing. Explore placeholder outputs in the walkthrough, or enable Live HSM Mode, generate sample keys and choose Sign and check sample. The live check verifies a signature on your message; the separately displayed SHA-256 value is its fingerprint.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CodeSigningModule })),
}

export default manifest
