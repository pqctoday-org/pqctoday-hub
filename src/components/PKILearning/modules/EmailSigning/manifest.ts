// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'email-signing',
  contentVersion: 5,
  lm_id: 'LM-010',
  title: 'Email & Document Signing',
  description:
    "S/MIME and CMS: signing workflows, KEM-based encryption (RFC 9629), PQC migration for email security — and OpenPGP's PQC profile (RFC 9980).",
  duration: '40 min',
  whyThisMatters:
    'Signatures are long-lived: one trusted for 10 years must resist a quantum attacker who shows up in year 5.',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 7,
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
  playgroundTool: 'email-signing',
  taxonomy: { algorithms: ['ML-DSA'], standards: ['JOSE', 'X.509'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EmailSigningModule })),
}

export default manifest
