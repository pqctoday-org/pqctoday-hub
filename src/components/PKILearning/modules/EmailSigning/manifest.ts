// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'email-signing',
  lm_id: 'LM-010',
  title: 'Email & Document Signing',
  description:
    'S/MIME and CMS: signing workflows, KEM-based encryption (RFC 9629), and PQC migration for email security.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 7,
  learnSections: [
    { id: 'smime', label: 'S/MIME, CMS & KEM Encryption' },
    { id: 'cms', label: 'Certificate Requirements & Migration' },
  ],
  workshopSteps: [
    { id: 'smime-cert', label: 'S/MIME Certificates' },
    { id: 'cms-signing', label: 'CMS Signing' },
    { id: 'cms-encryption', label: 'CMS Encryption' },
  ],
  playgroundTool: 'email-signing',
  taxonomy: { algorithms: ['ML-DSA'], standards: ['JOSE', 'X.509'] },
  load: () => import('./index').then((m) => ({ default: m.EmailSigningModule })),
}

export default manifest
