// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'stateful-signatures',
  lm_id: 'LM-026',
  title: 'Stateful Hash Signatures',
  description:
    'Master LMS/HSS and XMSS/XMSS^MT: Merkle tree signatures, parameter trade-offs, and critical state management.',
  duration: '40 min',
  difficulty: 'advanced',
  frameworkPhase: 'foundations',
  track: 'Software Infrastructure',
  trackOrder: 6,
  learnSections: [
    { id: 'lms', label: 'Why Stateful Signatures & Merkle Trees' },
    { id: 'xmss', label: 'LMS/HSS & XMSS/XMSS^MT' },
    { id: 'state', label: 'The State Problem & Resources' },
  ],
  workshopSteps: [
    { id: 'lms-keygen', label: 'LMS Key Generation' },
    { id: 'xmss-keygen', label: 'XMSS Key Generation' },
    { id: 'state-management', label: 'State Management' },
    { id: 'slh-dsa-live', label: 'SLH-DSA Live Demo' },
  ],
  playgroundTool: 'lms-hss',
  taxonomy: { algorithms: ['LMS/XMSS'], standards: ['NIST SP 800-208'] },
  load: () => import('./index').then((m) => ({ default: m.StatefulSignaturesModule })),
}

export default manifest
