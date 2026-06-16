// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'digital-id',
  lm_id: 'LM-030',
  title: 'Digital ID',
  description:
    'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 5,
  learnSections: [
    { id: 'eidas', label: 'eIDAS 2.0 Framework Overview' },
    { id: 'wallet', label: 'EUDI Wallet Architecture' },
    { id: 'pid', label: 'PID Issuance & Attestations' },
    { id: 'selective-disclosure', label: 'Selective Disclosure & Verifiable Credentials' },
    { id: 'qes', label: 'Qualified Electronic Signatures (QES)' },
  ],
  workshopSteps: [
    { id: 'wallet', label: 'EUDI Wallet' },
    { id: 'pid-issuer', label: 'PID Issuer' },
    { id: 'attestation', label: 'University Attestation' },
    { id: 'relying-party', label: 'Relying Party' },
    { id: 'qes', label: 'Qualified Electronic Signature' },
  ],
  playgroundTool: 'digital-id',
  taxonomy: { algorithms: ['ML-DSA'], standards: ['X.509'] },
  load: () => import('./index').then((m) => ({ default: m.DigitalIDModule })),
}

export default manifest
