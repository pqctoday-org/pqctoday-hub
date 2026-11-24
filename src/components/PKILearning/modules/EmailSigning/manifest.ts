// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'email-signing',
  whyThisMatters:
    'Signatures are long-lived: one trusted for 10 years must resist a quantum attacker who shows up in year 5.',
  learnSections: [
    { id: 'smime', label: 'S/MIME CMS & KEM' },
    { id: 'cms', label: 'Certificate Migration' },
  ],
  workshopSteps: [
    { id: 'smime-cert', label: 'S/MIME Certificates' },
    { id: 'cms-signing', label: 'CMS Signing' },
    { id: 'cms-encryption', label: 'CMS Encryption' },
    { id: 'live-hsm', label: 'Live HSM Provider' },
  ],
  startHere: {
    step: 'cms-signing',
    text: 'Walk the CMS SignedData workflow in step 2: the ASN.1 structure is shown field by field, so you see where the ML-DSA signature and its certificate sit.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EmailSigningModule })),
}

export default resolveManifest(manifest)
